<template>
  <div class="fc-toolbox">
    <div class="feature-list">
      <div class="feature-item tl-item" title="保存" @click="save">
        <IconSave />
      </div>
      <div class="feature-item tl-item" title="删除" @click="remove">
        <IconDelete />
      </div>
    </div>

    <div class="tool-divider" />

    <div class="shape-list">

      <div class="shape-item tl-item" title="开始/结束">
        <div class="fc-node fc-node-circle">
          <div class="fc-node-inner">
            <div class="fc-node-text">开始/结束</div>
          </div>
        </div>
      </div>

      <div class="shape-item tl-item" title="流程">
        <div class="fc-node fc-node-rectangle">
          <div class="fc-node-inner">
            <div class="fc-node-text">流程</div>
          </div>
        </div>
      </div>

      <div class="shape-item tl-item" title="判定">
        <div class="fc-node fc-node-diamond">
          <div class="fc-node-inner">
            <span class="fc-node-text">判定</span>
          </div>
        </div>
      </div>

    </div>

    <div class="tool-divider" />

    <div class="fc-options fc-item-info" v-show="options.visible">
      <div class="fc-ii-item">
        <span class="fc-ii-label">currentStepIndex:</span>
        <input class="fc-ii-cont fc-ii-input"
               type="number"
               v-model.trim.number="options.currentStepIndex"
               @input="changeCurrentStepIndex(options.currentStepIndex)" />
      </div>
    </div>

    <div class="tool-divider" />

    <div class="node-info fc-item-info" v-show="nodeInfo.visible">
      <div class="fc-ii-item">
        <span class="fc-ii-label">stepIndex:</span>
        <input class="fc-ii-cont fc-ii-input"
               type="number"
               v-model.trim.number="nodeInfo.stepIndex"
               @input="changeNodeStepIndex(nodeInfo.stepIndex)" />
      </div>
      <div class="fc-ii-item">
        <span class="fc-ii-label">text:</span><span class="fc-ii-cont">{{ nodeInfo.text }}</span>
      </div>
    </div>

    <div class="connection-info fc-item-info" v-show="connectionInfo.visible">
      <div class="fc-ii-item">
        <span class="fc-ii-label">label:</span>
        <input class="fc-ii-cont fc-ii-input"
               v-model.trim="connectionInfo.label"
               @input="changeConnectionLabel(connectionInfo.label)" />
      </div>
    </div>

  </div>
</template>
<script>
import interact from 'interactjs';
import IconSave from '@/flow-chart/commons/components/IconSave.vue';
import { STORE_KEY_CONFIG } from '@/flow-chart/commons/configs/constants';
import { showAlert, showSuccessToast } from '@/flow-chart/commons/utils/popup';
import IconDelete from '@/flow-chart/commons/components/IconDelete.vue';
import { EVENTS } from '@/flow-chart/FlowChart';

export default {
  name: 'FcToolbox',
  components: { IconDelete, IconSave },

  inject: ['flowChartRef'],

  mounted() {
    this.init();
  },

  data() {
    return {
      options: {
        visible: true,
        currentStepIndex: -1,
      },

      nodeInfo: {
        visible: false,

        stepIndex: 0,
        id: '',
        type: '',
        text: '',
        position: { x: 0, y: 0 },
      },

      connectionInfo: {
        visible: false,

        type: '',
        sourceId: '',
        sourceAnchor: '',
        targetId: '',
        targetAnchor: '',
        label: '',
      },
    };
  },

  methods: {
    init() {
      this.initDnd();
      this.bindListeners();

      this.options.currentStepIndex = this.flowChartRef.options.currentStepIndex;
    },

    bindListeners() {
      this.flowChartRef.$on('ready', () => {
        const { fc } = this.flowChartRef;

        fc.on(EVENTS.SELECT_NODE, (fcNode) => {
          if (!fcNode) {
            return;
          }

          this.connectionInfo.visible = false;
          this.nodeInfo = {
            ...fcNode,
            visible: true,
          };
        });

        fc.on(EVENTS.SELECT_CONNECTION, (fcConnection) => {
          if (!fcConnection) {
            return;
          }

          this.nodeInfo.visible = false;
          this.connectionInfo = {
            ...fcConnection,
            visible: true,
          };
        });

        fc.on(EVENTS.UNSELECT_ALL, () => {
          this.connectionInfo.visible = false;
          this.nodeInfo.visible = false;
        });
      });
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

        this.flowChartRef.fc.createFcNodeWithElement(mirror.el);
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
      const config = this.flowChartRef.fc.getFlowChartConfig();

      console.log(config);

      localStorage.setItem(STORE_KEY_CONFIG, JSON.stringify(config));

      showSuccessToast('保存成功!');
    },

    remove() {
      const { fc } = this.flowChartRef;

      const selectedNode = fc.getSelectedFcNode();

      if (selectedNode) {
        fc.removeFcNode(selectedNode);
        return;
      }

      const selectedConnection = fc.getSelectedJsPlumbConnection();

      if (!selectedConnection) {
        showAlert('请选择要删除的节点或连线！');
        return;
      }

      fc.removeFcConnection(selectedConnection);
    },

    changeNodeStepIndex(stepIndex) {
      const { fc } = this.flowChartRef;

      const selectedNode = fc.getSelectedFcNode();

      fc.changeFcNodeStepIndex(selectedNode, stepIndex);
    },

    changeConnectionLabel(label) {
      const { fc } = this.flowChartRef;

      const selectedJsPlumbConnection = fc.getSelectedJsPlumbConnection();

      fc.setLabelOfJsPlumbConnection(selectedJsPlumbConnection, label);
    },

    changeCurrentStepIndex(currentStepIndex) {
      const { fc } = this.flowChartRef;

      fc.setCurrentStepIndex(currentStepIndex);
    },
  },
};
</script>
