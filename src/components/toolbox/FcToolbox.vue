<template>
  <div class="fc-toolbox">
    <div class="fc-toolbox-top">
      <ToolButtons />

      <FcDivider />

      <ShapeList />

      <FcDivider />

      <HighlightSettings />

      <FcDivider />

      <div class="fc-toolbox-list fc-info-list">
        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="node.endpoint.show"
          >
            是否显示节点的端点:
          </span>
          <input
            v-model="options.node.endpoint.show"
            class="fc-info-item-cont"
            type="checkbox"
            @change="changeVisibleOfEndpoints"
          >
        </div>

        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="stage.scale.value"
          >画布缩放:</span>
          <span
            class="fc-info-item-cont"
            title="stage.scale.value"
          >{{ options.stage.scale.value }}</span>
        </div>

        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="stage.offset"
          >画布偏移量:</span>
          <span
            class="fc-info-item-cont"
            title="stage.offset"
          >({{ options.stage.offset.x }}, {{ options.stage.offset.y }})</span>
        </div>
      </div>
    </div>

    <div
      v-show="nodeInfo.visible || connectionInfo.visible"
      class="fc-toolbox-bottom"
    >
      <div
        v-show="nodeInfo.visible"
        class="fc-toolbox-list fc-info-list"
      >
        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="bizId"
          >ID:</span>
          <input
            v-model.trim="nodeInfo.bizId"
            class="fc-info-item-cont fc-info-item-input"
            @input="changeNodeBizId"
          >
        </div>
        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="stepIndex"
          >步骤索引:</span>
          <input
            v-model.trim.number="nodeInfo.stepIndex"
            class="fc-info-item-cont fc-info-item-input"
            type="number"
            @input="changeNodeStepIndex"
          >
        </div>
        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="sort"
          >排序:</span>
          <input
            v-model.trim.number="nodeInfo.sort"
            class="fc-info-item-cont fc-info-item-input"
            type="number"
            @input="changeNodeSort"
          >
        </div>
        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="text"
          >节点内容:</span>
          <span class="fc-info-item-cont">{{ nodeInfo.text }}</span>
        </div>
      </div>

      <div
        v-show="connectionInfo.visible"
        class="connection-info fc-info"
      >
        <div class="fc-info-item">
          <span
            class="fc-info-item-label"
            title="label"
          >连线标签:</span>
          <input
            v-model.trim="connectionInfo.label"
            class="fc-info-item-cont fc-info-item-input"
            @input="changeConnectionLabel"
          >
        </div>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable @typescript-eslint/no-use-before-define */
import lodashDebounce from 'lodash.debounce';
import lodashMerge from 'lodash.merge';
import {
  DEFAULT_OPTIONS,
  EVENTS,
} from '@/commons/configs/constants';
import ToolButtons from '@/components/toolbox/ToolButtons.vue';
import FcDivider from '@/components/toolbox/FcDivider.vue';
import ShapeList from '@/components/toolbox/ShapeList.vue';
import HighlightSettings from '@/components/toolbox/HighlightSettings.vue';

export default {
  name: 'FcToolbox',
  components: {
    HighlightSettings, ShapeList, FcDivider, ToolButtons,
  },

  inject: ['flowChartRef'],

  provide() {
    return {
      toolboxRef: this,
    };
  },

  data() {
    return {
      /** @type {IFcOptions}  */
      options: lodashMerge({}, DEFAULT_OPTIONS),

      nodeInfo: {
        visible: false,

        id: '',
        bizId: '',
        type: '',
        text: '',
        position: { x: 0, y: 0 },
        stepIndex: 0,
        sort: 0,
      },

      connectionInfo: {
        visible: false,

        type: '',
        sourceId: '',
        sourceAnchor: '',
        targetId: '',
        targetAnchor: '',
        label: '',
      },

    };
  },

  methods: {
    // invoke by FlowChart.vue
    init(options) {
      this.options = options;
      this.bindListeners();
    },

    bindListeners() {
      const { fc } = this.flowChartRef;

      fc.on(EVENTS.SELECT_NODE, (fcNode) => {
        if (!fcNode) {
          return;
        }

        this.connectionInfo.visible = false;
        this.nodeInfo = { visible: true, ...fcNode };
      });

      fc.on(EVENTS.SELECT_CONNECTION, (fcConnection) => {
        if (!fcConnection) {
          return;
        }

        this.nodeInfo.visible = false;
        this.connectionInfo = { visible: true, ...fcConnection };
      });

      fc.on(EVENTS.UNSELECT_ALL, () => {
        this.connectionInfo.visible = false;
        this.nodeInfo.visible = false;
      });

      fc.on(EVENTS.WHEEL, (scale) => {
        this.options.stage.scale.value = scale;
      });

      fc.on(EVENTS.STAGE_MOVE, (offset) => {
        this.options.stage.offset = offset;
      });
    },

    changeNodeStepIndex() {
      const { fc } = this.flowChartRef;
      const { stepIndex } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setStepIndexOfFcElement(selectedNode, stepIndex);
    },

    changeNodeSort() {
      const { fc } = this.flowChartRef;
      const { sort } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setSortOfFcElement(selectedNode, sort);
    },

    changeNodeBizId() {
      const { fc } = this.flowChartRef;
      const { bizId } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setBizIdOfFcElement(selectedNode, bizId);
    },

    changeConnectionLabel: lodashDebounce(function f() {
      const { fc } = this.flowChartRef;

      const selectedJsPlumbConnection = fc.getSelectedJsPlumbConnection();

      fc.setLabelOfJsPlumbConnection(selectedJsPlumbConnection, this.connectionInfo.label);
    }, 300),

    changeVisibleOfEndpoints() {
      this.flowChartRef.fc.setVisibleOfEndpoints(this.options.node.endpoint.show);
    },

  },
};
</script>
<style lang="scss">
@import "@/commons/styles/vars";

.fc-toolbox {
  z-index: $z-index-toolbox;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;

  .fc-toolbox-top {
    display: flex;
    align-items: center;
    gap: 0 16px;

    padding: 8px 16px;
    width: 100%;
    height: 100%;

    background-color: #f6f7f8;
    border: 1px solid #E9E9E9;
  }

  .fc-toolbox-bottom {
    display: flex;
    align-items: center;
    gap: 0 16px;

    padding: 8px 16px;
    height: 40px;
    margin-top: -1px;

    background-color: #f6f7f8;
    border: 1px solid #E9E9E9;
  }

  .fc-toolbox-list {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .fc-toolbox-item {
    display: flex;
    align-items: center;
    justify-content: center;

    margin-left: 8px;
    padding: 4px;
    height: 28px;
    min-width: 28px;

    border-radius: 4px;

    &:first-child {
      margin-left: 0;
    }

    &:hover {
      background-color: #eaecee;
    }
  }

  .fc-info-list {
    font-size: 12px;
  }

  .fc-info-item {
    margin-right: 24px;

    &:last-child {
      margin-right: 0;
    }
  }

  .fc-info-item-label {
    color: #999;
  }
  .fc-info-item-cont {
    margin: 0 0 0 4px;
    color: #333;
    vertical-align: middle;
  }
  .fc-info-item-input {
    display: inline-block;
    padding: 0 0 0 8px;
    height: 28px;
    width: 10em;
    line-height: 32px;
    outline: none;
    border: 1px solid #dcdfe6;
    color: #606266;
    background: #fff;
    appearance: none;

    &:hover,
    &:focus {
      border-color: $color-primary;
    }

    &[type="number"] {
      width: 4.5em;
    }
  }

  .fc-node {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 16px;
    color: #212930;

    &:before {
      content: '';
      width: 100%;
      height: 100%;
      border: solid 2px;
      border-radius: 2px;

      scale: 0.75;
    }
  }

  .fc-node-circle {
    &:before {
      border-radius: 100px;
    }
  }

  .fc-node-diamond {
    &:before {
      width: 16px;
      transform: rotate(45deg);
    }
  }

}
</style>
