const path = require('path');
const { defineConfig } = require('@vue/cli-service');
const ZipWebpackPlugin = require('zip-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const package = require('./package.json');

const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,

  configureWebpack: {
    // mode: IS_PROD ? 'production' : 'development',
    // devtool: IS_PROD ? 'source-map' : 'cheap-module-source-map',

    plugins: [
      IS_PROD ? new CopyPlugin({
        patterns: [
          { from: 'public/demo', to: 'demo' },
          { from: 'types', to: 'types' },
        ],
      }) : null,

      IS_PROD ? new ZipWebpackPlugin({
        path: path.resolve(__dirname, 'dist-zip'),

        filename: (function getFilename() {
          const { name, version } = package;
          return `${name}.${version}`;
        }()),
      }) : null,
    ].filter(Boolean),
  },
});
