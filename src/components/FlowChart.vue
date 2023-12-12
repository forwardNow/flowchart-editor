<template>
  <div class="flow-chart-box">
    <FcToolbox ref="toolbox" v-if="toolbox" />
    <div class="flow-chart" ref="stage">
      <!--
       <div class="fc-line-ball"></div>
      -->
    </div>
  </div>
</template>
<script>
import clonedeep from 'lodash.clonedeep';
import FcToolbox from '@/commons/components/FcToolbox.vue';
import '@/commons/styles/flow-chart.scss';
import { DEFAULT_OPTIONS, STORE_KEY_OPTIONS } from '@/commons/configs/constants';
import lodashMerge from 'lodash.merge';
import { FlowChart } from '@/components/FlowChart';

export default {
  name: 'FlowChart',
  components: { FcToolbox },

  provide() {
    return {
      flowChartRef: this,
    };
  },

  props: {
    options: {
      required: true,
    },

    toolbox: {
      type: Boolean,
      default: false,
    },
  },

  beforeDestroy() {
    this.destroy();
  },

  data() {
    return {
      fcOptions: {},
    };
  },

  watch: {
    options: {
      immediate: true,
      handler(options) {
        if (options == null) {
          return;
        }

        this.fcOptions = clonedeep(this.options);

        this.destroy();

        this.init();
      },
    },
  },

  methods: {
    init() {
      this.fc = new FlowChart(this.$refs.stage, this.fcOptions);
      this.$refs.toolbox?.init(this.fc.getOptions());
    },

    destroy() {
      if (!this.fc) {
        return;
      }

      this.fc.destroy();
    },

    reset(options) {
      this.destroy();

      this.fcOptions = options;

      this.init();
    },

    getOptionsInLocalStorage() {
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
