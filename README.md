# flowchart-editor

## 1. 介绍

流程图的编辑及呈现

## 2. 环境

vue 2.x

node.js 16.x

## 3. 使用

### 3.1. 安装

```shell
# switch to project root directory
cd flowchart-editor

npm i
```

### 3.2. 编译打包

命令：

```shell
# switch to project root directory
cd flowchart-editor

npm run build
```

编译后的目录：

```text
flowchart-editor/
  dist/
    demo/
      index.html        # 此文件可以直接在浏览器中打开
    FlowChart.common.js
    FlowChart.css
    FlowChart.umd.js
```


### 3.3. 在浏览器中使用

参考: [public/demo/index.html](./public/demo/index.html) 

示例：

```html
<script src="//unpkg.com/vue@2"></script>
<script src="./dist/FlowChart.umd.js"></script>
<link rel="stylesheet" href="./dist/FlowChart.css">

<style>
  body { padding: 0;margin: 0; }
  #app { width: 100vw;height: 100vh; }
</style>

<div id="app">
  <flow-chart 
    ref="flowchart"
    :options="options" 
    toolbox 
  ></flow-chart>
</div>
<script>
  new Vue({
    components: { FlowChart },

    mounted() {
      this.init();
    },

    data() {
      return {
        options: null,
      }
    },

    methods: {
      init() {
        // options 不为 null 时，才会触发流程图的渲染
        this.options = this.$refs.flowchart.getOptionsInLocalStorage();
      }
    }
  }).$mount('#app');
</script>
```

### 3.4. 在 webpack 中使用

目录：

```text
src/
  components/
    dist/
      demo/
        flowchart.config.10.json
      FlowChart.common.js
      FlowChart.css
  App.vue
```

示例：

```vue
<template>
  <div id="app">
    <FlowChart :options="options"></FlowChart>
  </div>
</template>

<script>
import FlowChart from './components/dist/FlowChart.common';
import './components/dist/FlowChart.css';
import config from './components/dist/demo/flowchart.config.10.json';

export default {
  components: {
    FlowChart,
  },

  mounted() {
    this.init(config);
  },

  data() {
    return {
      options: null,
    };
  },

  methods: {
    init(options) {
      // options.highlight.value = -1;
      // options.highlight.value = 0;
      // options.highlight.value = 1;
      // options.highlight.value = 2;
      options.highlight.value = 3;
      // options.highlight.value = 4;
      // options.highlight.value = 5;
      // options.highlight.value = 6;
      // options.highlight.value = 7;
      // options.highlight.value = 8;

      this.options = options;
    },
  },
};
</script>
<style lang="scss">
#app {
  position: absolute;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
}
</style>
```
