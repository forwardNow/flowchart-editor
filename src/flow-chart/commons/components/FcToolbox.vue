<template>
  <div class="fc-toolbox">
    <div class="feature-list">
      <div class="feature-item tl-item" title="保存" @click="save">
        <IconSave />
      </div>
      <div class="feature-item tl-item" title="下载" @click="downloadConfigFile">
        <IconDownload />
      </div>
      <div class="feature-item tl-item" title="删除" @click="remove">
        <IconDelete />
      </div>
      <div class="feature-item tl-item" title="重置" @click="resetSetting">
        <IconResetSettings />
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

    <div class="fc-options fc-item-info">
      <div class="fc-ii-item">
        <span class="fc-ii-label">highlight.type:</span>
        <input class="fc-ii-cont" type="checkbox"
               v-model="options.highlight.type"
               @change="changeHighlightType()">
      </div>

      <div class="fc-ii-item">
        <span class="fc-ii-label">highlight.value:</span>
        <input class="fc-ii-cont fc-ii-input"
               type="number"
               v-model.trim.number="options.highlight.value"
               @input="changeHighlightValue" />
      </div>
      <div class="fc-ii-item">
        <span class="fc-ii-label">node.endpoint.show:</span>
        <input class="fc-ii-cont" type="checkbox"
               v-model="options.node.endpoint.show"
               @change="changeVisibleOfEndpoints(options.node.endpoint.show)">
      </div>
      <div class="fc-ii-item">
        <span class="fc-ii-label">stage.scale.value:</span>
        <span class="fc-ii-cont">{{ options.stage.scale.value }}</span>
      </div>
      <div class="fc-ii-item">
        <span class="fc-ii-label">stage.offset:</span>
        <span class="fc-ii-cont fc-ii-position">{{ options.stage.offset }}</span>
      </div>
    </div>

    <template >
      <div class="tool-divider" v-if="nodeInfo.visible || connectionInfo.visible"/>

      <div class="node-info fc-item-info" v-show="nodeInfo.visible">
        <div class="fc-ii-item">
          <span class="fc-ii-label">stepIndex:</span>
          <input class="fc-ii-cont fc-ii-input"
                 type="number"
                 v-model.trim.number="nodeInfo.stepIndex"
                 @input="changeNodeStepIndex(nodeInfo.stepIndex)" />
        </div>
        <div class="fc-ii-item">
          <span class="fc-ii-label">text:</span>
          <span class="fc-ii-cont">{{ nodeInfo.text }}</span>
        </div>
      </div>
    </template>

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
import lodashDebounce from 'lodash.debounce';
import interact from 'interactjs';
import IconSave from '@/flow-chart/commons/components/IconSave.vue';
import {
  DEFAULT_OPTIONS,
  EVENTS,
  STEP_INDEX_HIGHLIGHT,
  STORE_KEY_OPTIONS,
} from '@/flow-chart/commons/configs/constants';
import { showAlert, showConfirm, showSuccessToast } from '@/flow-chart/commons/utils/popup';
import IconDelete from '@/flow-chart/commons/components/IconDelete.vue';
import IconResetSettings from '@/flow-chart/commons/components/IconResetSettings.vue';
import IconDownload from '@/flow-chart/commons/components/IconDownload.vue';
import { merge } from '@jsplumb/browser-ui';

export default {
  name: 'FcToolbox',
  components: {
    IconDownload, IconResetSettings, IconDelete, IconSave,
  },

  inject: ['flowChartRef'],

  mounted() {
    this.init();
  },

  data() {
    return {
      /** @type {IFcOptions}  */
      options: merge({}, DEFAULT_OPTIONS),

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
      this.onFcReady(() => {
        this.initDnd();
        this.bindListeners();
        this.options = this.flowChartRef.getOptions();
      });
    },

    onFcReady(callback = () => ({})) {
      this.flowChartRef.$on('ready', () => {
        callback();
      });
    },

    bindListeners() {
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

      fc.on(EVENTS.WHEEL, (scale) => {
        this.options.stage.scale.value = scale;
      });

      fc.on(EVENTS.STAGE_MOVE, (offset) => {
        this.options.stage.offset = offset;
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

        const scale = this.options.stage.scale.value;

        const { x: offsetX, y: offsetY } = this.flowChartRef.fc.getStageElement().getBoundingClientRect();

        mirror.x -= offsetX;
        mirror.y -= offsetY;

        mirror.x /= scale;
        mirror.y /= scale;

        mirror.updatePosition();

        this.flowChartRef.fc.createFcNodeWithElement(mirror.el);
      };

      interact('.fc-toolbox .fc-node')
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

    save() {
      const { fc } = this.flowChartRef;
      const options = fc.getOptions();

      options.config = fc.getFlowChartConfig();

      console.log('options', options);

      localStorage.setItem(STORE_KEY_OPTIONS, JSON.stringify(options));

      showSuccessToast('保存成功!');
    },

    remove() {
      const { fc } = this.flowChartRef;

      const selectedNode = fc.getSelectedFcNode();

      if (selectedNode) {
        showConfirm('确认删除选中的节点？')
          .then(() => {
            fc.removeFcNode(selectedNode);
          })
          .catch((e) => console.log(e));
        return;
      }

      const selectedConnection = fc.getSelectedJsPlumbConnection();

      if (!selectedConnection) {
        showAlert('请选择要删除的节点或连线！');
        return;
      }

      showConfirm('确认删除选中的连线？')
        .then(() => {
          fc.removeFcConnection(selectedConnection);
        })
        .catch((e) => console.log(e));
    },

    resetSetting() {
      const { fc } = this.flowChartRef;

      const options = fc.getOptions();

      options.stage.scale.value = 1;
      options.stage.offset = { x: 0, y: 0 };

      this.options = options;

      fc.updateStageTransform();
    },

    downloadConfigFile() {
      const { fc } = this.flowChartRef;
      const options = fc.getOptions();

      options.config = fc.getFlowChartConfig();

      const filename = 'flowchart.config.json';
      const content = JSON.stringify(options, null, 2);

      download(filename, content);
    },

    changeNodeStepIndex(stepIndex) {
      const { fc } = this.flowChartRef;

      const selectedNode = fc.getSelectedFcNode();

      fc.changeFcNodeStepIndex(selectedNode, stepIndex);
    },

    changeConnectionLabel: lodashDebounce(function f(label) {
      const { fc } = this.flowChartRef;

      const selectedJsPlumbConnection = fc.getSelectedJsPlumbConnection();

      fc.setLabelOfJsPlumbConnection(selectedJsPlumbConnection, label);
    }, 300),

    changeHighlightType() {
      const { fc } = this.flowChartRef;

      const {
        highlight: { type },
      } = this.options;

      if (type === STEP_INDEX_HIGHLIGHT) {
        fc.setHighlightType(type);
      }
    },

    changeHighlightValue() {
      const { fc } = this.flowChartRef;

      const {
        highlight: { type, value },
      } = this.options;

      if (type === STEP_INDEX_HIGHLIGHT) {
        fc.setValueOfStepIndexHighlight(Number(value));
      }
    },

    changeVisibleOfEndpoints(visibleOfEndpoints) {
      const { fc } = this.flowChartRef;

      fc.setVisibleOfEndpoints(visibleOfEndpoints);
    },
  },
};

function download(filename, text) {
  const element = document.createElement('a');
  element.setAttribute('href', `data:text/plain;charset=utf-8,${encodeURIComponent(text)}`);
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}
</script>
