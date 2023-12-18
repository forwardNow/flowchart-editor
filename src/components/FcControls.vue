<template>
  <div class="fc-controls">
    <div class="fc-controls-inner">
      <div class="fc-control-item" @click="zoomIn"><IconZoomIn /></div>
      <div class="fc-control-item" @click="zoomOut"><IconZoomOut /></div>
    </div>
  </div>
</template>
<script>
import IconZoomIn from '@/components/icons/IconZoomIn.vue';
import IconZoomOut from '@/components/icons/IconZoomOut.vue';

export default {
  components: { IconZoomOut, IconZoomIn },

  inject: ['flowChartRef'],

  methods: {
    // invoke by FlowChart.vue
    init() {
      /* do nothing */
    },

    zoomIn() {
      this.flowChartRef.fc.increaseScale();
    },

    zoomOut() {
      this.flowChartRef.fc.decreaseScale();
    },

  },
};
</script>
