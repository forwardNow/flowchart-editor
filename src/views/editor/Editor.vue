<template>
  <div class="page-editor" @click="handleClickEditor">
    <FlowChart @ready="ready" />
  </div>
</template>
<script>
/* eslint-disable object-curly-newline */
import { EVENT_CONTAINER_CHANGE } from '@jsplumb/browser-ui';
import FlowChart from '@/flow-chart/FlowChart.vue';

export default {
  components: {
    FlowChart,
  },

  methods: {
    ready(fc) {
      this.fc = fc;
    },

    handleClickEditor() {
      const config = this.fc.getConfig();

      console.log(config);
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
