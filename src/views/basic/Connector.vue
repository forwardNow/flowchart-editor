<template>
  <div class="flow-chart">

    <div class="fc-stage">

      <div class="fc-node fc-node-circle" id="node_id_1" style="left: 0; top: 100px;">
        <div class="fc-node-inner">
          <div class="fc-node-text">起止符号</div>
        </div>
      </div>

      <div class="fc-node fc-node-rectangle" id="node_id_2" style="left: 200px; top: 100px;">
        <div class="fc-node-inner">
          <div class="fc-node-text">任务内容（状态：已经完成）</div>
        </div>
      </div>

      <div class="fc-node fc-node-diamond" id="node_id_3" style="left: 400px; top: 100px;">
        <div class="fc-node-inner">
          <span class="fc-node-text">决策判断</span>
        </div>
      </div>

    </div>

  </div>
</template>
<script>
import {
  newInstance,
  ready,
  StraightConnector,
  BezierConnector,
  FlowchartConnector,
  AnchorLocations,
  BlankEndpoint, ArrowOverlay,
} from '@jsplumb/browser-ui';

export default {
  mounted() {
    ready(this.init);
  },

  methods: {
    init() {
      const fcStageElement = document.querySelector('.fc-stage');

      this.jsPlumbIns = newInstance({
        container: fcStageElement,

        /**
         * Whether or not elements should be draggable.
         * Default value is `true`.
         */
        elementsDraggable: true,
      });

      // 修改默认样式
      this.jsPlumbIns.importDefaults({
        /**
         * StraightConnector
         * BezierConnector
         * FlowchartConnector
         */
        connector: {
          type: FlowchartConnector.type,
          options: {
            cornerRadius: 3,
          },
        },

        // 连线两端的样式
        endpoint: {
          type: BlankEndpoint.type,
        },

        // 连线与元素 连接点的样式
        anchor: AnchorLocations.AutoDefault,
      });

      const node1 = document.querySelector('#node_id_1');
      const node2 = document.querySelector('#node_id_2');
      const node3 = document.querySelector('#node_id_3');

      this.jsPlumbIns.connect({
        source: node1,
        target: node2,

        /**
         * Whether or not the connection is detachable.
         * Defaults to true.
         */
        detachable: false,

        overlays: [
          {
            type: ArrowOverlay.type,
            options: {
              location: 1,
              width: 10,
              length: 10,
            },
          },
        ],
      });

      this.jsPlumbIns.connect({
        source: node2,
        target: node3,

        /**
         * Whether or not the connection is detachable.
         * Defaults to true.
         */
        detachable: false,

        overlays: [
          {
            type: ArrowOverlay.type,
            options: {
              location: 1,
              width: 10,
              length: 10,
            },
          },
        ],
      });
    },
  },
};
</script>
