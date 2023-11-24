<template>
  <div class="flow-chart">
    <div class="fc-node fc-node-circle">
      <div class="fc-node-inner">
        <div class="fc-node-text">起止符号</div>
      </div>
    </div>

    <div class="fc-node fc-node-rectangle">
      <div class="fc-node-inner">
        <div class="fc-node-text">任务内容（状态：已完成）</div>
      </div>
    </div>

    <div class="fc-node fc-node-diamond">
      <div class="fc-node-inner">
        <span class="fc-node-text">决策判断</span>
      </div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.fc-node {
  position: static;
  margin: 24px;
}
</style>
