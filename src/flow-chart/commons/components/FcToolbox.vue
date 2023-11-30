<template>
  <div class="fc-toolbox">
    <div class="feature-list">
      <div class="feature-item" title="保存" @click="save">
        <IconSave />
      </div>
    </div>

    <div class="tool-divider"></div>

    <div class="shape-list">

      <div class="shape-item" title="开始/结束">
        <div class="fc-node fc-node-circle">
          <div class="fc-node-inner">
            <div class="fc-node-text">开始/结束</div>
          </div>
        </div>
      </div>

      <div class="shape-item" title="流程">
        <div class="fc-node fc-node-rectangle">
          <div class="fc-node-inner">
            <div class="fc-node-text">流程</div>
          </div>
        </div>
      </div>

      <div class="shape-item" title="判定">
        <div class="fc-node fc-node-diamond">
          <div class="fc-node-inner">
            <span class="fc-node-text">判定</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
<script>
import interact from 'interactjs';
import IconSave from '@/flow-chart/commons/components/IconSave.vue';
import { STORE_KEY_CONFIG } from '@/flow-chart/commons/configs/constants';

export default {
  name: 'FcToolbox',
  components: { IconSave },

  inject: ['flowChartRef'],

  mounted() {
    this.init();
  },

  methods: {
    init() {
      this.initDnd();
    },

    initDnd() {
      const toolbox = {
        el: this.$el,
        x: 0,
        y: 0,
        height: 0,
      };

      ({
        x: toolbox.x,
        y: toolbox.y,
        height: toolbox.height,
      } = toolbox.el.getBoundingClientRect());

      const mirror = {
        el: null,
        x: 0,
        y: 0,

        setAbsolute() {
          this.el.style.position = 'absolute';
        },
        updatePosition() {
          this.el.style.left = `${this.x}px`;
          this.el.style.top = `${this.y}px`;
        },
      };

      const onStart = (event) => {
        const target = event.currentTarget;

        mirror.el = target.cloneNode(true);
        mirror.x = target.offsetLeft;
        mirror.y = target.offsetTop;

        mirror.setAbsolute();

        mirror.updatePosition();

        toolbox.el.appendChild(mirror.el);
      };

      const onMove = (event) => {
        const {
          dx,
          dy,
        } = event;

        mirror.x += dx;
        mirror.y += dy;

        mirror.updatePosition();
      };

      const onEnd = () => {
        if (mirror.y < toolbox.height) {
          toolbox.el.removeChild(mirror.el);
          return;
        }

        mirror.x += toolbox.x;
        mirror.y += toolbox.y;

        mirror.updatePosition();

        this.flowChartRef.fc.appendElement(mirror.el);
      };

      interact('.fc-toolbox .fc-node')
        .draggable({
          autoScroll: true,
          cursorChecker() { /* do nothing */
          },
          listeners: {
            start: onStart,
            move: onMove,
            end: onEnd,
          },
        });
    },

    save() {
      const config = this.flowChartRef.fc.getConfig();

      console.log(config);

      localStorage.setItem(STORE_KEY_CONFIG, JSON.stringify(config));
    },

  },
};
</script>
