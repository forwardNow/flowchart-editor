<template>
  <div class="fc-toolbox">
    <div class="fc-toolbox-top">
      <div class="feature-list">
        <div class="feature-item tl-item" title="保存" @click="save">
          <IconSave />
        </div>
        <label class="feature-item tl-item" title="导入" >
          <IconImport />
          <input type="file" v-show="false" @change="importConfigFile($event)" />
        </label>
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
          <div class="fc-node fc-node-circle" />
        </div>

        <div class="shape-item tl-item" title="流程">
          <div class="fc-node fc-node-rectangle" />
        </div>

        <div class="shape-item tl-item" title="判定">
          <div class="fc-node fc-node-diamond" />
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
            v-if="options.highlight.type === 'STEP_INDEX'"
            class="fc-ii-cont fc-ii-input" type="number"
            v-model.trim.number="options.highlight.value" @input="changeHighlightValue"
          />
          <div
            v-if="options.highlight.type === 'BIZ_IDS'"
            class="fc-ii-cont biz-ids-box"
            @wheel.stop
          >
            <input class="fc-ii-input" :value="JSON.stringify(options.highlight.value)" readonly
                   @click="handleClickBizIdsInput"
            />

            <div class="dropdown-menu-biz-ids" v-show="bizIdsDropdownMenu.visible">
              <div
                v-for="(item, i) in bizIdsDropdownMenu.fcNodes" :key="i"
                class="biz-id-menu-item"
                @click="handleClickBizIdMenuItem(item)"
              >
                <input class="menu-item-checkbox" type="checkbox" :checked="options.highlight.value.includes(item.bizId)"/>
                <div class="menu-item-icon" :class="`fc-node fc-node-${item.type.toLowerCase()}`" />
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
import IconSave from '@/commons/components/IconSave.vue';
import {
  DEFAULT_OPTIONS,
  EVENTS, FC_CSS_CLASS_NAMES,
  STORE_KEY_OPTIONS,
} from '@/commons/configs/constants';
import { showAlert, showConfirm, showSuccessToast } from '@/commons/utils/popup';
import IconDelete from '@/commons/components/IconDelete.vue';
import IconResetSettings from '@/commons/components/IconResetSettings.vue';
import IconDownload from '@/commons/components/IconDownload.vue';
import { merge } from '@jsplumb/browser-ui';
import {
  CIRCLE_NODE_TYPE,
  DEFAULT_CIRCLE_NODE_CONTENT,
  DEFAULT_DIAMOND_NODE_CONTENT,
  DEFAULT_RECTANGLE_NODE_CONTENT,
  DIAMOND_NODE_TYPE,
  RECTANGLE_NODE_TYPE,
  STEP_INDEX_HIGHLIGHT,
} from '@/commons/configs/commons';
import IconImport from '@/commons/components/IconImport.vue';

export default {
  name: 'FcToolbox',
  components: {
    IconImport,
    IconDownload,
    IconResetSettings,
    IconDelete,
    IconSave,
  },

  inject: ['flowChartRef'],

  mounted() {
    this.initDnd();
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
        fcNodes: [],
      },
    };
  },

  methods: {
    init(options) {
      this.options = options;
      this.bindListeners();
    },

    bindListeners() {
      const bizIdsBoxSelector = '.biz-ids-box';

      // click outside .biz-ids-box
      const CLICK_EVENT = 'click.toolbox';
      jQuery(window)
        .off(CLICK_EVENT)
        .on(CLICK_EVENT, (event) => {
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

        const scale = this.options.stage.scale.value;

        const { x: offsetX, y: offsetY } = this.flowChartRef.fc.getStageElement().getBoundingClientRect();

        mirror.x -= offsetX;
        mirror.y -= offsetY;

        mirror.x /= scale;
        mirror.y /= scale;

        this.flowChartRef.fc.createFcNode(mirror.getFcNode());

        mirror.destroy();
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

    importConfigFile(event) {
      const [file] = event.target.files;
      const reader = new FileReader();

      reader.onload = () => {
        const fileContent = reader.result;

        const config = JSON.parse(fileContent);

        this.flowChartRef.reset(config);
      };

      if (file) {
        reader.readAsText(file);
      }
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
      this.bizIdsDropdownMenu.fcNodes = fc.getFcNodeConfigs();
    },

    handleClickBizIdMenuItem(fcNode) {
      const { fc } = this.flowChartRef;
      const bizIds = this.options.highlight.value || [];

      const index = bizIds.findIndex((item) => item === fcNode.bizId);

      if (index === -1) {
        bizIds.push(fcNode.bizId);
        bizIds.sort();
      } else {
        bizIds.splice(index, 1);
      }

      fc.getOptions().highlight.value = bizIds;

      fc.updateHighlights();
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
