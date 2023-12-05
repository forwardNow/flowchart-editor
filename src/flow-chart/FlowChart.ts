/* eslint-disable class-methods-use-this */
import type { Connection as IJsPlumbConnection } from '@jsplumb/browser-ui/types/core/connector/connection-impl';
import lodashGet from 'lodash.get';
import lodashMerge from 'lodash.merge';
import lodashTemplate from 'lodash.template';
import jQuery from 'jquery';
import throttle from 'lodash.throttle';

import {
  AnchorLocations,
  ArrowOverlay, BlankEndpoint,
  BrowserJsPlumbInstance,
  Connection as JsPlumbConnection,
  DotEndpoint,
  FlowchartConnector,
  LabelOverlay,
  newInstance,
} from '@jsplumb/browser-ui';
import { toFixedNumber } from '@/flow-chart/commons/utils/number';
import interact from 'interactjs';

export const DEFAULT_OPTIONS: Required<IOptions> = {
  currentStepIndex: -1,
  visibleOfEndpoints: false,
  scale: 1,
  scaleStep: 0.1,
  minScale: 0.5,
  maxScale: 2,
  offset: { x: 0, y: 0 },
  config: { nodes: [], connections: [] },
};

const FC_CSS_CLASS_NAMES = {
  Stage: 'flow-chart',
  Node: 'fc-node',
  NodeContent: 'fc-node-text',
  NodeSkeleton: 'fc-node-skeleton',

  Selected: 'fc-selected',
  Disabled: 'fc-disabled',

  Connection: 'jtk-connector',

  Circle: 'fc-node-circle',
  Rectangle: 'fc-node-rectangle',
  Diamond: 'fc-node-diamond',
};

const NODE_HTML_RENDER = lodashTemplate(`
  <div
    class="fc-node fc-node-<%= type %>"
    data-step-index="<%= stepIndex %>"
    style="left: <%= position.x %>px; top: <%= position.y %>px;"
  >
    <div class="fc-node-inner">
      <div class="fc-node-text"><%= content %></div>
    </div>
  </div>
`);

const NODE_SKELETON_HTML_RENDER = lodashTemplate(`
  <div class="fc-node-skeleton marching-ants marching"></div>
`);

const FC_NODE_TYPES = {
  Circle: 'Circle',
  Rectangle: 'Rectangle',
  Diamond: 'Diamond',
};

const FC_NODE_ANCHORS = {
  Top: 'Top',
  Right: 'Right',
  Bottom: 'Bottom',
  Left: 'Left',
};

const EVENT_NAMESPACE = 'fc';

export const EVENTS = {
  MOUSEDOWN: `mousedown.${EVENT_NAMESPACE}`,
  DBLCLICK: `dblclick.${EVENT_NAMESPACE}`,
  BLUR: `blur.${EVENT_NAMESPACE}`,
  WHEEL: `wheel.${EVENT_NAMESPACE}`,

  SELECT_NODE: `select-node.${EVENT_NAMESPACE}`,
  SELECT_CONNECTION: `select-connection.${EVENT_NAMESPACE}`,
  UNSELECT_ALL: `unselect-all.${EVENT_NAMESPACE}`,

  STAGE_MOVE: `stage-move.${EVENT_NAMESPACE}`,
};

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

  private readonly options: Required<IOptions>;

  constructor(el: HTMLElement, options?: IOptions) {
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

    jsPlumbInstance.importDefaults({
      connectionsDetachable: false,

      connector: {
        type: FlowchartConnector.type,
        options: {
          cornerRadius: 3,
        },
      },

      endpoint: {
        type: this.options.visibleOfEndpoints ? DotEndpoint.type : BlankEndpoint.type,
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

      // console.log(EVENTS.MOUSEDOWN, target);

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

      // console.log(EVENTS.DBLCLICK, target);

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

      this.emit(EVENTS.WHEEL, this.options.scale);
    };

    jQuery(this.el)
      .on(EVENTS.MOUSEDOWN, debouncedMousedownHandler)
      .on(EVENTS.DBLCLICK, dblclickHandler);

    jQuery(this.el.parentElement as HTMLElement)
      .on(EVENTS.WHEEL, mousewheelHandler);
  }

  private bindDragStage() {
    interact(this.el.parentElement as HTMLElement)
      .draggable({
        autoScroll: true,
        cursorChecker: () => 'default',
        listeners: {
          move: (event) => {
            const {
              dx,
              dy,
            } = event;

            if (jQuery(this.el).find(`.${FC_CSS_CLASS_NAMES.Selected}`).length > 0) {
              return;
            }

            this.options.offset.x += dx;
            this.options.offset.y += dy;

            this.emit(EVENTS.STAGE_MOVE, this.options.offset);

            this.updateStageTransform();
          },
        },
      });
  }

  updateHighlights() {
    const { currentStepIndex } = this.options;
    const $node = this.getJqOfAllFcNodes();

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

  private onClickNode($fcNode: JQuery<HTMLElement>) {
    this.addSelectedCssClass($fcNode);

    // add skeleton element
    const hasSkeleton = $fcNode.find(`.${FC_CSS_CLASS_NAMES.NodeSkeleton}`).length > 0;

    if (hasSkeleton) {
      return;
    }

    $fcNode.append(NODE_SKELETON_HTML_RENDER({}));
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
      .focus()
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
      type: 'Flowchart',
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

  getFcNodeConfig(el: HTMLElement) {
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
    return jQuery(this.el)
      .find(`.${FC_CSS_CLASS_NAMES.Node}`);
  }

  createFcNodeWithElement(el: HTMLElement, managedId?: string) {
    this.el.appendChild(el);

    this.jsPlumbInstance.manage(el, managedId);

    this.createEndpointsForFcNode(el);
  }

  private createEndpointsForFcNode(el: HTMLElement) {
    this.jsPlumbInstance.addEndpoints(el, [
      {
        source: true, target: true, anchor: 'Top', maxConnections: -1,
      },
      {
        source: true, target: true, anchor: 'Right', maxConnections: -1,
      },
      {
        source: true, target: true, anchor: 'Bottom', maxConnections: -1,
      },
      {
        source: true, target: true, anchor: 'Left', maxConnections: -1,
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
      return 'Circle';
    }

    if (el.classList.contains(FC_CSS_CLASS_NAMES.Diamond)) {
      return 'Diamond';
    }

    return 'Rectangle';
  }

  private getStepIndexOfFcNode(el: HTMLElement) {
    const stepIndexStr = jQuery(el).attr('data-step-index') || '0';

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

    return this.getJsPlumbConnectionByElement(connectionElement);
  }

  private getJsPlumbConnectionByElement(el: HTMLElement): IJsPlumbConnection | null {
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

    if (!labelOverlay) {
      console.log('setLabelOfJsPlumbConnection(), labelOverlay is None');
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
      throw new Error(`未定义这个类型的事件: ${eventName}`);
    }

    eventHandler.push(callback);
  }

  changeFcNodeStepIndex(el: HTMLElement, stepIndex: number) {
    jQuery(el).attr('data-step-index', stepIndex);
  }

  setCurrentStepIndex(currentStepIndex: number | string) {
    this.options.currentStepIndex = Number(currentStepIndex);
    this.updateHighlights();
  }

  setVisibleOfEndpoints(visible: boolean) {
    this.options.visibleOfEndpoints = visible;

    this.updateVisibleOfEndpoints();
  }

  updateVisibleOfEndpoints() {
    const { visibleOfEndpoints = false } = this.options;

    this.jsPlumbInstance.selectEndpoints().each((endpoint) => {
      this.jsPlumbInstance.setEndpointVisible(endpoint, visibleOfEndpoints);
    });
  }

  getOptions() {
    return this.options;
  }

  decreaseScale() {
    const { scale, scaleStep, minScale } = this.options;

    if (scale <= minScale) {
      return;
    }

    this.options.scale = toFixedNumber(scale - scaleStep);

    this.updateStageTransform();
  }

  increaseScale() {
    const { scale, scaleStep, maxScale } = this.options;

    if (scale >= maxScale) {
      return;
    }

    this.options.scale = toFixedNumber(scale + scaleStep);

    this.updateStageTransform();
  }

  updateStageTransform() {
    const { scale, offset: { x, y } } = this.options;

    this.el.style.transform = `scale(${scale}) translateX(${x}px) translateY(${y}px)`;

    this.jsPlumbInstance.setZoom(scale);
  }

  getStageElement() {
    return this.el;
  }
}

// --

type IFcNodeType = keyof typeof FC_NODE_TYPES;

type IFcAnchor = keyof typeof FC_NODE_ANCHORS;

interface IFcNode {
  stepIndex: number,
  id: string, // managedId
  type: IFcNodeType,
  content: string,
  text: string,
  position: { x: number, y: number },
}

interface IFcConnection {
  type: string, // 'Flowchart'

  sourceId: string,
  sourceAnchor: IFcAnchor,

  targetId: string,
  targetAnchor: IFcAnchor,

  label?: string,
}

interface IFcConfig {
  nodes: IFcNode[],
  connections: IFcConnection[],
}

interface IOptions {
  currentStepIndex: number,
  visibleOfEndpoints?: boolean,

  scale?: number,
  scaleStep?: number,
  minScale?: number,
  maxScale?: number,
  offset?: { x: number, y: number },

  config?: IFcConfig,
}
