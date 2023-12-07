/* eslint-disable class-methods-use-this */
import type {
  Connection as IJsPlumbConnection,
} from '@jsplumb/browser-ui/types/core/connector/connection-impl';

import {
  AnchorLocations,
  ArrowOverlay,
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

    this.bindListeners();

    this.createFlowChartWithConfig();

    this.updateHighlights();

    this.updateStageTransform();
  }

  private createJsPlumbInstance() {
    const jsPlumbInstance = newInstance({
      container: this.el,
    });

    const {
      node: {
        endpoint: {
          show: visibleOfEndpoints,
        },
      },
    } = this.options;

    jsPlumbInstance.importDefaults({
      connectionsDetachable: false,

      connector: {
        type: FlowchartConnector.type,
        options: {
          cornerRadius: 3,
        },
      },

      endpoint: {
        type: visibleOfEndpoints ? DotEndpoint.type : BlankEndpoint.type,
        options: {
          radius: 4,
        },
      },

      endpointStyle: {
        fill: '#fff',
        strokeWidth: 1,
        stroke: '#067bef',
      },

      paintStyle: { strokeWidth: 2, stroke: '#AAB7C4' },

      anchor: AnchorLocations.AutoDefault,

      connectionOverlays: [
        {
          type: ArrowOverlay.type,
          options: {
            location: 1,
            width: 10,
            length: 10,
          },
        },
      ],
    });

    return jsPlumbInstance;
  }

  private bindListeners() {
    this.bindNormalEventListeners();

    this.bindDragStage();
  }

  private bindNormalEventListeners() {
    const check = (target: HTMLElement, ancestorClassSelector: string) => {
      const ancestorSelector = ancestorClassSelector.startsWith('.') ? ancestorClassSelector : `.${ancestorClassSelector}`;
      const $target = jQuery(target);
      const $ancestor = $target.closest(ancestorSelector);
      const isAncestor = $ancestor.length > 0 || $target.is(ancestorSelector);

      if (!isAncestor) {
        return null;
      }

      return $ancestor;
    };

    const debouncedMousedownHandler = throttle((event: JQuery.TriggeredEvent) => {
      const { target } = event;

      this.removeSelectedCssClass();

      const $fcNode = check(target, FC_CSS_CLASS_NAMES.Node);

      if ($fcNode) {
        this.onClickNode($fcNode);
        this.emit(EVENTS.SELECT_NODE, this.getFcNodeConfig($fcNode.get(0) as HTMLElement));
        return;
      }

      const $fcConnection = check(target, FC_CSS_CLASS_NAMES.Connection);

      if ($fcConnection) {
        this.onClickConnection($fcConnection);

        const jsPlumbConnection = this.getSelectedJsPlumbConnection();
        const fcConnection = jsPlumbConnection ? this.buildConfigOfFcConnection(jsPlumbConnection) : null;
        this.emit(EVENTS.SELECT_CONNECTION, fcConnection);

        return;
      }

      this.emit(EVENTS.UNSELECT_ALL);
    }, 200, { trailing: false });

    const dblclickHandler = (event: JQuery.TriggeredEvent) => {
      const { target } = event;

      const $fcNode = check(target, FC_CSS_CLASS_NAMES.Node);

      if ($fcNode) {
        this.onDbClickNode($fcNode);
      }
    };

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

    jQuery(this.el)
      .on(EVENTS.MOUSEDOWN, debouncedMousedownHandler)
      .on(EVENTS.DBLCLICK, dblclickHandler);

    jQuery(this.el.parentElement as HTMLElement)
      .on(EVENTS.WHEEL, mousewheelHandler);
  }

  private bindDragStage() {
    const stageParentElement = this.el.parentElement as HTMLElement;
    const $stage = jQuery(this.el);

    let isStageMovable = false;

    let isMouseOverStage = false;

    $stage
      .on('mouseover', (event) => {
        isMouseOverStage = event.target === this.el;

        if (isMouseOverStage) {
        // console.log('mouse over stage');
        }
      })
      .on('mouseleave', (event) => {
        if (event.target === this.el) {
          isMouseOverStage = false;
        }
      });

    interact(stageParentElement)
      .draggable({
        autoScroll: true,
        cursorChecker: () => 'default',
        listeners: {
          start: () => {
            isStageMovable = isMouseOverStage;
          },
          move: (event) => {
            const {
              dx,
              dy,
            } = event;

            if (!isStageMovable) {
              return;
            }

            this.options.stage.offset.x += dx;
            this.options.stage.offset.y += dy;

            this.emit(EVENTS.STAGE_MOVE, this.options.stage.offset);

            this.updateStageTransform();
          },
        },
      });
  }

  updateHighlights() {
    const {
      highlight: {
        type,
        value,
      },
    } = this.options;
    const $node = this.getJqOfAllFcNodes();

    if (type === STEP_INDEX_HIGHLIGHT) {
      const currentStepIndex = value as number;

      $node.each((index, element) => {
        const $el = jQuery(element);

        if (currentStepIndex === -1) {
          $el.removeClass(FC_CSS_CLASS_NAMES.Disabled);
          return;
        }

        const stepIndex = this.getStepIndexOfFcNode(element);

        if (stepIndex <= currentStepIndex) {
          $el.removeClass(FC_CSS_CLASS_NAMES.Disabled);
          return;
        }

        $el.addClass(FC_CSS_CLASS_NAMES.Disabled);
      });
    }
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

  private removeSelectedCssClass() {
    const selector = `.${FC_CSS_CLASS_NAMES.Node}, .${FC_CSS_CLASS_NAMES.Connection}`;

    jQuery(this.el).find(selector).removeClass(FC_CSS_CLASS_NAMES.Selected);
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

  private onDbClickNode($fcNode: JQuery<HTMLElement>) {
    const $nodeText = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeContent}`);

    $nodeText
      .prop('contenteditable', 'true')
      .trigger('focus')
      .one(EVENTS.BLUR, () => {
        console.log(EVENTS.BLUR);
        $nodeText.removeAttr('contenteditable');
      });
  }

  getJsPlumbInstance() {
    return this.jsPlumbInstance;
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
    const $nodes = this.getJqOfAllFcNodes();

    const fcNodes: IFcNode[] = [];

    $nodes.each((index: number, el: HTMLElement) => {
      fcNodes.push(this.getFcNodeConfig(el));
    });

    this.addFcNodesToConfig(fcNodes, fcConfig);
  }

  private getJqOfAllFcNodes() {
    return jQuery(this.el).find(`.${FC_CSS_CLASS_NAMES.Node}`);
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

  createFlowChartWithConfig() {
    const { config } = this.options;

    if (!config) {
      return;
    }

    const { nodes, connections } = config;

    this.createFcNodesWithConfig(nodes);

    this.createFcConnections(connections);

    this.updateVisibleOfEndpoints();
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

  private createFcNodesWithConfig(fcNodes: IFcNode[]) {
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

    const $el = jQuery(html);

    const el = $el.get(0) as HTMLElement;

    this.createFcNodeWithElement(el, id);
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

  updateVisibleOfEndpoints() {
    const {
      node: {
        endpoint: {
          show: visibleOfEndpoints,
        },
      },
    } = this.options;

    this.jsPlumbInstance.selectEndpoints().each((endpoint) => {
      this.jsPlumbInstance.setEndpointVisible(endpoint, visibleOfEndpoints);
    });
  }

  getOptions() {
    return this.options;
  }

  decreaseScale() {
    const {
      stage: {
        scale: {
          value: scale,
          step: scaleStep,
          min: minScale,
        },
      },
    } = this.options;

    if (scale <= minScale) {
      return;
    }

    this.options.stage.scale.value = toFixedNumber(scale - scaleStep);

    this.updateStageTransform();
  }

  increaseScale() {
    const {
      stage: {
        scale: {
          value: scale,
          step: scaleStep,
          max: maxScale,
        },
      },
    } = this.options;

    if (scale >= maxScale) {
      return;
    }

    this.options.stage.scale.value = toFixedNumber(scale + scaleStep);

    this.updateStageTransform();
  }

  updateStageTransform() {
    const {
      stage: {
        scale: { value: scale },
        offset: { x, y },
      },
    } = this.options;

    this.el.style.transform = `scale(${scale}) translateX(${x}px) translateY(${y}px)`;

    this.jsPlumbInstance.setZoom(scale);
  }

  getStageElement() {
    return this.el;
  }
}
