<template>
  <div class="fc-controls">
    <div class="fc-controls-inner">
      <div
        class="fc-control-item"
        title="放大（Alt + 鼠标滚轮，缩放画布）"
        @click="zoomIn"
      >
        <IconZoomIn />
      </div>

      <div
        class="fc-control-item"
        title="缩小（Alt + 鼠标滚轮，缩放画布）"
        @click="zoomOut"
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
<style lang="scss">
@import "@/commons/styles/vars";

.fc-controls {
  z-index: $z-index-controls;
  position: absolute;
  top: 24px;
  left: 24px;

  pointer-events: none;
  opacity: 0;

  transition: opacity 1s;

  .fc-controls-inner {
    display: flex;
    align-items: center;
  }

  .fc-control-item {
    display: flex;
    align-items: center;
    justify-content: center;

    padding: 4px;
    margin-right: 8px;
    background: #4096ff;
    border-radius: 3px;

    &:hover {
      background: #91caff;
    }

    svg path {
      fill: #fff;
    }
  }
}
</style>
