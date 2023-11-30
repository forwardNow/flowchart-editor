<template>
  <div class="fc-toolbox">
    <div class="feature-list">
      <div class="feature-item">
        <IconSave title="保存" />
      </div>
    </div>
    <div class="shape-list">

      <div class="shape-item" title="">
        <div class="fc-node fc-node-circle">
          <div class="fc-node-inner">
            <div class="fc-node-text"></div>
          </div>
        </div>
      </div>

      <div class="shape-item" title="">
        <div class="fc-node fc-node-rectangle">
          <div class="fc-node-inner">
            <div class="fc-node-text"></div>
          </div>
        </div>
      </div>

      <div class="shape-item" title="">
        <div class="fc-node fc-node-diamond">
          <div class="fc-node-inner">
            <span class="fc-node-text"></span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
<script>
import interact from 'interactjs';
import IconSave from '@/flow-chart/components/IconSave.vue';

export default {
  name: 'FcToolbox',
  components: { IconSave },

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

      interact('.fc-toolbox .fc-node')
        .draggable({
          autoScroll: true,

          cursorChecker() {
            /* do nothing */
          },

          listeners: {
            start: (event) => {
              const { currentTarget } = event;

              const mirrorNode = currentTarget.cloneNode(true);

              const { offsetLeft, offsetTop } = currentTarget;

              mirror.x = offsetLeft;
              mirror.y = offsetTop;

              mirror.el = mirrorNode;

              mirror.el.style.left = `${mirror.x}px`;
              mirror.el.style.top = `${mirror.y}px`;

              mirror.el.style.position = 'absolute';

              toolbox.el.appendChild(mirror.el);
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
                toolbox.el.removeChild(mirror.el);
                return;
              }

              stageEl.appendChild(mirror.el);

              mirror.x += toolbox.x;
              mirror.y += toolbox.y;

              mirror.el.style.left = `${mirror.x}px`;
              mirror.el.style.top = `${mirror.y}px`;

              this.$emit('add-node', mirror.el);
            },
          },
        });
    },
  },
};
</script>
