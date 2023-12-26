<template>
  <div class="fc-toolbox">
    <div class="fc-toolbox-top">
      <div class="fc-toolbox-list">
        <div
          class="fc-toolbox-item"
          title="保存到 localStorage"
          @click="save"
        >
          保存
        </div>
        <label
          class="fc-toolbox-item"
          title="导入流程图配置文件"
        >
          <input
            v-show="false"
            type="file"
            @change="importConfigFile($event)"
          >
          导入
        </label>
        <div
          class="fc-toolbox-item"
          title="导出流程图配置文件"
          @click="downloadConfigFile"
        >
          导出
        </div>
        <div
          class="fc-toolbox-item"
          title="删除节点或连线"
          @click="remove"
        >
          删除
        </div>
        <div
          class="fc-toolbox-item"
          title="重置画布缩放和偏移"
          @click="resetSetting"
        >
          重置
        </div>
      </div>

      <div class="fc-toolbox-divider" />

      <div class="fc-toolbox-list">
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

      <div class="fc-toolbox-divider" />

      <div class="fc-toolbox-list fc-info-list">
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="highlight.type"
          >
            高亮类型:
          </span>
          <label title="'STEP_INDEX'">
            <input
              v-model="options.highlight.type"
              class="fc-ii-cont"
              type="radio"
              value="STEP_INDEX"
              @change="changeHighlightType"
            > 步骤
          </label>
          <label title="'BIZ_IDS'">
            <input
              v-model="options.highlight.type"
              class="fc-ii-cont"
              type="radio"
              value="BIZ_IDS"
              @change="changeHighlightType"
            > 单独指定
          </label>
        </div>

        <div class="fc-info-item">
          <template v-if="options.highlight.type === 'STEP_INDEX'">
            <span
              class="fc-ii-label"
              title="highlight.value"
            >
              当前步骤:
            </span>
            <input
              v-model.trim.number="options.highlight.value"
              class="fc-ii-cont fc-ii-input"
              type="number"
              title="-1, 全部高亮"
              @input="changeHighlightValue"
            >
          </template>

          <template v-if="options.highlight.type === 'BIZ_IDS'">
            <span
              class="fc-ii-label"
              title="highlight.value"
            >
              ID集合:
            </span>

            <div
              class="fc-ii-cont biz-ids-box"
              @wheel.stop
            >
              <input
                class="fc-ii-input"
                :value="JSON.stringify(options.highlight.value)"
                readonly
                title="ID 数组"
                @click="handleClickBizIdsInput"
              >

              <div
                v-show="bizIdsDropdownMenu.visible"
                class="dropdown-menu-biz-ids"
              >
                <div
                  v-for="(item, i) in bizIdsDropdownMenu.fcNodes"
                  :key="i"
                  class="biz-id-menu-item"
                  @click="handleClickBizIdMenuItem(item)"
                >
                  <input
                    class="menu-item-checkbox"
                    type="checkbox"
                    :checked="options.highlight.value.includes(item.bizId)"
                  >
                  <div
                    class="menu-item-icon"
                    :class="`fc-node fc-node-${item.type.toLowerCase()}`"
                  />
                  <div class="menu-item-text">
                    {{ item.text }}
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <div class="fc-toolbox-divider" />

      <div class="fc-toolbox-list fc-info-list">
        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="node.endpoint.show"
          >
            是否显示节点的端点:
          </span>
          <input
            v-model="options.node.endpoint.show"
            class="fc-ii-cont"
            type="checkbox"
            @change="changeVisibleOfEndpoints"
          >
        </div>

        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="stage.scale.value"
          >画布缩放:</span>
          <span
            class="fc-ii-cont"
            title="stage.scale.value"
          >{{ options.stage.scale.value }}</span>
        </div>

        <div class="fc-info-item">
          <span
            class="fc-ii-label"
            title="stage.offset"
          >画布偏移量:</span>
          <span
            class="fc-ii-cont fc-ii-position"
            title="stage.offset"
          >{{ options.stage.offset }}</span>
        </div>
      </div>
    </div>

    <div
      v-show="nodeInfo.visible || connectionInfo.visible"
      class="fc-toolbox-bottom"
    >
      <div
        v-show="nodeInfo.visible"
        class="node-info fc-info"
      >
        <div class="fc-info-item">
          <span class="fc-ii-label">bizId:</span>
          <input
            v-model.trim="nodeInfo.bizId"
            class="fc-ii-cont fc-ii-input"
            @input="changeNodeBizId"
          >
        </div>
        <div class="fc-info-item">
          <span class="fc-ii-label">stepIndex:</span>
          <input
            v-model.trim.number="nodeInfo.stepIndex"
            class="fc-ii-cont fc-ii-input"
            type="number"
            @input="changeNodeStepIndex"
          >
        </div>
        <div class="fc-info-item">
          <span class="fc-ii-label">sort:</span>
          <input
            v-model.trim.number="nodeInfo.sort"
            class="fc-ii-cont fc-ii-input"
            type="number"
            @input="changeNodeSort"
          >
        </div>
        <div class="fc-info-item">
          <span class="fc-ii-label">text:</span>
          <span class="fc-ii-cont">{{ nodeInfo.text }}</span>
        </div>
      </div>

      <div
        v-show="connectionInfo.visible"
        class="connection-info fc-info"
      >
        <div class="fc-info-item">
          <span class="fc-ii-label">label:</span>
          <input
            v-model.trim="connectionInfo.label"
            class="fc-ii-cont fc-ii-input"
            @input="changeConnectionLabel"
          >
        </div>
      </div>
    </div>
  </div>
</template>
<script>
/* eslint-disable @typescript-eslint/no-use-before-define */
import jQuery from 'jquery';
import lodashDebounce from 'lodash.debounce';
import interact from 'interactjs';
import {
  DEFAULT_OPTIONS,
  EVENTS, EXPORTED_FILE_NAME, FC_CSS_CLASS_NAMES,
  STORE_KEY_OPTIONS,
} from '@/commons/configs/constants';
import { showAlert, showConfirm, showSuccessToast } from '@/commons/utils/popup';
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

export default {
  name: 'FcToolbox',

  inject: ['flowChartRef'],

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
        visible: false,
        fcNodes: [],
      },
    };
  },

  mounted() {
    this.initDnd();
  },

  methods: {
    // invoke by FlowChart.vue
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

      showSuccessToast(`保存成功! 查看 localStorage.getItem("${STORE_KEY_OPTIONS}")`);
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

      const content = JSON.stringify(options, null, 2);

      download(EXPORTED_FILE_NAME, content);
    },

    importConfigFile(event) {
      const [file] = event.target.files;
      const reader = new FileReader();

      reader.onload = () => {
        const fileContent = reader.result;

        const config = JSON.parse(String(fileContent));

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
      const {
        highlight: { type, value },
      } = this.options;

      if (type === STEP_INDEX_HIGHLIGHT) {
        this.flowChartRef.fc.setCurrentStepIndex(Number(value));
      }
    },

    changeVisibleOfEndpoints() {
      this.flowChartRef.fc.setVisibleOfEndpoints(this.options.node.endpoint.show);
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
