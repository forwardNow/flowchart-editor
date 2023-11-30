/* eslint-disable class-methods-use-this */
import type { Connection as JsPlumbConnection } from '@jsplumb/browser-ui/types/core/connector/connection-impl';
import lodashGet from 'lodash.get';
import jQuery from 'jquery';

import {
  AnchorLocations, ArrowOverlay,
  BrowserJsPlumbInstance,
  DotEndpoint,
  FlowchartConnector,
  newInstance,
} from '@jsplumb/browser-ui';

export type IFcNodeType = 'Circle' | 'Rectangle' | 'Diamond';

export const FcNodeClassSelectors = {
  Circle: 'fc-node-circle',
  Rectangle: 'fc-node-rectangle',
  Diamond: 'fc-node-diamond',
};

export type IFcAnchor = 'Top' | 'Right' | 'Bottom' | 'Left';

export interface IFcNode {
  id: string, // managedId
  type: IFcNodeType,
  text: string,
  position: { x: number, y: number },
}

export interface IFcConnection {
  type: string, // 'Flowchart'

  sourceId: string,
  sourceAnchor: IFcAnchor,

  targetId: string,
  targetAnchor: IFcAnchor,

  label?: string,
}

export interface IFcConfig {
  nodes: IFcNode[],
  connections: IFcConnection[],
}

export interface IOptions {
  toolboxEl: HTMLElement,
}

export class FlowChart {
  private readonly el: HTMLElement;

  private readonly cssSelectors = {
    node: '.fc-node',
  };

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

  insertNode(el: HTMLElement) {
    const { jsPlumbInstance } = this;

    this.el.appendChild(el);

    jsPlumbInstance.manage(el);

    jsPlumbInstance.addEndpoints(el, [
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

  private getConfigByJsPlumbConnections(config: IFcConfig) {
    const jsPlumbConnections = this.jsPlumbInstance.getConnections() as JsPlumbConnection[];

    for (let i = 0, len = jsPlumbConnections.length; i < len; i += 1) {
      const jsPlumbConnection = jsPlumbConnections[i];

      const connection = this.getConfigConnection(jsPlumbConnection);

      const nodes = this.getConfigNodes(jsPlumbConnection);

      config.connections.push(connection);

      this.addConfigNodes(nodes, config);
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

  private addUnconnectedNodesToConfig(config: IFcConfig) {
    const { jsPlumbInstance } = this;

    const $nodes = jQuery(this.el).find(this.cssSelectors.node);

    const nodes: IFcNode[] = [];

    $nodes.each((index: number, el: HTMLElement) => {
      const id = jsPlumbInstance.getId(el);
      const type = this.getNodeTypeByElement(el);
      const text = this.getNodeContentByElement(el);
      const position = this.getNodePositionByElement(el);

      nodes.push({
        id, type, text, position,
      });
    });

    this.addConfigNodes(nodes, config);
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
    if (el.classList.contains(FcNodeClassSelectors.Circle)) {
      return 'Circle';
    }

    if (el.classList.contains(FcNodeClassSelectors.Diamond)) {
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
}
