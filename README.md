# flowchart-editor

## 1. 介绍

流程图的编辑及呈现

## 2. 环境

vue 版本：

* vue@^2.6.0 : 版本范围 `[2.6.0, 3.0.0)`

nodejs 版本：

* 开发：16.x.x
* 生产：12.x.x

## 3. 在其他项目中使用

>以 demo 项目要使用该包 为例

### 3.1. 安装

离线安装步骤：

1. 在项目根目录执行 pack 脚本命令，生成 tgz 文件

    ```shell
    npm run pack
    ```

2. 将 `dist-zip/fe-flowchart-editor-1.0.3.tgz` 拷贝到 `demo/libs/` 下
3. 在 demo 项目目录，执行离线安装命令

    ```shell
    npm i ./libs/fe-flowchart-editor-1.0.3.tgz
    ```

从私仓下载安装步骤：

1. 配置 demo 项目的私仓镜像源，`.npmrc`

    ```text
    @fe:registry=http://39.100.38.119:10000/repository/primeton-npm-product-repository/
    ```
   
2. 执行安装命令

    ```shell
    npm i @fe/flowchart-editor@1.0.3
    ```

### 3.2. 使用

```vue
<template>
  <div id="app">
    <FlowChart :options="options" toolbox></FlowChart>
  </div>
</template>

<script>
  import FlowChart from '@fe/flowchart-editor';
  import '@fe/flowchart-editor/dist/index.css';

  export default {
    components: {
      FlowChart,
    },

    mounted() {
      this.options = {};
    },

    data() {
      return {
        options: null,
      };
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
