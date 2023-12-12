const { defineConfig } = require('@vue/cli-service');
const CopyPlugin = require('copy-webpack-plugin');

const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,

  configureWebpack: {
    plugins: [
      IS_PROD ? new CopyPlugin({
        patterns: [
          { from: 'public/demo', to: 'demo' },
        ],
      }) : null,
    ].filter(Boolean),
  },
});
