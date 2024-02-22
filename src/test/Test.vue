<template>
  <div class="page-editor">
    <FlowChart
      ref="flowchart"
      :options="options"
      :toolbox="true"
      :controls="false"
    />
  </div>
</template>
<script>
import FlowChart from '@/flow-chart/FlowChart.vue';

export default {
  components: {
    FlowChart,
  },

  data() {
    return {
      options: null,
    };
  },

  mounted() {
    this.options = this.getOptions();
  },

  methods: {
    getOptions() {
      return this.$refs.flowchart.getOptionsInLocalStorage();
    },
  },
};
</script>
<style lang="scss">
body {
  padding: 0;
  margin: 0;
}
.page-editor {
  .flow-chart-box {
    width: 100vw;
    height: 100vh;
  }
}
</style>
