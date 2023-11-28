<template>
  <div class="page-editor">
    <FlowChart />
  </div>
</template>
<script>
/* eslint-disable object-curly-newline */

import FlowChart from '@/flow-chart/FlowChart.vue';

export default {
  components: {
    FlowChart,
  },
};
</script>
<style lang="scss">
.page-editor {
  width: 100vw;
  height: 100vh;
}
</style>
