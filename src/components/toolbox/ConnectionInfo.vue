<template>
  <div
    v-show="visible"
    class="fc-connection-info fc-toolbox-list fc-info-list"
  >
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="label">连线标签:</span>
      <input
        v-model.trim="connectionInfo.label"
        class="fc-info-item-cont fc-info-item-input"
        @input="changeConnectionLabel"
      >
    </div>
  </div>
</template>
<script>
import lodashDebounce from 'lodash.debounce';
import { EVENTS } from '@/commons/configs/constants';

const CUSTOM_EVENTS = {
  UPDATE_VISIBLE: 'update:visible',
};

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  props: {
    visible: {
      type: Boolean,
    },
  },

  data() {
    return {
      connectionInfo: {
        type: '',
        sourceId: '',
        sourceAnchor: '',
        targetId: '',
        targetAnchor: '',
        label: '',
      },
    };
  },

  created() {
    this.flowChartRef.$on(EVENTS.FLOWCHART_READY, this.onFlowchartReady);
  },

  beforeDestroy() {
    this.unbindEvents();
  },

  methods: {
    onFlowchartReady() {
      this.bindEvents();
    },

    bindEvents() {
      this.flowChartRef.fc.on(EVENTS.SELECT_CONNECTION, this.handleClickConnection);
    },
    unbindEvents() {
      this.flowChartRef.fc.off(EVENTS.SELECT_CONNECTION, this.handleClickConnection);
    },

    handleClickConnection(fcConnection) {
      if (!fcConnection) {
        return;
      }

      this.connectionInfo = { ...fcConnection };

      this.$emit(CUSTOM_EVENTS.UPDATE_VISIBLE, true);
    },

    changeConnectionLabel: lodashDebounce(function f() {
      const { fc } = this.flowChartRef;

      const selectedJsPlumbConnection = fc.getSelectedJsPlumbConnection();

      fc.setLabelOfJsPlumbConnection(selectedJsPlumbConnection, this.connectionInfo.label);
    }, 300),
  },
};
</script>
