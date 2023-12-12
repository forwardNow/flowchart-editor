import lodashTemplate from 'lodash.template';

import {
  AnchorLocations,
  ArrowOverlay,
  DotEndpoint,
  FlowchartConnector,
} from '@jsplumb/browser-ui';

import { IFcOptions } from '@/commons/configs/types';

import {
  CIRCLE_NODE_TYPE,
  DIAMOND_NODE_TYPE,
  RECTANGLE_NODE_TYPE,
  STEP_INDEX_HIGHLIGHT,
} from '@/commons/configs/commons';

export const STORE_KEY_OPTIONS = 'FC_OPTIONS';
export const STEP_INDEX_ATTR_NAME = 'data-step-index';
export const DEFAULT_STEP_INDEX_ATTR_VALUE = '0';
export const BIZ_ID_ATTR_NAME = 'data-biz-id';
export const DEFAULT_BIZ_ID_ATTR_VALUE = '';
export const SORT_ATTR_NAME = 'data-sort';
export const DEFAULT_SORT_ATTR_VALUE = '1';
export const FC_CONNECTION_TYPE = FlowchartConnector.type;
export const EVENT_NAMESPACE = 'fc';
export const DEFAULT_OPTIONS: Required<IFcOptions> = {
  node: {
    endpoint: {
      show: true,
    },
  },

  highlight: {
    type: STEP_INDEX_HIGHLIGHT,
    value: -1,
  },

  stage: {
    scale: {
      value: 1,
      step: 0.1,
      min: 0.5,
      max: 2,
    },
    offset: {
      x: 0,
      y: 0,
    },
  },

  config: {
    nodes: [],
    connections: [],
  },
};

export const FC_CSS_CLASS_NAMES = {
  Stage: 'flow-chart',
  Node: 'fc-node',
  NodeContent: 'fc-node-text',
  NodeSkeleton: 'fc-node-skeleton',

  Selected: 'fc-selected',
  Disabled: 'fc-disabled',

  Connection: 'jtk-connector',

  [CIRCLE_NODE_TYPE]: 'fc-node-circle',
  [RECTANGLE_NODE_TYPE]: 'fc-node-rectangle',
  [DIAMOND_NODE_TYPE]: 'fc-node-diamond',
};

export const NODE_HTML_RENDER = lodashTemplate(`
  <div
    class="fc-node fc-node-<%= type %>"
    ${BIZ_ID_ATTR_NAME}="<%= bizId %>"
    ${STEP_INDEX_ATTR_NAME}="<%= stepIndex %>"
    ${SORT_ATTR_NAME}="<%= sort %>"
    style="left: <%= position.x %>px; top: <%= position.y %>px;"
  >
    <div class="fc-node-inner">
      <div class="fc-node-text"><%= content %></div>
    </div>
  </div>
`);

export const NODE_SKELETON_HTML_RENDER = lodashTemplate(`
  <div class="fc-node-skeleton marching-ants marching"></div>
`);

export const EVENTS = {
  MOUSEDOWN: `mousedown.${EVENT_NAMESPACE}`,
  DBLCLICK: `dblclick.${EVENT_NAMESPACE}`,
  BLUR: `blur.${EVENT_NAMESPACE}`,
  WHEEL: `wheel.${EVENT_NAMESPACE}`,
  MOUSEOVER: `mouseover.${EVENT_NAMESPACE}`,
  MOUSELEAVE: `mouseleave.${EVENT_NAMESPACE}`,

  SELECT_NODE: `select-node.${EVENT_NAMESPACE}`,
  SELECT_CONNECTION: `select-connection.${EVENT_NAMESPACE}`,
  UNSELECT_ALL: `unselect-all.${EVENT_NAMESPACE}`,

  STAGE_MOVE: `stage-move.${EVENT_NAMESPACE}`,
};

export const JS_PLUMB_DEFAULTS = () => ({
  connectionsDetachable: false,

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
