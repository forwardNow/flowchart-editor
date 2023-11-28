/* eslint-disable class-methods-use-this */
import lodashGet from 'lodash.get';
import type { Connection as JsPlumbConnection } from '@jsplumb/browser-ui/types/core/connector/connection-impl';

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
  type: 'Flowchart',

  sourceId: string,
  sourceAnchor: IFcAnchor,

  targetId: string,
  targetAnchor: IFcAnchor,

  label?: string,
}

export class FlowChartConfig {
  nodes: IFcNode[] = []

  connections: IFcConnection[] = []

  parseJsPlumbConnections(jsPlumbConnections: Array<JsPlumbConnection>) {
    for (let i = 0, len = jsPlumbConnections.length; i < len; i += 1) {
      const jsPlumbConnection = jsPlumbConnections[i];

      this.parseJsPlumbConnection(jsPlumbConnection);
      this.parseNodes(jsPlumbConnection);
    }
  }

  parseJsPlumbConnection(jsPlumbConnection: JsPlumbConnection) {
    const {
      sourceId,
      targetId,
    } = jsPlumbConnection;

    const sourceAnchor = lodashGet(jsPlumbConnection, 'endpoints.0._anchor.type') as IFcAnchor;
    const targetAnchor = lodashGet(jsPlumbConnection, 'endpoints.1._anchor.type') as IFcAnchor;

    this.connections.push({
      type: 'Flowchart',

      sourceId,
      sourceAnchor,

      targetId,
      targetAnchor,

      label: '',
    });
  }

  parseNodes(jsPlumbConnection: JsPlumbConnection) {
    const {
      sourceId,
      source,

      targetId,
      target,
    } = jsPlumbConnection;

    this.parseNode(sourceId, source);
    this.parseNode(targetId, target);
  }

  parseNode(id: string, el: HTMLElement) {
    if (this.hasNode(id)) {
      return;
    }

    const type: IFcNodeType = this.getNodeTypeByElement(el);
    const text: string = el.textContent || '';
    const position: { x: number, y: number } = this.getNodePositionByElement(el);

    this.nodes.push({
      id,
      type,
      text,
      position,
    });
  }

  hasNode(nodeId: string) {
    return Boolean(this.nodes.find((item) => item.id === nodeId));
  }

  toString() {
    return JSON.stringify({
      nodes: this.nodes,
      connections: this.connections,
    }, null, 2);
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
}
