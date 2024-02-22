<template>
  <div class="fc-highlight-settings fc-toolbox-list fc-info-list">
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="highlight.type">
        高亮类型:
      </span>
      <label :title="STEP_INDEX_HIGHLIGHT">
        <input
          v-model="options.highlight.type"
          class="fc-info-item-cont"
          type="radio"
          :value="STEP_INDEX_HIGHLIGHT"
          @change="changeHighlightType(STEP_INDEX_HIGHLIGHT)"
        >
        步骤
      </label>
      <label :title="BIZ_IDS_HIGHLIGHT">
        <input
          v-model="options.highlight.type"
          class="fc-info-item-cont"
          type="radio"
          :value="BIZ_IDS_HIGHLIGHT"
          @change="changeHighlightType(BIZ_IDS_HIGHLIGHT)"
        >
        单独指定
      </label>
    </div>

    <div class="fc-info-item">
      <template v-if="options.highlight.type === STEP_INDEX_HIGHLIGHT">
        <span class="fc-info-item-label" title="highlight.value">
          当前步骤:
        </span>
        <input
          v-model="options.highlight.value"
          class="fc-info-item-cont fc-info-item-input"
          type="number"
          title="-1 表示 全部高亮"
          @input="changeCurrentStepIndex($event)"
        >
      </template>

      <template v-if="options.highlight.type === BIZ_IDS_HIGHLIGHT">
        <span class="fc-info-item-label" title="highlight.value">ID数组:</span>

        <div class="fc-info-item-cont fc-biz-ids-box" @wheel.stop>
          <input
            class="fc-info-item-input"
            :value="serializedBizIds"
            readonly
            @click="handleClickBizIdsInput"
          >

          <div v-show="dropdownMenu.visible" class="hl-dropdown-menu">
            <div
              v-for="(item, i) in dropdownMenu.fcNodes" :key="i"
              class="hl-menu-item"
              @click="handleClickMenuItem(item)"
            >
              <input type="checkbox" :checked="isIncludeBizId(item.bizId)">
              <div class="hl-menu-item-icon" :class="getFcNodeClasses(item.type)" />
              <div class="hl-menu-item-text">
                {{ item.text }}
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
<script>
import jQuery from 'jquery';
import { BIZ_IDS_HIGHLIGHT, STEP_INDEX_HIGHLIGHT } from '@/commons/configs/commons';
import { CUSTOM_EVENTS, GET_DEFAULT_OPTIONS } from '@/commons/configs/constants';
import lodashMerge from 'lodash.merge';
import clonedeep from 'lodash.clonedeep';

const CLICK_EVENT = 'click.highlight-settings';

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  data() {
    return {
      STEP_INDEX_HIGHLIGHT,
      BIZ_IDS_HIGHLIGHT,

      options: GET_DEFAULT_OPTIONS(),

      dropdownMenu: {
        visible: false,
        fcNodes: [],
      },
    };
  },

  computed: {
    serializedBizIds() {
      const bizIds = this.options.highlight.value;

      if (!Array.isArray(bizIds)) {
        return '';
      }

      return bizIds.map((item) => JSON.stringify(item)).join(', ');
    },
  },

  created() {
    this.flowChartRef.$on(CUSTOM_EVENTS.FLOWCHART_READY, this.onFlowchartReady);
    this.flowChartRef.$on(CUSTOM_EVENTS.FLOWCHART_OPTIONS_CHANGED, this.onFlowchartOptionsChange);
  },

  mounted() {
    this.bindEvents();
  },

  beforeDestroy() {
    this.unbindEvents();
  },

  methods: {
    onFlowchartReady() {
      this.options = clonedeep(this.flowChartRef.fc.getOptions());
    },

    onFlowchartOptionsChange(options) {
      lodashMerge(this.options, options);
    },

    bindEvents() {
      const bizIdsBoxSelector = '.fc-biz-ids-box';

      // click outside .fc-biz-ids-box
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

          this.dropdownMenu.visible = false;
        });
    },

    unbindEvents() {
      jQuery(window).off(CLICK_EVENT);
    },

    changeHighlightType(type) {
      const { fc } = this.flowChartRef;

      fc.updateHighlightType(type);

      this.options = fc.getOptions();
    },

    changeCurrentStepIndex($event) {
      const value = Number($event.target.value.trim());

      this.flowChartRef.fc.setCurrentStepIndex(value);
    },

    handleClickBizIdsInput() {
      const { fc } = this.flowChartRef;

      this.dropdownMenu.visible = true;
      this.dropdownMenu.fcNodes = fc.getFcNodeConfigs();
    },

    handleClickMenuItem(fcNode) {
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

    isIncludeBizId(bizId) {
      const value = this.options.highlight.value || [];

      return value.includes(bizId);
    },

    getFcNodeClasses(type) {
      return `fc-node fc-node-${type.toLowerCase()}`;
    },
  },
};
</script>
<style lang="scss">
.fc-highlight-settings {
  .fc-biz-ids-box {
    position: relative;
    display: inline-block;
  }

  .hl-dropdown-menu {
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

    .hl-menu-item {
      display: flex;
      align-items: center;

      padding: 8px 8px;

      &:hover {
        background: #f3f5f9;
      }
    }
    .hl-menu-item-icon {
      margin-left: 4px;
      color: #c4d0dc;
    }
  }
}

</style>
