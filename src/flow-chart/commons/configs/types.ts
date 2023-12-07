import {
  BIZ_IDS_HIGHLIGHT,
  FC_NODE_ANCHORS,
  FC_NODE_TYPES,
  STEP_INDEX_HIGHLIGHT,
} from '@/flow-chart/commons/configs/commons';

export type IFcNodeType = keyof typeof FC_NODE_TYPES;
export type IFcAnchor = keyof typeof FC_NODE_ANCHORS;

export interface IFcNode {
  stepIndex: number,
  id: string, // managedId
  type: IFcNodeType,
  content: string,
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

export interface IFcOptions {
  highlight: {
    type: typeof BIZ_IDS_HIGHLIGHT | typeof STEP_INDEX_HIGHLIGHT,
    value: string[] | number,
  },

  node: {
    endpoint: {
      show: boolean,
    }
  },

  stage: {
    scale: {
      value: number,
      step: number,
      min: number,
      max: number,
    },
    offset: { x: number, y: number }
  },

  config?: IFcConfig,
}
