export const STEP_INDEX_HIGHLIGHT = 'STEP_INDEX';
export const STEP_INDEX_HIGHLIGHT_DEFAULT_VALUE = -1;

export const BIZ_IDS_HIGHLIGHT = 'BIZ_IDS';
export const BIZ_IDS_HIGHLIGHT_DEFAULT_VALUE = () => [];

export const CIRCLE_NODE_TYPE = 'Circle';
export const DIAMOND_NODE_TYPE = 'Diamond';
export const RECTANGLE_NODE_TYPE = 'Rectangle';

export const DEFAULT_CIRCLE_NODE_CONTENT = '起止符号';
export const DEFAULT_DIAMOND_NODE_CONTENT = '决策判断';
export const DEFAULT_RECTANGLE_NODE_CONTENT = '任务内容';

export const FC_NODE_TYPES = {
  [CIRCLE_NODE_TYPE]: CIRCLE_NODE_TYPE,
  [RECTANGLE_NODE_TYPE]: RECTANGLE_NODE_TYPE,
  [DIAMOND_NODE_TYPE]: DIAMOND_NODE_TYPE,
};

export const FC_NODE_ANCHORS = {
  Top: 'Top',
  Right: 'Right',
  Bottom: 'Bottom',
  Left: 'Left',
};
