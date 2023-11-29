<template>
  <div class="fc-toolbox">
    <div class="fc-toolbox-head">
      工具箱
    </div>
    <div class="fc-toolbox-body">
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
  </div>
</template>
<script>
import interact from 'interactjs';

export default {
  name: 'FcToolbox',

  methods: {
    init(stageEl) {
      const toolbox = {
        el: this.$el,
        x: 0,
        y: 0,
      };

      ({ x: toolbox.x, y: toolbox.y } = toolbox.el.getBoundingClientRect());

      const mirror = {
        el: null,
        x: 0,
        y: 0,
      };

      interact('.fc-toolbox .fc-toolbox-head')
        .draggable({
          listeners: {
            move: (event) => {
              const { dx, dy } = event;

              toolbox.x += dx;
              toolbox.y += dy;

              toolbox.el.style.left = `${toolbox.x}px`;
              toolbox.el.style.top = `${toolbox.y}px`;
            },
          },
        });

      interact('.fc-toolbox .fc-node')
        .draggable({
          autoScroll: true,

          cursorChecker() {
            /* do nothing */
          },

          listeners: {
            start: (event) => {
              const { currentTarget } = event;

              const { offsetLeft, offsetTop } = currentTarget;

              const mirrorNode = currentTarget.cloneNode(true);

              mirror.x = offsetLeft + toolbox.x;
              mirror.y = offsetTop + toolbox.y;

              mirror.el = mirrorNode;

              mirror.el.style.left = `${mirror.x}px`;
              mirror.el.style.top = `${mirror.y}px`;

              stageEl.appendChild(mirror.el);
            },

            move: (event) => {
              const { dx, dy } = event;

              mirror.x += dx;
              mirror.y += dy;

              mirror.el.style.left = `${mirror.x}px`;
              mirror.el.style.top = `${mirror.y}px`;
            },

            end: () => {
              if (mirror.x < 0) {
                stageEl.removeChild(mirror.el);
                return;
              }

              this.$emit('add-node', mirror.el);
            },
          },
        });
    },
  },
};
</script>
