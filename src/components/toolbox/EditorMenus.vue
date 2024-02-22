<template>
  <!-- eslint-disable vue/singleline-html-element-content-newline  -->
  <div class="fc-tool-buttons fc-toolbox-list">
    <FcDropdown class="fc-toolbox-item">
      <span>文件</span>
      <template #dropdown>
        <FcDropdownMenu>
          <FcDropdownMenuItem
            icon="fc-icon-save" label="保存" hotkey="Ctrl + S"
            title="保存到 localStorage" @click="save"
          />

          <FcDropdownMenuItem divided />

          <FcDropdownMenuItem
            icon="fc-icon-import" label="导入流程图配置文件"
            title="导入流程图配置文件" @click="$refs.fileInput.click()"
          >
            <template #label>
              <input v-show="false" ref="fileInput" type="file" @change="importConfigFile($event)">
              导入
            </template>
          </FcDropdownMenuItem>

          <FcDropdownMenuItem
            icon="fc-icon-download" label="导出"
            title="导出流程图配置文件" @click="downloadConfigFile"
          />

          <FcDropdownMenuItem divided />

          <FcDropdownMenuItem
            icon="fc-icon-terminal" label="示例：请假流程"
            @click="loadSample(samples.ASK_FOR_LEAVE)"
          />
        </FcDropdownMenu>
      </template>
    </FcDropdown>

    <FcDropdown class="fc-toolbox-item">
      <span>编辑</span>
      <template #dropdown>
        <FcDropdownMenu>
          <FcDropdownMenuItem
            icon="fc-icon-delete" label="删除" hotkey="Delete"
            title="删除节点或连线" @click="remove"
          />
          <FcDropdownMenuItem
            icon="fc-icon-reset" label="重置"
            title="重置画布缩放和偏移" @click="resetSetting"
          />
        </FcDropdownMenu>
      </template>
    </FcDropdown>
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
import FcDropdownMenu from '@/components/toolbox/components/FcDropdownMenu.vue';
import FcDropdownMenuItem from '@/components/toolbox/components/FcDropdownMenuItem.vue';
import FcDropdown from '@/components/toolbox/components/FcDropdown.vue';

export default {
  components: {
    FcDropdown,
    FcDropdownMenu,
    FcDropdownMenuItem,
  },

  inject: ['toolboxRef', 'flowChartRef'],

  data() {
    return {
      samples: {
        ASK_FOR_LEAVE: 'ASK_FOR_LEAVE',
      },
    };
  },

  mounted() {
    this.bindHotkey();
  },

  beforeDestroy() {
    this.unbindHotkey();
  },

  methods: {
    bindHotkey() {
      this.listener = (e) => {
        if (e.key.toLowerCase() === 's' && e.ctrlKey) {
          e.preventDefault();
          this.save();
        } else if (e.key.toLowerCase() === 'delete') {
          this.remove();
        }
      };
      document.addEventListener('keydown', this.listener);
    },

    unbindHotkey() {
      document.removeEventListener('keydown', this.listener);
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

    async resetSetting() {
      const isConfirm = await showConfirm('确认重置画布缩放和偏移量？')
        .then(() => true).catch(() => false);

      if (!isConfirm) {
        return;
      }

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

    async loadSample(sample) {
      let fileContent;

      if (sample === this.samples.ASK_FOR_LEAVE) {
        fileContent = await import('@/commons/samples/flowchart.config.ask-for-leave.json');
      }

      if (!fileContent) {
        console.error(`unknown sample: ${sample}`);
        return;
      }

      this.flowChartRef.reset(fileContent);
    },
  },
};
</script>
<style lang="scss">
.fc-tool-buttons {

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

  .fc-icon-terminal {
    background-image: url(@/commons/styles/images/icon_terminal.svg);
  }
}
</style>
