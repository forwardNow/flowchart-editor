module.exports = {
  cssFile: 'index.css',
  javaScriptFile: 'index.js',

  // 排除掉 package.json 中 dependencies 中的所有依赖
  externals: {
    vue: 'vue',
    '@jsplumb/browser-ui': '@jsplumb/browser-ui',
    interactjs: 'interactjs',
    jquery: 'jquery',
    'lodash.clonedeep': 'lodash.clonedeep',
    'lodash.debounce': 'lodash.debounce',
    'lodash.get': 'lodash.get',
    'lodash.merge': 'lodash.merge',
    'lodash.template': 'lodash.template',
    'lodash.throttle': 'lodash.throttle',
  },

  drop_console: true,
};
