<template>
  <div class="flow-chart-box">
    <FcToolbox ref="toolbox" @add-node="handleAddNode"/>
    <div class="flow-chart" ref="stage"/>
  </div>
</template>
<script>
import { FlowChart } from './FlowChart';
import FcToolbox from './components/FcToolbox.vue';

export default {
  name: 'FlowChart',
  components: { FcToolbox },

  mounted() {
    const stageEl = this.$refs.stage;

    this.fc = new FlowChart(stageEl);

    this.$refs.toolbox.init(stageEl);
  },

  methods: {
    handleAddNode(el) {
      const jsPlumbInstance = this.fc.getJsPlumbInstance();

      jsPlumbInstance.manage(el);

      jsPlumbInstance.addEndpoints(el, [
        {
          source: true, target: true, anchor: 'Top', maxConnections: -1,
        },
        {
          source: true, target: true, anchor: 'Right', maxConnections: -1,
        },
        {
          source: true, target: true, anchor: 'Bottom', maxConnections: -1,
        },
        {
          source: true, target: true, anchor: 'Left', maxConnections: -1,
        },
      ]);
    },
  },
};
</script>
