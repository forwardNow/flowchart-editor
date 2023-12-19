<template>
  <div class="page-editor">
    <FlowChart
      :options="options"
      :toolbox="true"
      ref="flowchart"
    />
  </div>
</template>
<script>
import FlowChart from '@/flow-chart/FlowChart.vue';

export default {
  components: {
    FlowChart,
  },

  mounted() {
    this.options = this.getOptions();
  },

  data() {
    return {
      options: null,
    };
  },

  methods: {
    getOptions() {
      return this.$refs.flowchart.getOptionsInLocalStorage();
    },
  },
};
</script>
<style lang="scss">
.page-editor {
  height: 200vh;

  .flow-chart-box {
    width: 100vw;
    height: 100vh;
  }
}
</style>
