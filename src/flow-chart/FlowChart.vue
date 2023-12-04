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
import { STORE_KEY_OPTIONS } from '@/flow-chart/commons/configs/constants';
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
    this.getOptions();

    this.fc = new FlowChart(this.$refs.stage, this.options);

    this.$emit(EVENTS.READY, this.fc);
  },

  data() {
    return {
      options: {
        currentStepIndex: 2,
        visibleOfEndpoints: false,
        config: null,
      },
    };
  },

  methods: {
    getOptions() {
      const optionsStr = localStorage.getItem(STORE_KEY_OPTIONS);

      if (!optionsStr) {
        return null;
      }

      const options = JSON.parse(optionsStr);

      if (options.currentStepIndex == null) {
        options.currentStepIndex = -1;
      }

      this.options = options;

      return options;
    },
  },
};
</script>
