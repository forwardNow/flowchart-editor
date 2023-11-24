<template>
  <div class="flow-chart">

    <div class="fc-stage">

      <div class="fc-node fc-node-circle" id="node_id_1">
        <div class="fc-node-inner">
          <div class="fc-node-text">起止符号</div>
        </div>
      </div>

      <div class="fc-node fc-node-rectangle" id="node_id_2">
        <div class="fc-node-inner">
          <div class="fc-node-text">任务内容（状态：已经完成）</div>
        </div>
      </div>

      <div class="fc-node fc-node-diamond" id="node_id_3">
        <div class="fc-node-inner">
          <span class="fc-node-text">决策判断</span>
        </div>
      </div>

    </div>

  </div>
</template>
<script>
import { newInstance, ready } from '@jsplumb/browser-ui';

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

      const node1 = document.querySelector('#node_id_1');
      const node2 = document.querySelector('#node_id_2');
      const node3 = document.querySelector('#node_id_3');

      this.jsPlumbIns.manage(node1/* , 'node_id_1' */);
      this.jsPlumbIns.manage(node2/* , 'node_id_2' */);
      this.jsPlumbIns.manage(node3/* , 'node_id_3' */);
    },
  },
};
</script>
