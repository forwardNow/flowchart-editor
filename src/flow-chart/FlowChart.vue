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
import FcToolbox from '@/flow-chart/commons/components/FcToolbox.vue';
import { FlowChart } from './FlowChart';
import './commons/styles/flow-chart.scss';

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

      if (this.$refs.toolbox) {
        this.$refs.toolbox.init(this.fc.getOptions());
      }
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
  },
};
</script>
