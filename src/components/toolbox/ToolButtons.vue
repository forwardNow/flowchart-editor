<template>
  <div class="fc-tool-buttons fc-toolbox-list">
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
</template>
<script>
import { EXPORTED_FILE_NAME, STORE_KEY_OPTIONS } from '@/commons/configs/constants';
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
      const options = fc.getOptions();

      options.stage.scale.value = 1;
      options.stage.offset = { x: 0, y: 0 };

      this.toolboxRef.options = options;

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
