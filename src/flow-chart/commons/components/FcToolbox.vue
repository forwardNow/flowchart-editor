<template>
  <div class="fc-toolbox">
    <div class="fc-toolbox-top">
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
          <input class="fc-ii-cont" type="radio" v-model="options.highlight.type" value="STEP_INDEX" @change="changeHighlightType"> STEP_INDEX
          <input class="fc-ii-cont" type="radio" v-model="options.highlight.type" value="BIZ_IDS" @change="changeHighlightType"> BIZ_IDS
        </div>

        <div class="fc-ii-item">
          <span class="fc-ii-label">highlight.value:</span>
          <input
            v-show="options.highlight.type === 'STEP_INDEX'"
            class="fc-ii-cont fc-ii-input" type="number"
            v-model.trim.number="options.highlight.value" @input="changeHighlightValue"
          />
          <div
            v-show="options.highlight.type === 'BIZ_IDS'"
            class="fc-ii-cont biz-ids-box"
            @wheel.stop
          >
            <input class="fc-ii-input" :value="JSON.stringify(options.highlight.value)" readonly
                   @click="handleClickBizIdsInput"/>

            <div class="dropdown-menu-biz-ids" v-show="bizIdsDropdownMenu.visible">
              <div
                v-for="(item, i) in bizIdsDropdownMenu.fdNodes" :key="i"
                class="biz-id-menu-item"
              >
                <input class="menu-item-checkbox" type="checkbox" />
                <div class="menu-item-icon"></div>
                <div class="menu-item-text">{{ item.text }}</div>
              </div>
            </div>

          </div>
        </div>
        <div class="fc-ii-item">
          <span class="fc-ii-label">node.endpoint.show:</span>
          <input class="fc-ii-cont" type="checkbox" v-model="options.node.endpoint.show" @change="changeVisibleOfEndpoints">
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

    </div>

    <div class="fc-toolbox-bottom" v-show="nodeInfo.visible || connectionInfo.visible">
      <div class="node-info fc-item-info" v-show="nodeInfo.visible">
        <div class="fc-ii-item">
          <span class="fc-ii-label">bizId:</span>
          <input class="fc-ii-cont fc-ii-input" v-model.trim="nodeInfo.bizId" @input="changeNodeBizId" />
        </div>
        <div class="fc-ii-item">
          <span class="fc-ii-label">stepIndex:</span>
          <input class="fc-ii-cont fc-ii-input" type="number" v-model.trim.number="nodeInfo.stepIndex" @input="changeNodeStepIndex" />
        </div>
        <div class="fc-ii-item">
          <span class="fc-ii-label">sort:</span>
          <input class="fc-ii-cont fc-ii-input" type="number" v-model.trim.number="nodeInfo.sort" @input="changeNodeSort" />
        </div>
        <div class="fc-ii-item">
          <span class="fc-ii-label">text:</span>
          <span class="fc-ii-cont">{{ nodeInfo.text }}</span>
        </div>
      </div>

      <div class="connection-info fc-item-info" v-show="connectionInfo.visible">
        <div class="fc-ii-item">
          <span class="fc-ii-label">label:</span>
          <input class="fc-ii-cont fc-ii-input" v-model.trim="connectionInfo.label" @input="changeConnectionLabel" />
        </div>
      </div>
    </div>
  </div>

</template>
<script>
import jQuery from 'jquery';
import lodashDebounce from 'lodash.debounce';
import interact from 'interactjs';
import IconSave from '@/flow-chart/commons/components/IconSave.vue';
import {
  DEFAULT_OPTIONS,
  EVENTS,
  STORE_KEY_OPTIONS,
} from '@/flow-chart/commons/configs/constants';
import { showAlert, showConfirm, showSuccessToast } from '@/flow-chart/commons/utils/popup';
import IconDelete from '@/flow-chart/commons/components/IconDelete.vue';
import IconResetSettings from '@/flow-chart/commons/components/IconResetSettings.vue';
import IconDownload from '@/flow-chart/commons/components/IconDownload.vue';
import { merge } from '@jsplumb/browser-ui';
import { STEP_INDEX_HIGHLIGHT } from '@/flow-chart/commons/configs/commons';

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

        id: '',
        bizId: '',
        type: '',
        text: '',
        position: { x: 0, y: 0 },
        stepIndex: 0,
        sort: 0,
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

      bizIdsDropdownMenu: {
        visible: true,
        fdNodes: [
          {
            id: 'bde910ca-a586-4486-b35a-fb552aef3c46', bizId: '06', type: 'Rectangle', content: '分发<div>（状态：分发）</div>', text: '分发（状态：分发）', position: { x: 763, y: 191 }, stepIndex: 4,
          }, {
            id: '6218f40b-4f1b-45f5-96c4-59b5a715f093', bizId: '07', type: 'Diamond', content: '是否分发', text: '是否分发', position: { x: 931, y: 170 }, stepIndex: 4,
          }, {
            id: 'd1080442-9fd0-41aa-8138-bc895bcd1f8d', bizId: '08', type: 'Rectangle', content: '生成回函文件<div>（状态：分发）</div>', text: '生成回函文件（状态：分发）', position: { x: 1139, y: 192 }, stepIndex: 4,
          }, {
            id: 'ab5645a8-1a74-438a-bd00-437d7e70cbc8', bizId: '09', type: 'Rectangle', content: '文档复核<div>（状态：文档复核）</div>', text: '文档复核（状态：文档复核）', position: { x: 1369, y: 192 }, stepIndex: 5,
          }, {
            id: '6b3f971d-185c-4ab3-b0fd-803685b2f6c6', bizId: '10', type: 'Diamond', content: '复核操作', text: '复核操作', position: { x: 1535, y: 171 }, stepIndex: 5,
          }, {
            id: 'cbdd3f6c-a869-43d1-a427-8d6f2c812828', bizId: '15', type: 'Rectangle', content: '用印<div>(状态：用印)</div>', text: '用印(状态：用印)', position: { x: 1675, y: 192 }, stepIndex: 6,
          }, {
            id: '7a606095-5831-40f7-a779-869697a705ad', bizId: '16', type: 'Rectangle', content: '回函<div>(状态：回函)</div>', text: '回函(状态：回函)', position: { x: 1833, y: 192 }, stepIndex: 7,
          }, {
            id: '10dfd099-7b61-4364-b6e6-a7868c0422a4', bizId: '17', type: 'Diamond', content: '回函操作', text: '回函操作', position: { x: 1992, y: 171 }, stepIndex: 7,
          }, {
            id: '87ada6b6-3792-4fcb-8264-943c2ab9b662', bizId: '18', type: 'Rectangle', content: '正常回函<div>(状态：已回函)</div>', text: '正常回函(状态：已回函)', position: { x: 2138, y: 192 }, stepIndex: 8,
          }, {
            id: 'a4ba4df4-92b1-4d93-813e-f0664dd865d2', bizId: '20', type: 'Circle', content: '结束', text: '结束', position: { x: 2313, y: 192 }, stepIndex: 8,
          }, {
            id: '37114de2-7706-4744-ab3a-37f039dc19a9', bizId: '11', type: 'Rectangle', content: '分发审核<div>(状态：分发)</div>', text: '分发审核(状态：分发)', position: { x: 1013, y: -158 }, stepIndex: 4,
          }, {
            id: '0c173988-a946-43ae-ad79-a6b169d58bab', bizId: '12', type: 'Diamond', content: '审核操作', text: '审核操作', position: { x: 1183, y: -179 }, stepIndex: 4,
          }, {
            id: '804d5a99-37bc-4ec6-9c85-81b1e8cf6383', bizId: '13', type: 'Rectangle', content: '分发复核<div>（状态：分发）</div>', text: '分发复核（状态：分发）', position: { x: 1338, y: -158 }, stepIndex: 4,
          }, {
            id: 'eb01071a-8d96-4a22-9ecb-c7f73269fd4c', bizId: '14', type: 'Diamond', content: '复核操作', text: '复核操作', position: { x: 1531, y: -179 }, stepIndex: 0,
          }, {
            id: '1a92866f-58b1-4ccc-8fd7-2c2489be22ad', bizId: '19', type: 'Rectangle', content: '异常回函<div>(状态：已回函)</div>', text: '异常回函(状态：已回函)', position: { x: 1972, y: 392 }, stepIndex: 8,
          }, {
            id: '25f3232b-ad55-4946-af41-758e42c35369', bizId: '02', type: 'Rectangle', content: '函证登记', text: '函证登记', position: { x: 763, y: -158 }, stepIndex: 0,
          }, {
            id: '09e8e42a-366c-4fde-a802-6dc0c71139fa', bizId: '03', type: 'Rectangle', content: '影像上传<div>（状态：影像扫描）</div>', text: '影像上传（状态：影像扫描）', position: { x: 763, y: -61 }, stepIndex: 1,
          }, {
            id: '89892986-f61e-46f6-bfae-a40f8495373b', bizId: '01', type: 'Circle', content: '开始', text: '开始', position: { x: 630, y: -158 }, stepIndex: 0,
          }, {
            id: 'fe956d8b-b545-46b7-9db3-3bf375e82b7f', bizId: '04', type: 'Rectangle', content: '验证<div>（状态：验证）</div>', text: '验证（状态：验证）', position: { x: 763, y: 26 }, stepIndex: 2,
          }, {
            id: 'e3aa8a27-f08a-463e-966a-667278c588f0', bizId: '05', type: 'Rectangle', content: '缴费<div>（状态：缴费）</div>', text: '缴费（状态：缴费）', position: { x: 763, y: 106 }, stepIndex: 3,
          }],
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
      const bizIdsBoxSelector = '.biz-ids-box';

      // click outside .biz-ids-box
      window.addEventListener('click', (event) => {
        const { target } = event;
        const $target = jQuery(target);

        if ($target.closest(bizIdsBoxSelector).length > 0) {
          return;
        }

        if ($target.is(bizIdsBoxSelector)) {
          return;
        }

        this.bizIdsDropdownMenu.visible = false;
      });

      const { fc } = this.flowChartRef;

      fc.on(EVENTS.SELECT_NODE, (fcNode) => {
        if (!fcNode) {
          return;
        }

        this.connectionInfo.visible = false;
        this.nodeInfo = { visible: true, ...fcNode };
      });

      fc.on(EVENTS.SELECT_CONNECTION, (fcConnection) => {
        if (!fcConnection) {
          return;
        }

        this.nodeInfo.visible = false;
        this.connectionInfo = { visible: true, ...fcConnection };
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

      fc.updateStageScaleAndOffset();
    },

    downloadConfigFile() {
      const { fc } = this.flowChartRef;
      const options = fc.getOptions();

      options.config = fc.getFlowChartConfig();

      const filename = 'flowchart.config.json';
      const content = JSON.stringify(options, null, 2);

      download(filename, content);
    },

    changeNodeStepIndex() {
      const { fc } = this.flowChartRef;
      const { stepIndex } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setStepIndexOfFcElement(selectedNode, stepIndex);
    },

    changeNodeSort() {
      const { fc } = this.flowChartRef;
      const { sort } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setSortOfFcElement(selectedNode, sort);
    },

    changeNodeBizId() {
      const { fc } = this.flowChartRef;
      const { bizId } = this.nodeInfo;

      const selectedNode = fc.getSelectedFcNode();

      fc.setBizIdOfFcElement(selectedNode, bizId);
    },

    changeConnectionLabel: lodashDebounce(function f() {
      const { fc } = this.flowChartRef;

      const selectedJsPlumbConnection = fc.getSelectedJsPlumbConnection();

      fc.setLabelOfJsPlumbConnection(selectedJsPlumbConnection, this.connectionInfo.label);
    }, 300),

    changeHighlightType() {
      const { fc } = this.flowChartRef;
      const { type } = this.options.highlight;

      fc.updateHighlightType(type);

      this.options = fc.getOptions();
    },

    changeHighlightValue() {
      const { fc } = this.flowChartRef;

      const {
        highlight: { type, value },
      } = this.options;

      if (type === STEP_INDEX_HIGHLIGHT) {
        fc.setCurrentStepIndex(Number(value));
      }
    },

    changeVisibleOfEndpoints() {
      const { fc } = this.flowChartRef;
      fc.setVisibleOfEndpoints(this.options.node.endpoint.show);
    },

    handleClickBizIdsInput() {
      const { fc } = this.flowChartRef;

      this.bizIdsDropdownMenu.visible = true;
      this.bizIdsDropdownMenu.fdNodes = fc.getFcNodeConfigs();
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
