<template>
  <div class="fc-stage-settings fc-toolbox-list fc-info-list">
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="node.endpoint.show">
        显示端点:
      </span>
      <input
        v-model="options.node.endpoint.show"
        class="fc-info-item-cont"
        type="checkbox"
        @change="changeVisibleOfEndpoints"
      >
    </div>

    <div class="fc-info-item">
      <span class="fc-info-item-label" title="node.endpoint.show">
        节点可拖拽:
      </span>
      <input
        v-model="options.node.draggable"
        class="fc-info-item-cont"
        type="checkbox"
        @change="changeDraggableOfNode"
      >
    </div>

    <div class="fc-info-item">
      <span class="fc-info-item-label" title="stage.scale.value">
        画布缩放:
      </span>
      <span class="fc-info-item-cont" title="stage.scale.value">
        {{ options.stage.scale.value }}
      </span>
    </div>

    <div class="fc-info-item">
      <span class="fc-info-item-label" title="stage.offset">
        画布偏移量:
      </span>
      <span class="fc-info-item-cont" title="stage.offset">
        {{ formatOffsetText() }}
      </span>
    </div>
  </div>
</template>
<script>
import lodashMerge from 'lodash.merge';
import clonedeep from 'lodash.clonedeep';
import { CUSTOM_EVENTS, GET_DEFAULT_OPTIONS } from '@/commons/configs/constants';

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  data() {
    return {
      options: GET_DEFAULT_OPTIONS(),
    };
  },

  created() {
    this.flowChartRef.$on(CUSTOM_EVENTS.FLOWCHART_READY, this.onFlowchartReady);
    this.flowChartRef.$on(CUSTOM_EVENTS.FLOWCHART_OPTIONS_CHANGED, this.onFlowchartOptionsChange);
  },

  methods: {
    onFlowchartReady() {
      this.options = clonedeep(this.flowChartRef.fc.getOptions());

      this.flowChartRef.fc.on(CUSTOM_EVENTS.STAGE_MOVE, (offset) => {
        this.options.stage.offset = offset;
      });

      this.flowChartRef.fc.on(CUSTOM_EVENTS.STAGE_SCALE_CHANGED, (scale) => {
        this.options.stage.scale.value = scale;
      });
    },

    onFlowchartOptionsChange(options) {
      lodashMerge(this.options, options);
    },

    changeVisibleOfEndpoints() {
      this.flowChartRef.fc.setVisibleOfEndpoints(this.options.node.endpoint.show);
    },

    changeDraggableOfNode() {
      this.flowChartRef.fc.setNodeDraggable(this.options.node.draggable);
    },

    // --

    formatOffsetText() {
      let { x, y } = this.options.stage.offset;

      x = Math.floor(x);
      y = Math.floor(y);

      return `(${x}, ${y})`;
    },
  },
};
</script>
