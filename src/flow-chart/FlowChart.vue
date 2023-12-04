<template>
  <div class="flow-chart-box">
    <FcToolbox ref="toolbox" />
    <div class="flow-chart" ref="stage">
      <!-- <div class="fc-line-ball"></div> -->
    </div>
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
    this.fc = new FlowChart(this.$refs.stage, {
      currentStepIndex: this.options.currentStepIndex,
      config: this.getConfig(),
    });

    this.$emit(EVENTS.READY, this.fc);
  },

  data() {
    return {
      options: {
        currentStepIndex: 2,
      },
    };
  },

  methods: {
    getConfig() {
      const configStr = localStorage.getItem(STORE_KEY_CONFIG);

      if (!configStr) {
        return null;
      }

      return JSON.parse(configStr);
    },
  },
};
</script>
