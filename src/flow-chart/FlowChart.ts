/* eslint-disable class-methods-use-this */
import type { Connection as JsPlumbConnection } from '@jsplumb/browser-ui/types/core/connector/connection-impl';
import lodashGet from 'lodash.get';
import lodashTemplate from 'lodash.template';
import jQuery from 'jquery';

import {
  AnchorLocations, ArrowOverlay,
  BrowserJsPlumbInstance,
  DotEndpoint,
  FlowchartConnector,
  newInstance,
} from '@jsplumb/browser-ui';

const FC_NODE_CLASS_NAMES = {
  Node: 'fc-node',

  Circle: 'fc-node-circle',
  Rectangle: 'fc-node-rectangle',
  Diamond: 'fc-node-diamond',
};

const NODE_HTML_TEMPLATE = `
  <div class="fc-node fc-node-<%= type %>" style="left: <%= position.x %>px; top: <%= position.y %>px;">
    <div class="fc-node-inner">
      <div class="fc-node-text"><%= text %></div>
    </div>
  </div>
`;

const NODE_HTML_RENDER = lodashTemplate(NODE_HTML_TEMPLATE);

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

export class FlowChart {
  private readonly el: HTMLElement;

  private readonly jsPlumbInstance: BrowserJsPlumbInstance;

  constructor(el: HTMLElement, options?: IOptions) {
    this.el = el;

    this.jsPlumbInstance = this.createJsPlumbInstance();
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

  getConfig() {
    const config: IFcConfig = { nodes: [], connections: [] };

    this.getConfigByJsPlumbConnections(config);

    this.addUnconnectedNodesToConfig(config);

    return config;
  }

  appendElement(el: HTMLElement, managedId?: string) {
    this.el.appendChild(el);

    this.jsPlumbInstance.manage(el, managedId);

    this.createNodeEndpoints(el);
  }

  createNodeEndpoints(el: HTMLElement) {
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

  updateStageByConfig(fcConfig: IFcConfig) {
    const {
      nodes,
      connections,
    } = fcConfig;

    this.createNodesByConfig(nodes);

    this.createConnectionsByConfig(connections);
  }

  private getConfigByJsPlumbConnections(fcConfig: IFcConfig) {
    const jsPlumbConnections = this.jsPlumbInstance.getConnections() as JsPlumbConnection[];

    for (let i = 0, len = jsPlumbConnections.length; i < len; i += 1) {
      const jsPlumbConnection = jsPlumbConnections[i];

      const fcConnection = this.getConfigConnection(jsPlumbConnection);

      const fcNodes = this.getConfigNodes(jsPlumbConnection);

      fcConfig.connections.push(fcConnection);

      this.addConfigNodes(fcNodes, fcConfig);
    }
  }

  private getConfigConnection(jsPlumbConnection: JsPlumbConnection) {
    const {
      sourceId,
      targetId,
    } = jsPlumbConnection;

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

  private getConfigNodes(jsPlumbConnection: JsPlumbConnection) {
    const {
      sourceId,
      source,

      targetId,
      target,
    } = jsPlumbConnection;

    return [
      this.getConfigNode(sourceId, source),
      this.getConfigNode(targetId, target),
    ];
  }

  private getConfigNode(id: string, el: HTMLElement) {
    const type: IFcNodeType = this.getNodeTypeByElement(el);
    const text: string = this.getNodeContentByElement(el);
    const position: { x: number, y: number } = this.getNodePositionByElement(el);

    return {
      id,
      type,
      text,
      position,
    };
  }

  private addUnconnectedNodesToConfig(fcConfig: IFcConfig) {
    const { jsPlumbInstance } = this;

    const $nodes = jQuery(this.el).find(`.${FC_NODE_CLASS_NAMES.Node}`);

    const fcNodes: IFcNode[] = [];

    $nodes.each((index: number, el: HTMLElement) => {
      const id = jsPlumbInstance.getId(el);
      const type = this.getNodeTypeByElement(el);
      const text = this.getNodeContentByElement(el);
      const position = this.getNodePositionByElement(el);

      fcNodes.push({
        id, type, text, position,
      });
    });

    this.addConfigNodes(fcNodes, fcConfig);
  }

  toString() {
    return JSON.stringify(this.getConfig(), null, 2);
  }

  private addConfigNodes(nodes: IFcNode[], config: IFcConfig) {
    nodes.forEach((node) => {
      const isExist = Boolean(config.nodes.find((item) => item.id === node.id));

      if (isExist) {
        return;
      }

      config.nodes.push(node);
    });
  }

  private getNodeTypeByElement(el: HTMLElement): IFcNodeType {
    if (el.classList.contains(FC_NODE_CLASS_NAMES.Circle)) {
      return 'Circle';
    }

    if (el.classList.contains(FC_NODE_CLASS_NAMES.Diamond)) {
      return 'Diamond';
    }

    return 'Rectangle';
  }

  private getNodePositionByElement(el: HTMLElement) {
    const x = parseFloat(el.style.left);
    const y = parseFloat(el.style.top);

    return { x, y };
  }

  private getNodeContentByElement(el: HTMLElement) {
    return el.textContent || '';
  }

  private createNodesByConfig(fcNodes: IFcNode[]) {
    for (let i = 0, len = fcNodes.length; i < len; i += 1) {
      this.createNode(fcNodes[i]);
    }
  }

  private createConnectionsByConfig(fcConnections: IFcConnection[]) {
    for (let i = 0, len = fcConnections.length; i < len; i += 1) {
      this.createConnection(fcConnections[i]);
    }
  }

  private createNode(fcNode: IFcNode) {
    const { id, type } = fcNode;

    const html = NODE_HTML_RENDER({
      ...fcNode,
      type: type.toLowerCase(),
    });

    const $el = jQuery(html);

    const el = $el.get(0) as HTMLElement;

    this.appendElement(el, id);
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
}

// --

type IFcNodeType = keyof typeof FC_NODE_TYPES;

type IFcAnchor = keyof typeof FC_NODE_ANCHORS;

interface IFcNode {
  id: string, // managedId
  type: IFcNodeType,
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
  toolboxEl: HTMLElement,
}
