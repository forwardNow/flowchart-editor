<template>
  <div class="flow-chart-box">
    <FcToolbox ref="toolbox" />
    <div class="flow-chart" ref="stage"></div>
  </div>
</template>
<script>
import FcToolbox from '@/flow-chart/commons/components/FcToolbox.vue';
import { STORE_KEY_CONFIG } from '@/flow-chart/commons/configs/constants';
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
    this.fc = new FlowChart(this.$refs.stage);

    this.restore();

    this.$emit(EVENTS.READY, this.fc);
  },

  methods: {
    restore() {
      const configStr = localStorage.getItem(STORE_KEY_CONFIG);

      if (!configStr) {
        return;
      }

      const config = JSON.parse(configStr);

      console.log('config in localStorage: ', config);

      this.fc.createFlowChartWithConfig(config);
    },
  },
};
</script>
