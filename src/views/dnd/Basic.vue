<template>
  <div class="fc-editor dnd-basic">
    <div class="fc-editor-toolbox">

      <div class="fc-node fc-node-circle" style="top: 100px;">
        <div class="fc-node-inner">
          <div class="fc-node-text">起止符号</div>
        </div>
      </div>

      <div class="fc-node fc-node-rectangle" style="top: 200px;">
        <div class="fc-node-inner">
          <div class="fc-node-text">任务内容（状态：已经完成）</div>
        </div>
      </div>

      <div class="fc-node fc-node-diamond" style="top: 300px;">
        <div class="fc-node-inner">
          <span class="fc-node-text">决策判断</span>
        </div>
      </div>

    </div>
    <div class="fc-editor-stage">
      <div class="flow-chart" />
    </div>
  </div>
</template>
<script>
import interact from 'interactjs';

export default {
  mounted() {
    this.init();
  },

  methods: {
    init() {
      const toolboxElement = document.querySelector('.fc-editor-toolbox');
      const stageElement = document.querySelector('.flow-chart');

      const toolbox = {
        el: toolboxElement,
        x: 0,
        y: 0,
      };
      const stage = {
        el: stageElement,
        x: 0,
        y: 0,
      };

      ({ x: toolbox.x, y: toolbox.y } = toolboxElement.getBoundingClientRect());
      ({ x: stage.x, y: stage.y } = stageElement.getBoundingClientRect());

      const mirror = {
        el: null,
        dx: toolbox.x - stage.x,
        dy: toolbox.y - stage.y,
        x: 0,
        y: 0,
      };

      interact('.fc-editor-toolbox .fc-node')
        .draggable({
          autoScroll: true,

          listeners: {
            start(event) {
              const { currentTarget } = event;

              const { offsetLeft, offsetTop } = currentTarget;

              const mirrorNode = currentTarget.cloneNode(true);

              mirror.x = offsetLeft + mirror.dx;
              mirror.y = offsetTop + mirror.dy;

              mirror.el = mirrorNode;

              mirror.el.style.left = `${mirror.x}px`;
              mirror.el.style.top = `${mirror.y}px`;

              stageElement.appendChild(mirror.el);
            },

            move(event) {
              const { dx, dy } = event;

              mirror.x += dx;
              mirror.y += dy;

              mirror.el.style.left = `${mirror.x}px`;
              mirror.el.style.top = `${mirror.y}px`;
            },

            end() {
              if (mirror.x < 0) {
                stageElement.removeChild(mirror.el);
              }
            },
          },
        });
    },

  },
};
</script>
<style>
.dnd-basic {
  margin: 100px;
}
</style>
