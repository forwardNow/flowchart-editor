<template>
  <div class="fc-editor">
    <div class="fc-editor-toolbox">

      <div class="fc-node fc-node-circle">
        <div class="fc-node-inner">
          <div class="fc-node-text">起止符号</div>
        </div>
      </div>

      <div class="fc-node fc-node-rectangle">
        <div class="fc-node-inner">
          <div class="fc-node-text">任务内容（状态：已经完成）</div>
        </div>
      </div>

      <div class="fc-node fc-node-diamond">
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
/* eslint-disable object-curly-newline */
import interact from 'interactjs';

import {
  newInstance,
  ready,
  StraightConnector,
  BezierConnector,
  FlowchartConnector,
  AnchorLocations,
  BlankEndpoint, ArrowOverlay, EVENT_CONNECTION, DotEndpoint, DEFAULT_KEY_ENDPOINTS,
} from '@jsplumb/browser-ui';

export default {
  mounted() {
    ready(this.init);
  },

  methods: {
    init() {
      this.initJsPlumb();
      this.initDnd();
    },

    initJsPlumb() {
      const fcContainerElement = document.querySelector('.flow-chart');

      this.jsPlumbIns = newInstance({
        container: fcContainerElement,
        elementsDraggable: true,
      });

      window.jsPlumbIns = this.jsPlumbIns;

      this.jsPlumbIns.importDefaults({
        connector: {
          type: FlowchartConnector.type,
          options: {
            cornerRadius: 3,
          },
        },

        endpoint: {
          type: DotEndpoint.type,
          options: {
            radius: 4,
          },
        },

        endpointStyle: {
          fill: '#067bef',
        },

        paintStyle: { strokeWidth: 2, stroke: '#5c5c5c' },

        anchor: AnchorLocations.AutoDefault,

        connectionOverlays: [
          {
            type: ArrowOverlay.type,
            options: {
              location: 1,
              width: 10,
              length: 10,
            },
          },
        ],
      });
    },

    initDnd() {
      const toolbox = {
        el: document.querySelector('.fc-editor-toolbox'),
        x: 0,
        y: 0,
      };
      const stage = {
        el: document.querySelector('.flow-chart'),
        x: 0,
        y: 0,
      };

      ({ x: toolbox.x, y: toolbox.y } = toolbox.el.getBoundingClientRect());
      ({ x: stage.x, y: stage.y } = stage.el.getBoundingClientRect());

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

          cursorChecker() {
            /* do nothing */
          },

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

              stage.el.appendChild(mirror.el);
            },

            move(event) {
              const { dx, dy } = event;

              mirror.x += dx;
              mirror.y += dy;

              mirror.el.style.left = `${mirror.x}px`;
              mirror.el.style.top = `${mirror.y}px`;
            },

            end: () => {
              if (mirror.x < 0) {
                stage.el.removeChild(mirror.el);
                return;
              }

              this.jsPlumbIns.manage(mirror.el);

              this.jsPlumbIns.addEndpoints(mirror.el, [
                { source: true, target: true, anchor: 'Top', maxConnections: -1 },
                { source: true, target: true, anchor: 'Right', maxConnections: -1 },
                { source: true, target: true, anchor: 'Bottom', maxConnections: -1 },
                { source: true, target: true, anchor: 'Left', maxConnections: -1 },
              ]);
            },
          },
        });
    },

  },
};
</script>
