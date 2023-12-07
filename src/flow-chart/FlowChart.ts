/* eslint-disable class-methods-use-this, @typescript-eslint/no-explicit-any */
import type { Connection as IJsPlumbConnection } from '@jsplumb/browser-ui/types/core/connector/connection-impl';

import interact from 'interactjs';
import lodashGet from 'lodash.get';
import lodashMerge from 'lodash.merge';
import jQuery from 'jquery';
import throttle from 'lodash.throttle';

import {
  AnchorLocations,
  BlankEndpoint,
  BrowserJsPlumbInstance,
  Connection as JsPlumbConnection,
  DotEndpoint,
  LabelOverlay,
  newInstance,
} from '@jsplumb/browser-ui';

import {
  IFcAnchor,
  IFcConfig,
  IFcConnection,
  IFcNode, IFcNodeType,
  IFcOptions,
} from '@/flow-chart/commons/configs/types';

import {
  CIRCLE_NODE_TYPE,
  DIAMOND_NODE_TYPE,
  RECTANGLE_NODE_TYPE,
  STEP_INDEX_HIGHLIGHT,
} from '@/flow-chart/commons/configs/commons';

import { toFixedNumber } from './commons/utils/number';

import {
  DEFAULT_OPTIONS,
  DEFAULT_STEP_INDEX_ATTR_VALUE,
  EVENTS, FC_CONNECTION_TYPE,
  FC_CSS_CLASS_NAMES,
  JS_PLUMB_DEFAULTS,
  NODE_HTML_RENDER,
  NODE_SKELETON_HTML_RENDER,
  STEP_INDEX_ATTR_NAME,
} from './commons/configs/constants';

export type IJQuery = JQuery<HTMLElement>;

export class FlowChart {
  /** stage element  */
  private readonly el: HTMLElement;

  private readonly $stage: IJQuery;

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

    this.$stage = jQuery(el);

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
        const fcConnection = jsPlumbConnection ? this.getFcConnectionConfig(jsPlumbConnection) : null;
        this.emit(EVENTS.SELECT_CONNECTION, fcConnection);

        return;
      }

      this.emit(EVENTS.UNSELECT_ALL);
    }, 200, { trailing: false });

    this.$stage
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

  private isExistElement(jqObject: IJQuery) {
    return jqObject.length > 0;
  }

  private getElementFromJqObject(jqObject: IJQuery) {
    return jqObject.get(0) as HTMLElement;
  }

  private removeSelectedCssClass() {
    const selector = `.${FC_CSS_CLASS_NAMES.Node}, .${FC_CSS_CLASS_NAMES.Connection}`;

    this.$stage
      .find(selector)
      .removeClass(FC_CSS_CLASS_NAMES.Selected);
  }

  private onClickNode($fcNode: IJQuery) {
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

    this.$stage
      .on(EVENTS.DBLCLICK, dblclickHandler);
  }

  private onDoubleClickNode($fcNode: IJQuery) {
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

    this.$stage
      .on(EVENTS.MOUSEOVER, (event: JQuery.TriggeredEvent) => {
        isMouseOverStage = event.target === this.el;

        if (isMouseOverStage) {
        // console.log('mouse over stage');
        }
      })
      .on(EVENTS.MOUSELEAVE, (event: JQuery.TriggeredEvent) => {
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

    const nodes = this.getAllFcNodes();

    if (type === STEP_INDEX_HIGHLIGHT) {
      const currentStepIndex = value as number;

      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];

        if (currentStepIndex === -1) {
          this.setHighlightOfFcNode(node, false);
          return;
        }

        const stepIndex = this.getStepIndexOfFcNode(node);

        if (stepIndex <= currentStepIndex) {
          this.setHighlightOfFcNode(node, false);
          return;
        }

        this.setHighlightOfFcNode(node, true);
      }
    }
  }

  setHighlightOfFcNode(el: HTMLElement | IJQuery, isHighlight = true) {
    const $el = el instanceof HTMLElement ? jQuery(el) : el;

    if (isHighlight) {
      $el.addClass(FC_CSS_CLASS_NAMES.Disabled);
      return;
    }

    $el.removeClass(FC_CSS_CLASS_NAMES.Disabled);
  }

  showLineBalls($fcNode: IJQuery) {
    const el = $fcNode.get(0) as HTMLElement;

    const jsplumbConnections = this.jsPlumbInstance.getConnections({ source: el }) as IJsPlumbConnection[];

    for (let i = 0, len = jsplumbConnections.length; i < len; i += 1) {
      const jsplumbConnection = jsplumbConnections[i];

      const { connector } = jsplumbConnection;
      const svgElement = (connector as any).canvas as SVGElement;

      const path = this.jsPlumbInstance.getPathData(connector);
      const position: JQuery.Coordinates = jQuery(svgElement).position();

      this.$stage
        .find('.fc-line-ball')
        .show()
        .css({
          left: position.left,
          top: position.top,
          'offset-path': `path('${path}')`,
        });
    }
  }

  private addSelectedCssClass($el: IJQuery) {
    $el.addClass(FC_CSS_CLASS_NAMES.Selected);
  }

  private onClickConnection(connection: IJQuery | JsPlumbConnection) {
    if (connection instanceof JsPlumbConnection) {
      console.log(connection);
    } else {
      this.addSelectedCssClass(connection);
    }
  }

  getOptions() {
    return this.options;
  }

  getStageElement() {
    return this.el;
  }

  getFlowChartConfig() {
    const fcConfig: IFcConfig = { connections: [], nodes: [] };

    this.buildNodesConfig(fcConfig);

    this.buildConnectionsConfig(fcConfig);

    return fcConfig;
  }

  private buildNodesConfig(fcConfig: IFcConfig) {
    const nodes = this.getAllFcNodes();

    const fcNodes: IFcNode[] = [];

    nodes.forEach((el) => {
      fcNodes.push(this.getFcNodeConfig(el));
    });

    this.addFcNodesToConfig(fcNodes, fcConfig);
  }

  private getAllFcNodes() {
    const $nodes = this.$stage.find(this.getCssClassSelector(FC_CSS_CLASS_NAMES.Node));
    return Array.from($nodes);
  }

  private buildConnectionsConfig(config: IFcConfig) {
    const jsPlumbConnections = this.jsPlumbInstance.getConnections() as IJsPlumbConnection[];

    for (let i = 0, len = jsPlumbConnections.length; i < len; i += 1) {
      const jsPlumbConnection = jsPlumbConnections[i];

      const fcConnection = this.getFcConnectionConfig(jsPlumbConnection);

      this.addFcConnectionsToConfig([fcConnection], config);
    }
  }

  private getFcConnectionConfig(jsPlumbConnection: IJsPlumbConnection) {
    const { sourceId, targetId } = jsPlumbConnection;

    const sourceAnchor = lodashGet(jsPlumbConnection, 'endpoints.0._anchor.type') as IFcAnchor;
    const targetAnchor = lodashGet(jsPlumbConnection, 'endpoints.1._anchor.type') as IFcAnchor;

    const label = this.getLabelOfJsplumbConnection(jsPlumbConnection);

    return {
      type: FC_CONNECTION_TYPE,
      sourceId,
      sourceAnchor,
      targetId,
      targetAnchor,
      label,
    };
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

  private addFcConnectionsToConfig(connections: IFcConnection[], config: IFcConfig) {
    for (let i = 0; i < connections.length; i += 1) {
      config.connections.push(connections[i]);
    }
  }

  private addFcNodesToConfig(nodes: IFcNode[], config: IFcConfig) {
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];

      const isExist = config.nodes.findIndex((item) => item.id === node.id) !== -1;

      if (isExist) {
        return;
      }

      config.nodes.push(node);
    }
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

  private getContentOfFcNode(fcNode: HTMLElement | IJQuery) {
    let $fcNode: IJQuery;

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

    const $node = this.$stage.find(selector);

    return this.getElementFromJqObject($node);
  }

  getSelectedJsPlumbConnection() {
    const selector = `.${FC_CSS_CLASS_NAMES.Selected}.${FC_CSS_CLASS_NAMES.Connection}`;

    const connectionElement = this.$stage.find(selector).get(0);

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
