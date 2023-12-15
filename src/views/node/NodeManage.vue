<template>
  <div class="stage-demo" ref="stage" >

    <div class="fc-node fc-node-circle" ref="sourceNode">
      <div class="fc-node-inner">
        <div class="fc-node-text">起止符号</div>
      </div>
    </div>

    <div class="fc-node fc-node-rectangle" ref="targetNode" style="left: 200px;">
      <div class="fc-node-inner">
        <div class="fc-node-text">任务内容</div>
      </div>
    </div>

  </div>
</template>
<script>
import {
  DEFAULT_KEY_CONTAINER, // "container"
  newInstance,
} from '@jsplumb/browser-ui';

export default {
  mounted() {
    const stageElement = this.$refs.stage;
    const sourceElement = this.$refs.sourceNode;
    const targetElement = this.$refs.targetNode;

    const jsPlumbInstance = newInstance({
      [DEFAULT_KEY_CONTAINER]: stageElement,
    });

    jsPlumbInstance.manage(sourceElement);

    jsPlumbInstance.manage(targetElement, 'managed-id-123');
  },
};
</script>
