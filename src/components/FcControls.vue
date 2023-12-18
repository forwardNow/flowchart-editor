<template>
  <div class="fc-controls">
    <div class="fc-controls-inner">
      <div
        class="fc-control-item"
        @click="zoomIn"
        title="放大（Alt + 鼠标滚轮，缩放画布）"
      >
        <IconZoomIn />
      </div>

      <div
        class="fc-control-item"
        @click="zoomOut"
        title="缩小（Alt + 鼠标滚轮，缩放画布）"
      >
        <IconZoomOut />
      </div>
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
