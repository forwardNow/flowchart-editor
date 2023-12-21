module.exports = {
  cssFile: 'flowchart-editor.css',
  javaScriptFile: 'flowchart-editor.js',

  externals: [
   'vue',
   '@jsplumb/browser-ui',
   'interactjs',
   'jquery',
   'lodash.clonedeep',
   'lodash.debounce',
   'lodash.get',
   'lodash.merge',
   'lodash.template',
   'lodash.throttle',
  ],

  drop_console: true,
};
