<template>
  <div class="page-editor">
    <FlowChart :options="options" toolbox />
  </div>
</template>
<script>
/* eslint-disable object-curly-newline */
import FlowChart from '@/flow-chart/FlowChart.vue';
import { DEFAULT_OPTIONS, STORE_KEY_OPTIONS } from '@/flow-chart/commons/configs/constants';
import lodashMerge from 'lodash.merge';

export default {
  components: {
    FlowChart,
  },

  mounted() {
    const options = this.getOptions();

    options.highlight.value = -1;

    this.options = options;
  },

  data() {
    return {
      options: null,
    };
  },

  methods: {
    getOptions() {
      const optionsStr = localStorage.getItem(STORE_KEY_OPTIONS);

      if (!optionsStr) {
        return DEFAULT_OPTIONS;
      }

      let options = JSON.parse(optionsStr);

      options = lodashMerge({}, DEFAULT_OPTIONS, options);

      return options;
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
