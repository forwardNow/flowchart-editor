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
import { CUSTOM_EVENTS } from '@/commons/configs/constants';

const UPDATE_VISIBLE = 'update:visible';

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
    this.flowChartRef.$on(CUSTOM_EVENTS.FLOWCHART_READY, this.onFlowchartReady);
  },

  beforeDestroy() {
    this.unbindEvents();
  },

  methods: {
    onFlowchartReady() {
      this.bindEvents();
    },

    bindEvents() {
      this.flowChartRef.fc.on(CUSTOM_EVENTS.SELECT_CONNECTION, this.onSelectConnection);
      this.flowChartRef.fc.on(CUSTOM_EVENTS.UNSELECT_CONNECTION, this.onUnselectConnection);
    },
    unbindEvents() {
      this.flowChartRef.fc.off(CUSTOM_EVENTS.SELECT_CONNECTION, this.onSelectConnection);
      this.flowChartRef.fc.off(CUSTOM_EVENTS.UNSELECT_CONNECTION, this.onUnselectConnection);
    },

    onSelectConnection(fcConnection) {
      if (!fcConnection) {
        return;
      }

      this.connectionInfo = { ...fcConnection };

      this.$emit(UPDATE_VISIBLE, true);
    },

    onUnselectConnection() {
      this.$emit(UPDATE_VISIBLE, false);
    },

    changeConnectionLabel: lodashDebounce(function f() {
      const { fc } = this.flowChartRef;

      const selectedJsPlumbConnection = fc.getSelectedJsPlumbConnection();

      fc.setLabelOfJsPlumbConnection(selectedJsPlumbConnection, this.connectionInfo.label);
    }, 300),
  },
};
</script>
