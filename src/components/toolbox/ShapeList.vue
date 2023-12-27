<template>
  <div class="fc-shape-list fc-toolbox-list">
    <div
      class="fc-toolbox-item"
      title="开始/结束"
    >
      <div class="fc-node fc-node-circle" />
    </div>

    <div
      class="fc-toolbox-item"
      title="流程"
    >
      <div class="fc-node fc-node-rectangle" />
    </div>

    <div
      class="fc-toolbox-item"
      title="判定"
    >
      <div class="fc-node fc-node-diamond" />
    </div>
  </div>
</template>
<script>
import {
  CIRCLE_NODE_TYPE, DEFAULT_CIRCLE_NODE_CONTENT, DEFAULT_DIAMOND_NODE_CONTENT,
  DEFAULT_RECTANGLE_NODE_CONTENT, DIAMOND_NODE_TYPE,
  RECTANGLE_NODE_TYPE,
} from '@/commons/configs/commons';
import { FC_CSS_CLASS_NAMES } from '@/commons/configs/constants';
import interact from 'interactjs';

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  mounted() {
    this.initDnd();
  },

  methods: {
    initDnd() {
      const toolbox = {
        el: this.toolboxRef.$el,
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
        getFcNode() {
          const { classList } = this.el;

          let type = RECTANGLE_NODE_TYPE;
          let content = DEFAULT_RECTANGLE_NODE_CONTENT;
          const position = { x: this.x, y: this.y };

          if (classList.contains(FC_CSS_CLASS_NAMES[CIRCLE_NODE_TYPE])) {
            type = CIRCLE_NODE_TYPE;
            content = DEFAULT_CIRCLE_NODE_CONTENT;
          }

          if (classList.contains(FC_CSS_CLASS_NAMES[DIAMOND_NODE_TYPE])) {
            type = DIAMOND_NODE_TYPE;
            content = DEFAULT_DIAMOND_NODE_CONTENT;
          }

          return { type, content, position };
        },
        destroy() {
          toolbox.el.removeChild(this.el);
          this.el = null;
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
          mirror.destroy();
          return;
        }

        const { fc } = this.flowChartRef;
        const scale = fc.getOptions().stage.scale.value;

        const { x: offsetX, y: offsetY } = fc.getStageElement().getBoundingClientRect();

        mirror.x -= offsetX;
        mirror.y -= offsetY;

        mirror.x /= scale;
        mirror.y /= scale;

        fc.createFcNode(mirror.getFcNode());

        mirror.destroy();
      };

      interact('.fc-shape-list .fc-node')
        .draggable({
          autoScroll: true,
          cursorChecker: () => 'default',
          listeners: {
            start: onStart,
            move: onMove,
            end: onEnd,
          },
        });
    },
  },
};
</script>
