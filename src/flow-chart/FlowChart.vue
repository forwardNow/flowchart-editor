<template>
  <div class="flow-chart-box">
    <FcToolbox ref="toolbox" />
    <div class="flow-chart" ref="stage"/>
  </div>
</template>
<script>
import { FlowChart } from './FlowChart';
import FcToolbox from './components/FcToolbox.vue';

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

    this.$emit(EVENTS.READY, this.fc);
  },

  methods: {
  },
};
</script>
