<template>
  <div class="fc-highlight-settings fc-toolbox-list fc-info-list">
    <div class="fc-info-item">
      <span class="fc-ii-label" title="highlight.type">
        高亮类型:
      </span>
      <label title="'STEP_INDEX'">
        <input
          class="fc-ii-cont"
          type="radio"
          :checked="options.highlight.type === 'STEP_INDEX'"
          @change="changeHighlightType('STEP_INDEX')"
        >
        步骤
      </label>
      <label title="'BIZ_IDS'">
        <input
          class="fc-ii-cont"
          type="radio"
          :checked="options.highlight.type === 'BIZ_IDS'"
          @change="changeHighlightType('BIZ_IDS')"
        >
        单独指定
      </label>
    </div>

    <div class="fc-info-item">
      <template v-if="options.highlight.type === 'STEP_INDEX'">
        <span class="fc-ii-label" title="highlight.value">
          当前步骤:
        </span>
        <input
          :value="options.highlight.value"
          class="fc-ii-cont fc-ii-input"
          type="number"
          title="-1, 全部高亮"
          @input="changeCurrentStepIndex($event)"
        >
      </template>

      <template v-if="options.highlight.type === 'BIZ_IDS'">
        <span class="fc-ii-label" title="highlight.value">ID集合:</span>

        <div class="fc-ii-cont fc-biz-ids-box" @wheel.stop>
          <input
            class="fc-ii-input"
            :value="JSON.stringify(options.highlight.value)"
            readonly
            title="ID 数组"
            @click="handleClickBizIdsInput"
          >

          <div v-show="dropdownMenu.visible" class="fc-dropdown-menu">
            <div
              v-for="(item, i) in dropdownMenu.fcNodes" :key="i"
              class="fc-menu-item"
              @click="handleClickMenuItem(item)"
            >
              <input type="checkbox" :checked="isIncludeBizId(item.bizId)">
              <div class="fc-menu-item-icon" :class="getFcNodeClasses(item.type)" />
              <div class="fc-menu-item-text">
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

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  data() {
    return {
      dropdownMenu: {
        visible: false,
        fcNodes: [],
      },
    };
  },

  computed: {
    options() {
      return this.toolboxRef.options;
    },
  },

  mounted() {
    this.bindEvents();
  },

  methods: {
    bindEvents() {
      const bizIdsBoxSelector = '.fc-biz-ids-box';

      // click outside .fc-biz-ids-box
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

          this.dropdownMenu.visible = false;
        });
    },

    changeHighlightType(type) {
      const { fc } = this.flowChartRef;

      fc.updateHighlightType(type);

      this.toolboxRef.options = fc.getOptions();
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
}

.fc-dropdown-menu {
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

  .fc-menu-item {
    display: flex;
    align-items: center;

    padding: 8px 8px;

    &:hover {
      background: #f3f5f9;
    }
  }
  .fc-menu-item-icon {
    margin-left: 4px;
    color: #c4d0dc;
  }
}
</style>
