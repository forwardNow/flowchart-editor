<template>
  <div class="page-editor">
    <FlowChart @ready="ready" />
  </div>
</template>
<script>
/* eslint-disable object-curly-newline */
import FlowChart from '@/flow-chart/FlowChart.vue';

export default {
  components: {
    FlowChart,
  },

  methods: {
    ready(fc) {
      // console.log('ready, FlowChart Instance = ', fc);
    },
  },
};
</script>
<style lang="scss">
.page-editor {
  width: 100vw;
  height: 100vh;
}
</style>
