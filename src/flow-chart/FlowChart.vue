<template>
  <div class="flow-chart-box">
    <FcToolbox ref="toolbox" />
    <div class="flow-chart" ref="stage">
      <!--
       <div class="fc-line-ball"></div>
      -->
    </div>
  </div>
</template>
<script>
import FcToolbox from '@/flow-chart/commons/components/FcToolbox.vue';
import { DEFAULT_OPTIONS, STORE_KEY_OPTIONS } from '@/flow-chart/commons/configs/constants';
import lodashMerge from 'lodash.merge';
import { FlowChart } from './FlowChart';

const EVENTS = {
  READY: 'ready',
};

export default {
  name: 'FlowChart',
  components: { FcToolbox },

  provide() {
    return {
      flowChartRef: this,
    };
  },

  mounted() {
    const options = this.getOptions();

    this.fc = new FlowChart(this.$refs.stage, options);

    this.$emit(EVENTS.READY, this.fc);
  },

  methods: {
    getOptions() {
      const optionsStr = localStorage.getItem(STORE_KEY_OPTIONS);

      if (!optionsStr) {
        return DEFAULT_OPTIONS;
      }

      let options = JSON.parse(optionsStr);

      options = lodashMerge({}, DEFAULT_OPTIONS, options);

      return options;
    },
  },
};
</script>
