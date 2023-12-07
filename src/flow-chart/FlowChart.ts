/* eslint-disable class-methods-use-this */
import type {
  Connection as IJsPlumbConnection,
} from '@jsplumb/browser-ui/types/core/connector/connection-impl';

import {
  AnchorLocations,
  BlankEndpoint,
  BrowserJsPlumbInstance,
  Connection as JsPlumbConnection,
  DotEndpoint,
  FlowchartConnector,
  LabelOverlay,
  newInstance,
} from '@jsplumb/browser-ui';

import interact from 'interactjs';
import lodashGet from 'lodash.get';
import lodashMerge from 'lodash.merge';
import jQuery from 'jquery';
import throttle from 'lodash.throttle';

import {
  IFcAnchor,
  IFcConfig,
  IFcConnection,
  IFcNode,
  IFcNodeType,
  IFcOptions,
} from '@/flow-chart/commons/configs/types';

import { toFixedNumber } from './commons/utils/number';

import {
  CIRCLE_NODE_TYPE,
  DEFAULT_OPTIONS,
  DEFAULT_STEP_INDEX_ATTR_VALUE,
  DIAMOND_NODE_TYPE,
  EVENTS,
  FC_CSS_CLASS_NAMES,
  JS_PLUMB_DEFAULTS,
  NODE_HTML_RENDER,
  NODE_SKELETON_HTML_RENDER,
  RECTANGLE_NODE_TYPE,
  STEP_INDEX_ATTR_NAME,
  STEP_INDEX_HIGHLIGHT,
} from './commons/configs/constants';

export class FlowChart {
  /** stage element  */
  private readonly el: HTMLElement;

  private readonly jsPlumbInstance: BrowserJsPlumbInstance;

  private eventHandlers = {
    [EVENTS.SELECT_NODE]: [] as Array<(payload: IFcNode) => void>,
    [EVENTS.SELECT_CONNECTION]: [] as Array<(payload: IFcConnection) => void>,
    [EVENTS.UNSELECT_ALL]: [] as Array<() => void>,
    [EVENTS.WHEEL]: [] as Array<(scale: number) => void>,
    [EVENTS.STAGE_MOVE]: [] as Array<(offset: { x: number, y: number }) => void>,
  };

  private readonly options: Required<IFcOptions>;

  constructor(el: HTMLElement, options?: IFcOptions) {
    this.el = el;

    this.options = lodashMerge({}, DEFAULT_OPTIONS, options);

    this.jsPlumbInstance = this.createJsPlumbInstance();

    this.buildFlowChart();

    this.bindListeners();

    this.updateHighlights();

    this.updateStageScaleAndOffset();
  }

  private createJsPlumbInstance() {
    const jsPlumbInstance = newInstance({
      container: this.el,
    });

    const defaults = JS_PLUMB_DEFAULTS();

    defaults.endpoint.type = this.options.node.endpoint.show ? DotEndpoint.type : BlankEndpoint.type;

    jsPlumbInstance.importDefaults(defaults);

    return jsPlumbInstance;
  }

  private buildFlowChart() {
    const { config } = this.options;

    if (config == null) {
      console.warn('this.options.config is None');
      return;
    }

    const { nodes, connections } = config;

    this.createFcNodes(nodes);

    this.createFcConnections(connections);

    this.updateVisibleOfEndpoints();
  }

  private createFcNodes(fcNodes: IFcNode[]) {
    for (let i = 0, len = fcNodes.length; i < len; i += 1) {
      this.createFcNode(fcNodes[i]);
    }
  }

  private createFcNode(fcNode: IFcNode) {
    const { id, type } = fcNode;

    const html = NODE_HTML_RENDER({
      ...fcNode,
      type: type.toLowerCase(),
    });

    const el = jQuery(html).get(0) as HTMLElement;

    this.createFcNodeWithElement(el, id);
  }

  createFcNodeWithElement(el: HTMLElement, managedId?: string) {
    this.el.appendChild(el);

    this.jsPlumbInstance.manage(el, managedId);

    this.createEndpointsForFcNode(el);
  }

  private createEndpointsForFcNode(el: HTMLElement) {
    this.jsPlumbInstance.addEndpoints(el, [
      {
        source: true, target: true, anchor: AnchorLocations.Top, maxConnections: -1,
      },
      {
        source: true, target: true, anchor: AnchorLocations.Right, maxConnections: -1,
      },
      {
        source: true, target: true, anchor: AnchorLocations.Bottom, maxConnections: -1,
      },
      {
        source: true, target: true, anchor: AnchorLocations.Left, maxConnections: -1,
      },
    ]);
  }

  private createFcConnections(fcConnections: IFcConnection[]) {
    for (let i = 0, len = fcConnections.length; i < len; i += 1) {
      this.createFcConnection(fcConnections[i]);
    }
  }

  private createFcConnection(fcConnection: IFcConnection) {
    const {
      sourceId,
      sourceAnchor,
      targetId,
      targetAnchor,
      label,
    } = fcConnection;

    this.jsPlumbInstance.connect({
      source: this.getElementByManagedId(sourceId),
      target: this.getElementByManagedId(targetId),
      anchors: [sourceAnchor, targetAnchor],
      overlays: [
        {
          type: LabelOverlay.type,
          options: {
            label,
          },
        },
      ],
    });
  }

  private getElementByManagedId(id: string) {
    return this.jsPlumbInstance.getManagedElement(id) as HTMLElement;
  }

  updateVisibleOfEndpoints() {
    const { show } = this.options.node.endpoint;

    this.jsPlumbInstance.selectEndpoints().each((endpoint) => {
      this.jsPlumbInstance.setEndpointVisible(endpoint, show);
    });
  }

  private bindListeners() {
    this.bindNormalEventListeners();
    this.bindDragStage();
  }

  private bindNormalEventListeners() {
    this.bindMousedownListener();

    this.bindDoubleClickListener();

    this.bindMouseWheelListener();
  }

  private bindMousedownListener() {
    const debouncedMousedownHandler = throttle((event: JQuery.TriggeredEvent) => {
      const { target } = event;

      this.removeSelectedCssClass();

      const $fcNode = this.isContainTarget(target, FC_CSS_CLASS_NAMES.Node);

      if ($fcNode) {
        this.onClickNode($fcNode);
        this.emit(EVENTS.SELECT_NODE, this.getFcNodeConfig(this.getElementFromJqObject($fcNode)));
        return;
      }

      const $fcConnection = this.isContainTarget(target, FC_CSS_CLASS_NAMES.Connection);

      if ($fcConnection) {
        this.onClickConnection($fcConnection);

        const jsPlumbConnection = this.getSelectedJsPlumbConnection();
        const fcConnection = jsPlumbConnection ? this.buildConfigOfFcConnection(jsPlumbConnection) : null;
        this.emit(EVENTS.SELECT_CONNECTION, fcConnection);

        return;
      }

      this.emit(EVENTS.UNSELECT_ALL);
    }, 200, { trailing: false });

    jQuery(this.el)
      .on(EVENTS.MOUSEDOWN, debouncedMousedownHandler);
  }

  private isContainTarget(target: HTMLElement, cssClassName: string) {
    const $target = jQuery(target);
    const cssClassSelector = this.getCssClassSelector(cssClassName);

    if ($target.is(cssClassSelector)) {
      return $target;
    }

    const $ancestor = $target.closest(cssClassSelector);

    if (!this.isExistElement($ancestor)) {
      return null;
    }

    return $ancestor;
  }

  private getCssClassSelector(cssClassName: string) {
    return cssClassName.startsWith('.') ? cssClassName : `.${cssClassName}`;
  }

  private isExistElement(jqObject: JQuery<HTMLElement>) {
    return jqObject.length > 0;
  }

  private getElementFromJqObject(jqObject: JQuery<HTMLElement>) {
    return jqObject.get(0) as HTMLElement;
  }

  private removeSelectedCssClass() {
    const selector = `.${FC_CSS_CLASS_NAMES.Node}, .${FC_CSS_CLASS_NAMES.Connection}`;

    jQuery(this.el).find(selector).removeClass(FC_CSS_CLASS_NAMES.Selected);
  }

  private onClickNode($fcNode: JQuery<HTMLElement>) {
    this.addSelectedCssClass($fcNode);

    // this.showLineBalls($fcNode);

    // add skeleton element
    const hasSkeleton = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeSkeleton}`).length > 0;

    if (hasSkeleton) {
      return;
    }

    $fcNode.append(NODE_SKELETON_HTML_RENDER({}));
  }

  private bindDoubleClickListener() {
    const dblclickHandler = (event: JQuery.TriggeredEvent) => {
      const { target } = event;

      const $fcNode = this.isContainTarget(target, FC_CSS_CLASS_NAMES.Node);

      if ($fcNode) {
        this.onDoubleClickNode($fcNode);
      }
    };

    jQuery(this.el)
      .on(EVENTS.DBLCLICK, dblclickHandler);
  }

  private onDoubleClickNode($fcNode: JQuery<HTMLElement>) {
    const $nodeText = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeContent}`);

    $nodeText
      .prop('contenteditable', 'true')
      .trigger('focus')
      .one(EVENTS.BLUR, () => {
        console.log(EVENTS.BLUR);
        $nodeText.removeAttr('contenteditable');
      });
  }

  private bindMouseWheelListener() {
    const mousewheelHandler = (event: JQuery.TriggeredEvent) => {
      event.stopPropagation();

      const wheelEvent = event.originalEvent as WheelEvent;
      const { deltaY } = wheelEvent;

      if (deltaY < 0) {
        this.decreaseScale();
      } else {
        this.increaseScale();
      }

      this.emit(EVENTS.WHEEL, this.options.stage.scale.value);
    };

    jQuery(this.el.parentElement as HTMLElement)
      .on(EVENTS.WHEEL, mousewheelHandler);
  }

  decreaseScale() {
    const {
      value: scale,
      step: scaleStep,
      min: minScale,
    } = this.options.stage.scale;

    if (scale <= minScale) {
      return;
    }

    this.options.stage.scale.value = toFixedNumber(scale - scaleStep);

    this.updateStageScaleAndOffset();
  }

  increaseScale() {
    const {
      value: scale,
      step: scaleStep,
      max: maxScale,
    } = this.options.stage.scale;

    if (scale >= maxScale) {
      return;
    }

    this.options.stage.scale.value = toFixedNumber(scale + scaleStep);

    this.updateStageScaleAndOffset();
  }

  updateStageScaleAndOffset() {
    const {
      scale: { value: scale },
      offset: { x, y },
    } = this.options.stage;

    this.el.style.transform = `scale(${scale}) translateX(${x}px) translateY(${y}px)`;

    this.jsPlumbInstance.setZoom(scale);
  }

  private bindDragStage() {
    const stageContainerElement = this.el.parentElement as HTMLElement;

    let isStageMovable = false;
    let isMouseOverStage = false;

    jQuery(this.el)
      .on(EVENTS.MOUSEOVER, (event) => {
        isMouseOverStage = event.target === this.el;

        if (isMouseOverStage) {
        // console.log('mouse over stage');
        }
      })
      .on(EVENTS.MOUSELEAVE, (event) => {
        if (event.target === this.el) {
          isMouseOverStage = false;
        }
      });

    interact(stageContainerElement)
      .draggable({
        autoScroll: true,
        cursorChecker: () => 'default',
        listeners: {
          start: () => {
            isStageMovable = isMouseOverStage;
          },
          move: (event) => {
            const { dx, dy } = event;

            if (!isStageMovable) {
              return;
            }

            this.options.stage.offset.x += dx;
            this.options.stage.offset.y += dy;

            this.emit(EVENTS.STAGE_MOVE, this.options.stage.offset);

            this.updateStageScaleAndOffset();
          },
        },
      });
  }

  updateHighlights() {
    const {
      highlight: { type, value },
    } = this.options;

    const $allNodes = this.getAllFcNodes();

    if (type === STEP_INDEX_HIGHLIGHT) {
      const currentStepIndex = value as number;

      $allNodes.each((index, element) => {
        if (currentStepIndex === -1) {
          this.setHighlightOfFcNode(element, false);
          return;
        }

        const stepIndex = this.getStepIndexOfFcNode(element);

        if (stepIndex <= currentStepIndex) {
          this.setHighlightOfFcNode(element, false);
          return;
        }

        this.setHighlightOfFcNode(element, true);
      });
    }
  }

  setHighlightOfFcNode(el: HTMLElement | JQuery<HTMLElement>, isHighlight = true) {
    const $el = el instanceof HTMLElement ? jQuery(el) : el;

    if (isHighlight) {
      $el.addClass(FC_CSS_CLASS_NAMES.Disabled);
      return;
    }

    $el.removeClass(FC_CSS_CLASS_NAMES.Disabled);
  }

  private showLineBalls($fcNode: JQuery<HTMLElement>) {
    const el = $fcNode.get(0) as HTMLElement;

    const jsplumbConnections = this.jsPlumbInstance.getConnections({ source: el }) as IJsPlumbConnection[];

    for (let i = 0, len = jsplumbConnections.length; i < len; i += 1) {
      const jsplumbConnection = jsplumbConnections[i];

      const { connector } = jsplumbConnection;
      const svgElement = (connector as any).canvas as SVGElement;

      const path = this.jsPlumbInstance.getPathData(connector);
      const position = jQuery(svgElement).position();

      jQuery(this.el)
        .find('.fc-line-ball')
        .show()
        .css({
          left: position.left,
          top: position.top,
          'offset-path': `path('${path}')`,
        });
    }
  }

  private addSelectedCssClass($el: JQuery<HTMLElement>) {
    $el.addClass(FC_CSS_CLASS_NAMES.Selected);
  }

  private onClickConnection(connection: JQuery<HTMLElement> | JsPlumbConnection) {
    if (connection instanceof JsPlumbConnection) {
      console.log(connection);
    } else {
      this.addSelectedCssClass(connection);
    }
  }

  getJsPlumbInstance() {
    return this.jsPlumbInstance;
  }

  getOptions() {
    return this.options;
  }

  getStageElement() {
    return this.el;
  }

  getFlowChartConfig() {
    const config: IFcConfig = this.buildConfig();

    this.buildConfigOfUnconnectedFcNodes(config);

    return config;
  }

  private buildConfig() {
    const fcConfig: IFcConfig = { nodes: [], connections: [] };

    const jsPlumbConnections = this.jsPlumbInstance.getConnections() as IJsPlumbConnection[];

    for (let i = 0, len = jsPlumbConnections.length; i < len; i += 1) {
      const jsPlumbConnection = jsPlumbConnections[i];

      const fcConnection = this.buildConfigOfFcConnection(jsPlumbConnection);

      const fcNodes = this.buildConfigOfFcNodes(jsPlumbConnection);

      fcConfig.connections.push(fcConnection);

      this.addFcNodesToConfig(fcNodes, fcConfig);
    }

    return fcConfig;
  }

  private buildConfigOfFcConnection(jsPlumbConnection: IJsPlumbConnection) {
    const { sourceId, targetId } = jsPlumbConnection;

    const sourceAnchor = lodashGet(jsPlumbConnection, 'endpoints.0._anchor.type') as IFcAnchor;
    const targetAnchor = lodashGet(jsPlumbConnection, 'endpoints.1._anchor.type') as IFcAnchor;

    const label = this.getLabelOfJsplumbConnection(jsPlumbConnection);

    return {
      type: FlowchartConnector.type,
      sourceId,
      sourceAnchor,
      targetId,
      targetAnchor,
      label,
    };
  }

  private buildConfigOfFcNodes(jsPlumbConnection: IJsPlumbConnection): [IFcNode, IFcNode] {
    const { source, target } = jsPlumbConnection;

    return [
      this.getFcNodeConfig(source),
      this.getFcNodeConfig(target),
    ];
  }

  getFcNodeConfig(el: HTMLElement): IFcNode {
    const id = this.jsPlumbInstance.getId(el);
    const type = this.getTypeOfFcNode(el);
    const { html: content, text } = this.getContentOfFcNode(el);
    const position = this.getPositionOfFcNode(el);
    const stepIndex = this.getStepIndexOfFcNode(el);

    return {
      id, type, content, text, position, stepIndex,
    };
  }

  private addFcNodesToConfig(nodes: IFcNode[], config: IFcConfig) {
    nodes.forEach((node) => {
      const isExist = Boolean(config.nodes.find((item) => item.id === node.id));

      if (isExist) {
        return;
      }

      config.nodes.push(node);
    });
  }

  private buildConfigOfUnconnectedFcNodes(fcConfig: IFcConfig) {
    const $nodes = this.getAllFcNodes();

    const fcNodes: IFcNode[] = [];

    $nodes.each((index: number, el: HTMLElement) => {
      fcNodes.push(this.getFcNodeConfig(el));
    });

    this.addFcNodesToConfig(fcNodes, fcConfig);
  }

  private getAllFcNodes() {
    return jQuery(this.el).find(`.${FC_CSS_CLASS_NAMES.Node}`);
  }

  private getTypeOfFcNode(el: HTMLElement): IFcNodeType {
    if (el.classList.contains(FC_CSS_CLASS_NAMES.Circle)) {
      return CIRCLE_NODE_TYPE;
    }

    if (el.classList.contains(FC_CSS_CLASS_NAMES.Diamond)) {
      return DIAMOND_NODE_TYPE;
    }

    return RECTANGLE_NODE_TYPE;
  }

  private getStepIndexOfFcNode(el: HTMLElement) {
    const stepIndexStr = jQuery(el).attr(STEP_INDEX_ATTR_NAME) || DEFAULT_STEP_INDEX_ATTR_VALUE;

    return Number(stepIndexStr);
  }

  private getPositionOfFcNode(el: HTMLElement) {
    const x = parseFloat(el.style.left);
    const y = parseFloat(el.style.top);

    return { x, y };
  }

  private getContentOfFcNode(fcNode: HTMLElement | JQuery<HTMLElement>) {
    let $fcNode: JQuery<HTMLElement>;

    if (fcNode instanceof HTMLElement) {
      $fcNode = jQuery(fcNode);
    } else {
      $fcNode = fcNode;
    }

    const $content = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeContent}`);

    const html = $content.html();
    const text = $content.text();

    return { html, text };
  }

  removeFcNode(node: HTMLElement | IFcNode) {
    let el: HTMLElement;

    if (node instanceof HTMLElement) {
      el = node;
    } else {
      el = this.getElementByManagedId(node.id);
    }

    this.jsPlumbInstance.deleteConnectionsForElement(el);

    el.parentNode?.removeChild(el);
  }

  getSelectedFcNode() {
    const selector = `.${FC_CSS_CLASS_NAMES.Selected}.${FC_CSS_CLASS_NAMES.Node}`;

    return jQuery(this.el).find(selector).get(0);
  }

  getSelectedJsPlumbConnection() {
    const selector = `.${FC_CSS_CLASS_NAMES.Selected}.${FC_CSS_CLASS_NAMES.Connection}`;

    const connectionElement = jQuery(this.el).find(selector).get(0);

    if (!connectionElement) {
      return null;
    }

    return this.getJsPlumbConnectionBySvgElement(connectionElement);
  }

  private getJsPlumbConnectionBySvgElement(el: HTMLElement): IJsPlumbConnection | null {
    const connections = this.jsPlumbInstance.getConnections() as IJsPlumbConnection[];

    for (let i = 0, len = connections.length; i < len; i += 1) {
      const connection = connections[i];

      const svg: HTMLElement = (connection.connector as any).canvas;

      if (svg === el) {
        return connection;
      }
    }

    return null;
  }

  removeFcConnection(connection: IJsPlumbConnection) {
    this.jsPlumbInstance.deleteConnection(connection);
  }

  setLabelOfJsPlumbConnection(jsPlumbConnection: IJsPlumbConnection, label: string) {
    const labelOverlay = this.getLabelOverlayOfJsPlumbConnection(jsPlumbConnection);

    if (labelOverlay == null) {
      console.log('setLabelOfJsPlumbConnection(), labelOverlay is None');
      this.jsPlumbInstance.addOverlay(jsPlumbConnection, { type: LabelOverlay.type, options: { label } });
      return;
    }

    labelOverlay.setLabel(label);
  }

  getLabelOfJsplumbConnection(jsPlumbConnection: IJsPlumbConnection) {
    const labelOverlay = this.getLabelOverlayOfJsPlumbConnection(jsPlumbConnection);

    if (!labelOverlay) {
      return '';
    }

    return labelOverlay.labelText;
  }

  private getLabelOverlayOfJsPlumbConnection(jsPlumbConnection: IJsPlumbConnection) {
    const overlays = Object.values(jsPlumbConnection.getOverlays());

    const labelOverlay = overlays.find((item) => item instanceof LabelOverlay);

    if (!labelOverlay) {
      return null;
    }

    return labelOverlay as LabelOverlay;
  }

  emit(eventName: string, payload?: any) {
    const handlers = this.eventHandlers[eventName];

    if (!handlers) {
      return;
    }

    for (let i = 0, len = handlers.length; i < len; i += 1) {
      const handler = handlers[i];

      try {
        handler(payload);
      } catch (e) {
        console.log(e);
      }
    }
  }

  on(eventName: string, callback: (payload: any) => void) {
    const eventHandler = this.eventHandlers[eventName];

    if (!eventHandler) {
      throw new Error(`FlowChart.eventHandlers.${eventName} is None`);
    }

    eventHandler.push(callback);
  }

  changeFcNodeStepIndex(el: HTMLElement, stepIndex: number) {
    jQuery(el).attr(STEP_INDEX_ATTR_NAME, stepIndex);
  }

  setValueOfStepIndexHighlight(currentStepIndex: number | string) {
    this.options.highlight.value = Number(currentStepIndex);

    this.updateHighlights();
  }

  setHighlightType(type: IFcOptions['highlight']['type']) {
    this.options.highlight.type = type;

    this.updateHighlights();
  }

  setVisibleOfEndpoints(visible: boolean) {
    this.options.node.endpoint.show = visible;

    this.updateVisibleOfEndpoints();
  }

}
