<template>
  <div class="fc-stage-settings fc-toolbox-list fc-info-list">
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="node.endpoint.show">
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
        ({{ options.stage.offset.x }}, {{ options.stage.offset.y }})
      </span>
    </div>
  </div>
</template>
<script>
import lodashMerge from 'lodash.merge';
import clonedeep from 'lodash.clonedeep';
import { EVENTS, GET_DEFAULT_OPTIONS } from '@/commons/configs/constants';

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  data() {
    return {
      options: GET_DEFAULT_OPTIONS(),
    };
  },

  created() {
    this.flowChartRef.$on(EVENTS.FLOWCHART_READY, this.onFlowchartReady);
    this.flowChartRef.$on(EVENTS.FLOWCHART_OPTIONS_CHANGED, this.onFlowchartOptionsChange);
  },

  methods: {
    onFlowchartReady() {
      this.options = clonedeep(this.flowChartRef.fc.getOptions());
    },

    onFlowchartOptionsChange(options) {
      lodashMerge(this.options, options);
    },

    changeVisibleOfEndpoints() {
      this.flowChartRef.fc.setVisibleOfEndpoints(this.options.node.endpoint.show);
    },
  },
};
</script>
