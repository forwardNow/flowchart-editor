<template>
  <div
    v-show="visible"
    class="fc-node-info fc-toolbox-list fc-info-list"
  >
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="bizId">ID:</span>
      <input
        v-model.trim="nodeInfo.bizId"
        class="fc-info-item-cont fc-info-item-input"
        @input="changeNodeBizId"
      >
    </div>
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="stepIndex">步骤索引:</span>
      <input
        v-model.trim.number="nodeInfo.stepIndex"
        class="fc-info-item-cont fc-info-item-input"
        type="number"
        @input="changeNodeStepIndex"
      >
    </div>
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="sort">排序:</span>
      <input
        v-model.trim.number="nodeInfo.sort"
        class="fc-info-item-cont fc-info-item-input"
        type="number"
        @input="changeNodeSort"
      >
    </div>
    <div class="fc-info-item">
      <span class="fc-info-item-label" title="text">节点内容:</span>
      <span class="fc-info-item-cont">{{ nodeInfo.text }}</span>
    </div>
  </div>
</template>
<script>
import { CUSTOM_EVENTS } from '@/commons/configs/constants';

const UPDATE_VISIBLE = 'update:visible';

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  props: {
    visible: {
      type: Boolean,
      required: true,
    },
  },

  data() {
    return {
      nodeInfo: {
        id: '',
        bizId: '',
        type: '',
        text: '',
        position: { x: 0, y: 0 },
        stepIndex: 0,
        sort: 0,
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
      this.flowChartRef.fc.on(CUSTOM_EVENTS.SELECT_NODE, this.onSelectNode);
      this.flowChartRef.fc.on(CUSTOM_EVENTS.UNSELECT_NODE, this.onUnselectNode);
    },

    unbindEvents() {
      this.flowChartRef.fc.off(CUSTOM_EVENTS.SELECT_NODE, this.onSelectNode);
      this.flowChartRef.fc.off(CUSTOM_EVENTS.UNSELECT_NODE, this.onUnselectNode);
    },

    onSelectNode(fcNode) {
      if (!fcNode) {
        return;
      }

      this.nodeInfo = { ...fcNode };
      this.$emit(UPDATE_VISIBLE, true);
    },

    onUnselectNode() {
      this.$emit(UPDATE_VISIBLE, false);
    },

    changeNodeStepIndex() {
      const { fc } = this.flowChartRef;
      const { stepIndex } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setStepIndexOfFcElement(selectedNode, stepIndex);
    },

    changeNodeSort() {
      const { fc } = this.flowChartRef;
      const { sort } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setSortOfFcElement(selectedNode, sort);
    },

    changeNodeBizId() {
      const { fc } = this.flowChartRef;
      const { bizId } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setBizIdOfFcElement(selectedNode, bizId);
    },
  },
};
</script>
