/* eslint-disable class-methods-use-this */
import type { Connection as JsPlumbConnection } from '@jsplumb/browser-ui/types/core/connector/connection-impl';
import lodashGet from 'lodash.get';
import lodashTemplate from 'lodash.template';
import jQuery from 'jquery';
import throttle from 'lodash.throttle';

import {
  AnchorLocations, ArrowOverlay,
  BrowserJsPlumbInstance,
  DotEndpoint,
  FlowchartConnector,
  newInstance,
} from '@jsplumb/browser-ui';

const FC_NODE_CLASS_NAMES = {
  Node: 'fc-node',
  NodeText: 'fc-node-text',
  Skeleton: 'fc-node-skeleton',
  NodeSelected: 'fc-node-selected',

  Circle: 'fc-node-circle',
  Rectangle: 'fc-node-rectangle',
  Diamond: 'fc-node-diamond',
};

const NODE_HTML_RENDER = lodashTemplate(`
  <div class="fc-node fc-node-<%= type %>" style="left: <%= position.x %>px; top: <%= position.y %>px;">
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

const EVENTS = {
  MOUSEDOWN: `mousedown.${EVENT_NAMESPACE}`,
  DBLCLICK: `dblclick.${EVENT_NAMESPACE}`,
  BLUR: `blur.${EVENT_NAMESPACE}`,
};

export class FlowChart {
  /** stage element  */
  private readonly el: HTMLElement;

  private readonly jsPlumbInstance: BrowserJsPlumbInstance;

  constructor(el: HTMLElement, options?: IOptions) {
    this.el = el;

    this.jsPlumbInstance = this.createJsPlumbInstance();

    this.bindListeners();
  }

  private createJsPlumbInstance() {
    const jsPlumbInstance = newInstance({
      container: this.el,
    });

    jsPlumbInstance.importDefaults({
      connector: {
        type: FlowchartConnector.type,
        options: {
          cornerRadius: 3,
        },
      },

      endpoint: {
        type: DotEndpoint.type,
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

    const jsPlumbConnections = this.jsPlumbInstance.getConnections() as JsPlumbConnection[];

    for (let i = 0, len = jsPlumbConnections.length; i < len; i += 1) {
      const jsPlumbConnection = jsPlumbConnections[i];

      const fcConnection = this.buildConfigOfFcConnection(jsPlumbConnection);

      const fcNodes = this.buildConfigOfFcNodes(jsPlumbConnection);

      fcConfig.connections.push(fcConnection);

      this.addFcNodesToConfig(fcNodes, fcConfig);
    }

    return fcConfig;
  }

  private buildConfigOfFcConnection(jsPlumbConnection: JsPlumbConnection) {
    const { sourceId, targetId } = jsPlumbConnection;

    const sourceAnchor = lodashGet(jsPlumbConnection, 'endpoints.0._anchor.type') as IFcAnchor;
    const targetAnchor = lodashGet(jsPlumbConnection, 'endpoints.1._anchor.type') as IFcAnchor;

    return {
      type: 'Flowchart',
      sourceId,
      sourceAnchor,
      targetId,
      targetAnchor,
      label: '',
    };
  }

  private buildConfigOfFcNodes(jsPlumbConnection: JsPlumbConnection) {
    const { source, target } = jsPlumbConnection;

    return [
      this.getFcNodeConfig(source),
      this.getFcNodeConfig(target),
    ];
  }

  getFcNodeConfig(el: HTMLElement) {
    const id: string = this.getManagedIdOfFcNode(el);
    const type: IFcNodeType = this.getTypeOfFcNode(el);
    const content: string = this.getContentOfFcNode(el);
    const position: { x: number, y: number } = this.getPositionOfFcNode(el);

    return {
      id,
      type,
      content,
      position,
    };
  }

  private getManagedIdOfFcNode(el: HTMLElement) {
    return el.dataset.jtkManaged as string;
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
    const { jsPlumbInstance } = this;

    const $nodes = jQuery(this.el).find(`.${FC_NODE_CLASS_NAMES.Node}`);

    const fcNodes: IFcNode[] = [];

    $nodes.each((index: number, el: HTMLElement) => {
      const id = jsPlumbInstance.getId(el);
      const type = this.getTypeOfFcNode(el);
      const content = this.getContentOfFcNode(el);
      const position = this.getPositionOfFcNode(el);

      fcNodes.push({
        id, type, content, position,
      });
    });

    this.addFcNodesToConfig(fcNodes, fcConfig);
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

  createFlowChartWithConfig(fcConfig: IFcConfig) {
    const {
      nodes,
      connections,
    } = fcConfig;

    this.createFcNodesWithConfig(nodes);

    this.createFcConnectionsWithConfig(connections);
  }

  private getTypeOfFcNode(el: HTMLElement): IFcNodeType {
    if (el.classList.contains(FC_NODE_CLASS_NAMES.Circle)) {
      return 'Circle';
    }

    if (el.classList.contains(FC_NODE_CLASS_NAMES.Diamond)) {
      return 'Diamond';
    }

    return 'Rectangle';
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

    return $fcNode.find(`.${FC_NODE_CLASS_NAMES.NodeText}`).html();
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

  private createFcConnectionsWithConfig(fcConnections: IFcConnection[]) {
    for (let i = 0, len = fcConnections.length; i < len; i += 1) {
      this.createConnection(fcConnections[i]);
    }
  }

  private createConnection(fcConnection: IFcConnection) {
    const {
      sourceId,
      sourceAnchor,
      targetId,
      targetAnchor,
    } = fcConnection;

    this.jsPlumbInstance.connect({
      source: this.getElementByManagedId(sourceId),
      target: this.getElementByManagedId(targetId),
      anchors: [sourceAnchor, targetAnchor],
    });
  }

  private getElementByManagedId(id: string) {
    return this.jsPlumbInstance.getManagedElement(id);
  }

  private bindListeners() {
    const checkFcNode = (event: JQuery.TriggeredEvent) => {
      const $target = jQuery(event.target);
      const $fcNode = $target.closest(`.${FC_NODE_CLASS_NAMES.Node}`);
      const isFcNode = $fcNode.length > 0;

      return { $fcNode, isFcNode };
    };

    const debouncedMousedownHandler = throttle((event: JQuery.TriggeredEvent) => {
      console.log(EVENTS.MOUSEDOWN);
      const { $fcNode, isFcNode } = checkFcNode(event);

      if (isFcNode) {
        this.onClickNode($fcNode);
      }
    }, 500, { trailing: false });

    const dblclickHandler = (event: JQuery.TriggeredEvent) => {
      console.log(EVENTS.DBLCLICK);
      const { $fcNode, isFcNode } = checkFcNode(event);

      if (isFcNode) {
        this.onDbClickNode($fcNode);
      }
    };

    jQuery(this.el)
      .bind(EVENTS.MOUSEDOWN, debouncedMousedownHandler)
      .bind(EVENTS.DBLCLICK, dblclickHandler);
  }

  private onClickNode($fcNode: JQuery<HTMLElement>) {
    // 1. add active class
    $fcNode.siblings(`.${FC_NODE_CLASS_NAMES.Node}`).removeClass(FC_NODE_CLASS_NAMES.NodeSelected);
    $fcNode.addClass(FC_NODE_CLASS_NAMES.NodeSelected);

    // 2. add skeleton element
    const hasSkeleton = $fcNode.find(`.${FC_NODE_CLASS_NAMES.Skeleton}`).length > 0;

    if (hasSkeleton) {
      return;
    }

    $fcNode.append(NODE_SKELETON_HTML_RENDER({}));
  }

  private onDbClickNode($fcNode: JQuery<HTMLElement>) {
    const $nodeText = $fcNode.find(`.${FC_NODE_CLASS_NAMES.NodeText}`);

    $nodeText
      .prop('contenteditable', 'true')
      .focus()
      .one(EVENTS.BLUR, () => {
        console.log(EVENTS.BLUR);
        $nodeText.removeAttr('contenteditable');
      });
  }
}

// --

type IFcNodeType = keyof typeof FC_NODE_TYPES;

type IFcAnchor = keyof typeof FC_NODE_ANCHORS;

interface IFcNode {
  id: string, // managedId
  type: IFcNodeType,
  content: string,
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
  toolboxEl: HTMLElement,
}
