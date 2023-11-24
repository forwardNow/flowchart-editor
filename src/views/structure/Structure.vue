<template>
  <div class="flow-chart" ref="box">

    <div class="fc-toolbox">

      <div class="node node-circle">
        <div class="node-inner">
          <div class="node-text">起止符号</div>
        </div>
      </div>
      <div class="node node-rectangle">
        <div class="node-inner">
          <div class="node-text">影音上传（状态：影像扫描）</div>
        </div>
      </div>
      <div class="node node-diamond">
        <div class="node-inner">
          <span class="node-text">决策判断</span>
        </div>
      </div>

    </div>

    <div class="fc-stage"></div>

  </div>
</template>
<script>
import { newInstance, ready } from '@jsplumb/browser-ui'

export default {
  mounted() {
    ready(this.init);
  },

  methods: {
    init() {
      this.instance = newInstance({
        container: this.$refs.box,
      });
    }
  }
}
</script>
