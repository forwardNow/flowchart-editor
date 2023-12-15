<template>
  <div class="fc-ui">

    <div class="fc-ui-card">
      <div class="fc-node fc-node-circle">
        <div class="fc-node-inner">
          <div class="fc-node-text">起止符号</div>
        </div>
      </div>

      <div class="fc-node fc-node-rectangle">
        <div class="fc-node-inner">
          <div class="fc-node-text">任务内容</div>
        </div>
      </div>

      <div class="fc-node fc-node-diamond">
        <div class="fc-node-inner">
          <span class="fc-node-text">决策判断</span>
        </div>
      </div>
    </div>

    <div class="fc-ui-card">
      <div class="fc-node-plain fc-node-plain-circle"></div>

      <div class="fc-node-plain fc-node-plain-rectangle"></div>

      <div class="fc-node-plain fc-node-plain-diamond"></div>
    </div>

  </div>
</template>

<!-- fc-ui -->
<style lang="scss">
.fc-ui {
  display: flex;

  .fc-ui-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;

    padding: 24px;
    margin: 48px;

    border: solid 1px #ddd;
  }
}
</style>

<!-- fc-node -->
<style lang="scss">
$color-primary: #026dff;

$fc-node-base-width: 128px;
$fc-node-base-height: 44px;
$fc-node-base-border-width: 1px;

.fc-node {
  width: $fc-node-base-width;

  font-size: 13px;

  color: #666;
  background-color: #cce5ff;

  border: solid $fc-node-base-border-width #99ccff;
  border-radius: 4px;

  cursor: default;
}

.fc-node-inner {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  min-height: $fc-node-base-height;
}

.fc-node-text {
  padding: 2px 4px;
  text-align: center;
  word-break: break-all;
}

.fc-node-circle {
  width: 84px;
  border-color: #ffe6cc;
  background-color: #ffffcc;
  border-radius: 24px;
}

.fc-node-diamond {
  width: 88px;
  height: 88px;

  border: none 0;
  background-color: transparent; // rgba(0,0,0,0.2);

  .fc-node-inner {
    padding: 0;
    width: 64px;
    height: 64px;

    border: solid $fc-node-base-border-width #ffcc99;
    background-color: #ffe6cc;

    border-radius: 4px;
    transform: translate(12px, 12px) rotate(45deg);
  }

  .fc-node-text {
    transform: rotate(-45deg);
  }
}
</style>

<!-- fc-node-plain -->
<style lang="scss">
.fc-node-plain {
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
.fc-node-plain-circle {
  &:before {
    border-radius: 100px;
  }
}
.fc-node-plain-diamond {
  &:before {
    width: 16px;
    transform: rotate(45deg);
  }
}
</style>

<!-- stage-demo -->
<style lang="scss">
.stage-demo {
  position: relative;
  margin: 20px;
  width: 800px;
  height: 400px;
  border: 1px solid #a2a2a2;
  border-radius: 3px;
  background-color: #f5f5f5;
  overflow: hidden;

  .fc-node {
    position: absolute;
  }
}
</style>
