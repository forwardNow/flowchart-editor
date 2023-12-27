<template>
  <div class="fc-toolbox">
    <div class="fc-toolbox-top">
      <ToolButtons />

      <FcDivider />

      <ShapeList />

      <FcDivider />

      <HighlightSettings />

      <FcDivider />

      <StageSettings />
    </div>

    <div v-show="visibleOfToolboxBottom" class="fc-toolbox-bottom">
      <NodeInfo :visible.sync="visibleOfNodeInfo" />
      <ConnectionInfo :visible.sync="visibleOfConnectionInfo" />
    </div>
  </div>
</template>
<script>
import { CUSTOM_EVENTS } from '@/commons/configs/constants';
import ToolButtons from '@/components/toolbox/ToolButtons.vue';
import FcDivider from '@/components/toolbox/FcDivider.vue';
import ShapeList from '@/components/toolbox/ShapeList.vue';
import HighlightSettings from '@/components/toolbox/HighlightSettings.vue';
import StageSettings from '@/components/toolbox/StageSettings.vue';
import NodeInfo from '@/components/toolbox/NodeInfo.vue';
import ConnectionInfo from '@/components/toolbox/ConnectionInfo.vue';

export default {
  name: 'FcToolbox',
  components: {
    ConnectionInfo,
    NodeInfo,
    StageSettings,
    HighlightSettings,
    ShapeList,
    FcDivider,
    ToolButtons,
  },

  inject: ['flowChartRef'],

  provide() {
    return {
      toolboxRef: this,
    };
  },

  data() {
    return {
      visibleOfNodeInfo: false,
      visibleOfConnectionInfo: false,
    };
  },

  computed: {
    visibleOfToolboxBottom() {
      return this.visibleOfNodeInfo || this.visibleOfConnectionInfo;
    },
  },

  created() {
    this.flowChartRef.$on(CUSTOM_EVENTS.FLOWCHART_READY, this.onFlowchartReady);
  },

  methods: {
    onFlowchartReady() {
      /* do nothing */
    },
  },
};
</script>
<style lang="scss">
@import "@/commons/styles/vars";

.fc-toolbox {
  z-index: $z-index-toolbox;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 40px;

  .fc-toolbox-top {
    display: flex;
    align-items: center;
    gap: 0 16px;

    padding: 8px 16px;
    width: 100%;
    height: 100%;

    background-color: #f6f7f8;
    border: 1px solid #E9E9E9;
  }

  .fc-toolbox-bottom {
    display: flex;
    align-items: center;
    gap: 0 16px;

    padding: 8px 16px;
    height: 40px;
    margin-top: -1px;

    background-color: #f6f7f8;
    border: 1px solid #E9E9E9;
  }

  .fc-toolbox-list {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .fc-toolbox-item {
    display: flex;
    align-items: center;
    justify-content: center;

    margin-left: 8px;
    padding: 4px;
    height: 28px;
    min-width: 28px;

    border-radius: 4px;

    &:first-child {
      margin-left: 0;
    }

    &:hover {
      background-color: #eaecee;
    }
  }

  .fc-info-list {
    font-size: 12px;
  }

  .fc-info-item {
    margin-right: 24px;

    &:last-child {
      margin-right: 0;
    }
  }

  .fc-info-item-label {
    color: #999;
  }
  .fc-info-item-cont {
    margin: 0 0 0 4px;
    color: #333;
    vertical-align: middle;
  }
  .fc-info-item-input {
    display: inline-block;
    padding: 0 0 0 8px;
    height: 28px;
    width: 10em;
    line-height: 32px;
    outline: none;
    border: 1px solid #dcdfe6;
    color: #606266;
    background: #fff;
    appearance: none;

    &:hover,
    &:focus {
      border-color: $color-primary;
    }

    &[type="number"] {
      width: 4.5em;
    }
  }

  .fc-node {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 24px;
    height: 16px;
    color: #212930;

    &:before {
      content: '';
      width: 100%;
      height: 100%;
      border: solid 2px;
      border-radius: 2px;

      scale: 0.75;
    }
  }

  .fc-node-circle {
    &:before {
      border-radius: 100px;
    }
  }

  .fc-node-diamond {
    &:before {
      width: 16px;
      transform: rotate(45deg);
    }
  }

}
</style>
