<template>
  <div class="flow-chart-box">
    <FcToolbox
      v-if="toolbox"
      ref="toolbox"
    />

    <FcControls
      v-if="controls"
      ref="controls"
    />

    <div
      ref="stage"
      class="flow-chart"
    />
  </div>
</template>
<script>
import Vue from 'vue';
import clonedeep from 'lodash.clonedeep';
import lodashMerge from 'lodash.merge';
import FcToolbox from '@/components/FcToolbox.vue';
import { DEFAULT_OPTIONS, STORE_KEY_OPTIONS } from '@/commons/configs/constants';
import { FlowChart } from '@/flow-chart/FlowChart';
import FcControls from '@/components/FcControls.vue';

export default Vue.extend({
  name: 'FlowChart',

  components: { FcControls, FcToolbox },

  provide() {
    return {
      flowChartRef: this,
    };
  },

  props: {
    // eslint-disable-next-line vue/require-prop-types
    options: {
      required: true,
    },

    toolbox: {
      type: Boolean,
      default: false,
    },

    controls: {
      type: Boolean,
      default: true,
    },

    controlsPosition: {
      type: String,
      default: 'top-left',
    },
  },

  data() {
    return {
      fcOptions: {},
    };
  },

  watch: {
    options: {
      immediate: true,
      handler(options) {
        if (options == null) {
          return;
        }

        this.fcOptions = clonedeep(this.options);

        this.destroy();

        this.init();
      },
    },
  },

  beforeDestroy() {
    this.destroy();
  },

  methods: {
    init() {
      this.fc = new FlowChart(this.$refs.stage, this.fcOptions);

      const options = this.fc.getOptions();

      if (this.toolbox) {
        this.$refs.toolbox?.init(options);
      }

      if (this.controls) {
        this.$refs.controls?.init(options);
      }
    },

    destroy() {
      if (!this.fc) {
        return;
      }

      this.fc.destroy();
    },

    reset(options) {
      this.destroy();

      this.fcOptions = options;

      this.init();
    },

    getOptionsInLocalStorage() {
      const optionsStr = localStorage.getItem(STORE_KEY_OPTIONS);

      if (!optionsStr) {
        return DEFAULT_OPTIONS;
      }

      let options = JSON.parse(optionsStr);

      options = lodashMerge({}, DEFAULT_OPTIONS, options);

      return options;
    },
  },
});
</script>
<style lang="scss">
@import "@/commons/styles/styles.scss";

.flow-chart-box {
  position: relative;
  width: 100%;
  height: 100%;

  border: solid 1px $fc-border-color;

  line-height: 1.2;
  font-size: 13px;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "微软雅黑", Arial, sans-serif;
  user-select: none;
  overflow: hidden;

  ::-webkit-scrollbar {
    width: 4px;
    height: 4px
  }

  ::-webkit-scrollbar-thumb {
    background-color: rgba(50,50,50,.3)
  }

  ::-webkit-scrollbar-track {
    background-color: rgba(50,50,50,.08)
  }

  &,
  * {
    box-sizing: border-box;
  }

  &:hover {
    .fc-controls {
      opacity: 1;
      pointer-events: all;
    }
  }

  .fc-toolbox + .fc-controls {
    margin-top: 40px;
  }

}

.flow-chart {
  position: relative;
  width: 100%;
  min-height: 100%;

  overflow: visible;

  .jtk-endpoint {
    visibility: hidden;
  }

  &.fc-endpoint-visible {
    .jtk-endpoint {
      visibility: visible;
    }
  }

  .fc-node {
    position: absolute;

    width: $fc-node-base-width;

    color: #666;
    background-color: #cce5ff;

    border: solid $fc-node-base-border-width #99ccff;
    border-radius: 4px;

    cursor: default;
  }

  .fc-node-inner {
    display: flex;
    align-items: center;
    justify-content: center;

    width: 100%;
    min-height: $fc-node-base-height;
  }

  .fc-node-text {
    padding: 2px 4px;
    text-align: center;
    word-break: break-all;
  }

  .fc-node-circle {
    width: 84px;
    border-color: #ffe6cc;
    background-color: #ffffcc;
    border-radius: 24px;
  }

  .fc-node-diamond {
    width: 88px;
    height: 88px;

    border: none 0;
    background-color:  transparent; // rgba(0,0,0,0.2);

    .fc-node-inner {
      padding: 0;
      width: 64px;
      height: 64px;

      border: solid $fc-node-base-border-width #ffcc99;
      background-color: #ffe6cc;

      border-radius: 4px;
      transform: translate(12px, 12px) rotate(45deg);
    }

    .fc-node-text {
      transform: rotate(-45deg);
    }
  }

  .fc-node-skeleton {
    z-index: $z-index-skeleton;
    display: none;

    position: absolute;
    left: -$fc-node-skeleton-padding;
    right: -$fc-node-skeleton-padding;
    top: -$fc-node-skeleton-padding;
    bottom: -$fc-node-skeleton-padding;

    padding: $fc-node-skeleton-padding;

    opacity: 0.5;

    pointer-events: none;
  }

  .fc-selected {
    &.fc-node {
      .fc-node-skeleton {
        display: block;
      }
    }

    &.jtk-connector {
      path {
        &:first-of-type {
          stroke: $color-primary;
        }

        &.jtk-overlay {
          fill: $color-primary;
          stroke: $color-primary;
        }
      }
    }
  }

  .fc-disabled {
    &.fc-node {
      filter: grayscale(100%);
      opacity: 0.5;
    }
  }

  .fc-node-text-input {
    width: 100%;
  }

  [contenteditable='true'] {
    caret-color: red;

    &:focus {
      outline: inset 1px transparent;
      padding: 2px 4px;
    }
  }

  .jtk-overlay {
    z-index: $z-index-jtk-overlay;
    font-size: 12px;
    color: #aab7c4;
    background: #fff;
    pointer-events: none;
  }
}
</style>
