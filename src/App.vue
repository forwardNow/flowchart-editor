<template>
  <div class="page-editor">
    <FlowChart :options="options" toolbox ref="flowchart"/>
  </div>
</template>
<script>
/* eslint-disable object-curly-newline */
import FlowChart from '@/components/FlowChart.vue';

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
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
</style>
