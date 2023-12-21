module.exports = {
  cssFile: 'flowchart-editor.css',
  javaScriptFile: 'flowchart-editor.js',

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
