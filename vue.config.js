const path = require('path');
const { defineConfig } = require('@vue/cli-service');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const packageJson = require('./package.json');

const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,

  configureWebpack: {
    // mode: IS_PROD ? 'production' : 'development',
    // devtool: IS_PROD ? 'source-map' : 'cheap-module-source-map',

    externals: IS_PROD ? {
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
    } : {},

    plugins: [
      IS_PROD ? new CopyPlugin({
        patterns: [
          { from: 'types', to: 'types' },
        ],
      }) : null,

      // IS_PROD ? new ZipWebpackPlugin({
      //   path: path.resolve(__dirname, 'dist-zip'),
      //
      //   filename: (function getFilename() {
      //     const { name, version } = packageJson;
      //     return `${name}.${version}`;
      //   }()),
      // }) : null,
    ].filter(Boolean),
  },
});
