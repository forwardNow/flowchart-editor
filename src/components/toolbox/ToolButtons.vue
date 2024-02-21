<template>
  <div class="fc-tool-buttons fc-toolbox-list">
    <div class="fc-toolbox-item">
      <span>文件</span>
      <div class="fc-menu">
        <div class="fc-menu-item" title="保存到 localStorage" @click="save">
          <div class="fc-menu-item-inner">
            <div class="fc-menu-item-icon fc-icon-save" />
            <div class="fc-menu-item-text">
              保存
            </div>
            <div class="fc-menu-item-hotkey">
              Ctrl + S
            </div>
          </div>
        </div>

        <div class="fc-menu-item-divider" />
        <label class="fc-menu-item" title="导入流程图配置文件">
          <span class="fc-menu-item-inner">
            <span class="fc-menu-item-icon fc-icon-import" />
            <span class="fc-menu-item-text">
              <input v-show="false" type="file" @change="importConfigFile($event)">
              导入
            </span>
          </span>
        </label>
        <div class="fc-menu-item" title="导出流程图配置文件" @click="downloadConfigFile">
          <div class="fc-menu-item-inner">
            <div class="fc-menu-item-icon fc-icon-download" />
            <div class="fc-menu-item-text">
              导出
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="fc-toolbox-item">
      <span>编辑</span>
      <div class="fc-menu">
        <div class="fc-menu-item" title="删除节点或连线" @click="remove">
          <div class="fc-menu-item-inner">
            <div class="fc-menu-item-icon fc-icon-delete" />
            <div class="fc-menu-item-text">
              删除
            </div>
            <div class="fc-menu-item-hotkey">
              Delete
            </div>
          </div>
        </div>

        <div class="fc-menu-item" title="重置画布缩放和偏移" @click="resetSetting">
          <div class="fc-menu-item-inner">
            <div class="fc-menu-item-icon fc-icon-reset" />
            <div class="fc-menu-item-text">
              重置
            </div>
          </div>
        </div>
      </div>
    </div>
    <template v-if="false">
      <div
        class="fc-toolbox-item"
        title="保存到 localStorage"
        @click="save"
      >
        保存
      </div>
      <div
        class="fc-toolbox-item"
        title="删除节点或连线"
        @click="remove"
      >
        删除
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
        title="重置画布缩放和偏移"
        @click="resetSetting"
      >
        重置
      </div>
    </template>
  </div>
</template>
<script>
import {
  EXPORTED_FILE_NAME,
  GET_DEFAULT_OPTIONS,
  STORE_KEY_OPTIONS,
} from '@/commons/configs/constants';
import { showAlert, showConfirm, showSuccessToast } from '@/commons/utils/popup';
import { downloadPlainFile } from '@/commons/utils/download';

export default {
  inject: ['toolboxRef', 'flowChartRef'],

  methods: {
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

      const defaultOptions = GET_DEFAULT_OPTIONS();

      fc.updateOptions({
        stage: {
          scale: {
            value: defaultOptions.stage.scale.value,
          },
          offset: defaultOptions.stage.offset,
        },
      });

      fc.updateStageScaleAndOffset();
    },

    downloadConfigFile() {
      const { fc } = this.flowChartRef;
      const options = fc.getOptions();

      options.config = fc.getFlowChartConfig();

      const content = JSON.stringify(options, null, 2);

      downloadPlainFile(EXPORTED_FILE_NAME, content);
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
  },
};
</script>
<style lang="scss">
.fc-tool-buttons {
  .fc-toolbox-item {
    position: relative;

    &:hover,
    &.active {
      .fc-menu {
        display: block;
      }
    }
  }

  .fc-menu {
    display: none;
    position: absolute;
    top: 100%;
    left: 0;

    padding-top: 4px;
    padding-bottom: 2px;

    width: 180px;

    background: #fff;
    border: #e9edf2;
    box-shadow: 0 4px 10px 0 rgba(0,0,0,.1);
    border-radius: 4px;
    color: #212930;
    font-size: 13px;
  }

  .fc-menu-item {
    display: block;
    padding: 0 4px;
    margin-bottom: 2px;
  }

  .fc-menu-item-inner {
    display: flex;
    align-items: center;
    justify-content: space-between;

    padding-right: 8px;
    height: 32px;
    line-height: 32px;
    border-radius: 4px;
    cursor: pointer;

    &:hover {
      background-color: #f3f5f9;
    }
  }

  .fc-menu-item-icon {
    width: 32px;
    height: 32px;
    background: no-repeat center center;
    background-size: 60% 60%;
  }
  .fc-menu-item-text {
    flex: 1;
  }
  .fc-menu-item-hotkey {
    padding-left: 32px;
    color: #a6b9cd;
    font-size: 12px;
  }

  .fc-menu-item-divider {
    height: 0;
    border-top: 1px solid #e9edf2;
    margin: 4px;
  }

  .fc-icon-save {
    background-image: url(@/commons/styles/images/icon_save.svg);
  }

  .fc-icon-download {
    background-image: url(@/commons/styles/images/icon_download.svg);
  }

  .fc-icon-import {
    background-image: url(@/commons/styles/images/icon_import.svg);
  }

  .fc-icon-delete {
    background-image: url(@/commons/styles/images/icon_delete.svg);
  }

  .fc-icon-reset {
    background-image: url(@/commons/styles/images/icon_reset_settings.svg);
  }
}
</style>
