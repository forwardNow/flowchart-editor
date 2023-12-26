<template>
  <div class="fc-toolbox">
    <div class="fc-toolbox-top">
      <ToolButtons />

      <FcDivider />

      <ShapeList />

      <FcDivider />

      <div class="fc-toolbox-list fc-info-list">
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="highlight.type"
          >
            高亮类型:
          </span>
          <label title="'STEP_INDEX'">
            <input
              v-model="options.highlight.type"
              class="fc-ii-cont"
              type="radio"
              value="STEP_INDEX"
              @change="changeHighlightType"
            > 步骤
          </label>
          <label title="'BIZ_IDS'">
            <input
              v-model="options.highlight.type"
              class="fc-ii-cont"
              type="radio"
              value="BIZ_IDS"
              @change="changeHighlightType"
            > 单独指定
          </label>
        </div>

        <div class="fc-info-item">
          <template v-if="options.highlight.type === 'STEP_INDEX'">
            <span
              class="fc-ii-label"
              title="highlight.value"
            >
              当前步骤:
            </span>
            <input
              v-model.trim.number="options.highlight.value"
              class="fc-ii-cont fc-ii-input"
              type="number"
              title="-1, 全部高亮"
              @input="changeHighlightValue"
            >
          </template>

          <template v-if="options.highlight.type === 'BIZ_IDS'">
            <span
              class="fc-ii-label"
              title="highlight.value"
            >
              ID集合:
            </span>

            <div
              class="fc-ii-cont biz-ids-box"
              @wheel.stop
            >
              <input
                class="fc-ii-input"
                :value="JSON.stringify(options.highlight.value)"
                readonly
                title="ID 数组"
                @click="handleClickBizIdsInput"
              >

              <div
                v-show="bizIdsDropdownMenu.visible"
                class="dropdown-menu-biz-ids"
              >
                <div
                  v-for="(item, i) in bizIdsDropdownMenu.fcNodes"
                  :key="i"
                  class="biz-id-menu-item"
                  @click="handleClickBizIdMenuItem(item)"
                >
                  <input
                    class="menu-item-checkbox"
                    type="checkbox"
                    :checked="options.highlight.value.includes(item.bizId)"
                  >
                  <div
                    class="menu-item-icon"
                    :class="`fc-node fc-node-${item.type.toLowerCase()}`"
                  />
                  <div class="menu-item-text">
                    {{ item.text }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <FcDivider />

      <div class="fc-toolbox-list fc-info-list">
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="node.endpoint.show"
          >
            是否显示节点的端点:
          </span>
          <input
            v-model="options.node.endpoint.show"
            class="fc-ii-cont"
            type="checkbox"
            @change="changeVisibleOfEndpoints"
          >
        </div>

        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="stage.scale.value"
          >画布缩放:</span>
          <span
            class="fc-ii-cont"
            title="stage.scale.value"
          >{{ options.stage.scale.value }}</span>
        </div>

        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="stage.offset"
          >画布偏移量:</span>
          <span
            class="fc-ii-cont"
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
            class="fc-ii-label"
            title="bizId"
          >ID:</span>
          <input
            v-model.trim="nodeInfo.bizId"
            class="fc-ii-cont fc-ii-input"
            @input="changeNodeBizId"
          >
        </div>
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="stepIndex"
          >步骤索引:</span>
          <input
            v-model.trim.number="nodeInfo.stepIndex"
            class="fc-ii-cont fc-ii-input"
            type="number"
            @input="changeNodeStepIndex"
          >
        </div>
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="sort"
          >排序:</span>
          <input
            v-model.trim.number="nodeInfo.sort"
            class="fc-ii-cont fc-ii-input"
            type="number"
            @input="changeNodeSort"
          >
        </div>
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="text"
          >节点内容:</span>
          <span class="fc-ii-cont">{{ nodeInfo.text }}</span>
        </div>
      </div>

      <div
        v-show="connectionInfo.visible"
        class="connection-info fc-info"
      >
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="label"
          >连线标签:</span>
          <input
            v-model.trim="connectionInfo.label"
            class="fc-ii-cont fc-ii-input"
            @input="changeConnectionLabel"
          >
        </div>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable @typescript-eslint/no-use-before-define */
import jQuery from 'jquery';
import lodashDebounce from 'lodash.debounce';
import {
  DEFAULT_OPTIONS,
  EVENTS,
} from '@/commons/configs/constants';
import { merge } from '@jsplumb/browser-ui';
import {
  STEP_INDEX_HIGHLIGHT,
} from '@/commons/configs/commons';
import ToolButtons from '@/components/toolbox/ToolButtons.vue';
import FcDivider from '@/components/toolbox/FcDivider.vue';
import ShapeList from '@/components/toolbox/ShapeList.vue';

export default {
  name: 'FcToolbox',
  components: { ShapeList, FcDivider, ToolButtons },

  inject: ['flowChartRef'],

  provide() {
    return {
      toolboxRef: this,
    };
  },

  data() {
    return {
      /** @type {IFcOptions}  */
      options: merge({}, DEFAULT_OPTIONS),

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

      bizIdsDropdownMenu: {
        visible: false,
        fcNodes: [],
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
      const bizIdsBoxSelector = '.biz-ids-box';

      // click outside .biz-ids-box
      const CLICK_EVENT = 'click.toolbox';
      jQuery(window)
        .off(CLICK_EVENT)
        .on(CLICK_EVENT, (event) => {
          const { target } = event;
          const $target = jQuery(target);

          if ($target.closest(bizIdsBoxSelector).length > 0) {
            return;
          }

          if ($target.is(bizIdsBoxSelector)) {
            return;
          }

          this.bizIdsDropdownMenu.visible = false;
        });

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

    changeHighlightType() {
      const { fc } = this.flowChartRef;
      const { type } = this.options.highlight;

      fc.updateHighlightType(type);

      this.options = fc.getOptions();
    },

    changeHighlightValue() {
      const {
        highlight: { type, value },
      } = this.options;

      if (type === STEP_INDEX_HIGHLIGHT) {
        this.flowChartRef.fc.setCurrentStepIndex(Number(value));
      }
    },

    changeVisibleOfEndpoints() {
      this.flowChartRef.fc.setVisibleOfEndpoints(this.options.node.endpoint.show);
    },

    handleClickBizIdsInput() {
      const { fc } = this.flowChartRef;

      this.bizIdsDropdownMenu.visible = true;
      this.bizIdsDropdownMenu.fcNodes = fc.getFcNodeConfigs();
    },

    handleClickBizIdMenuItem(fcNode) {
      const { fc } = this.flowChartRef;
      const bizIds = this.options.highlight.value || [];

      const index = bizIds.findIndex((item) => item === fcNode.bizId);

      if (index === -1) {
        bizIds.push(fcNode.bizId);
        bizIds.sort();
      } else {
        bizIds.splice(index, 1);
      }

      fc.getOptions().highlight.value = bizIds;

      fc.updateHighlights();
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

  .fc-ii-label {
    color: #999;
  }
  .fc-ii-cont {
    margin: 0 0 0 4px;
    color: #333;
    vertical-align: middle;
  }
  .fc-ii-input {
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

  .biz-ids-box {
    position: relative;
    display: inline-block;
  }

  .dropdown-menu-biz-ids {
    position: absolute;
    left: 0;
    top: 100%;

    padding-top: 4px;
    padding-bottom: 2px;
    min-width: 320px;
    max-height: 80vh;

    color: #212930;
    font-size: 13px;

    overflow-y: auto;

    border-radius: 4px;
    border: #e9edf2;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 4px 10px 0 rgba(0,0,0,.1);

    .biz-id-menu-item {
      display: flex;
      align-items: center;

      padding: 8px 8px;

      &:hover {
        background: #f3f5f9;
      }
    }
    .menu-item-icon {
      margin-left: 4px;
      color: #c4d0dc;
    }
  }
}
</style>
