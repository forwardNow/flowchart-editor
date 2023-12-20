/* eslint-disable @typescript-eslint/no-use-before-define */
const path = require('path');

const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const { DefinePlugin } = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');

const IS_PROD = process.env.NODE_ENV === 'production';

module.exports = {
  mode: IS_PROD ? 'production' : 'development',
  devtool: IS_PROD ? false : 'cheap-module-source-map',

  devServer: {
    host: 'localhost',
    port: '3000',
    open: true,
    hot: true,
    historyApiFallback: true,
  },

  entry: IS_PROD ? './src/flow-chart/FlowChart.vue' : './src/main.ts',

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

  output: IS_PROD ? {
    path: path.resolve(__dirname, './dist'),
    filename: 'flowchart-editor.js',
    assetModuleFilename: 'media/[name].[ext][query]',

    library: {
      type: 'commonjs2',
    },

    clean: true,
  } : {
    filename: 'js/[name].js',
    chunkFilename: 'js/[name].chunk.js',
    assetModuleFilename: 'media/[name].[ext][query]',
  },

  resolve: {
    extensions: ['.ts', '.js', '.vue', '.json', '.wasm'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          cacheDirectory: path.resolve(__dirname, './node_modules/.cache/vue-loader'),
        },
      },

      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },

      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              cacheDirectory: true,
              cacheCompression: false,
            },
          },
        ],
      },
      { test: /\.css$/, use: getStyleLoaders() },
      { test: /\.less$/, use: getStyleLoaders('less-loader') },
      { test: /\.s[ac]ss$/, use: getStyleLoaders('sass-loader') },
      { test: /\.styl$/, use: getStyleLoaders('stylus-loader') },
      {
        test: /\.(png|jpe?g|gif|webp|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 10 * 1024,
          },
        },
      },
      {
        test: /\.(ttf|woff2?|mp4|mp3|avi)$/,
        type: 'asset/resource',
      },

    ],
  },

  plugins: [
    new ESLintWebpackPlugin({
      context: path.resolve(__dirname, './src'),
    }),

    !IS_PROD && new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
    }),

    IS_PROD && new MiniCssExtractPlugin({
      filename: 'flowchart-editor.css',
    }),

    new VueLoaderPlugin(),

    new DefinePlugin({
    }),

  ].filter(Boolean),

  optimization: {
    minimize: false,
  },
};

// --

function getStyleLoaders(preProcessor) {
  return [
    IS_PROD ? MiniCssExtractPlugin.loader : 'vue-style-loader',
    'css-loader',
    {
      loader: 'postcss-loader',
      options: {
        postcssOptions: {
          plugins: [
            'postcss-preset-env',
          ],
        },
      },
    },
    preProcessor && {
      loader: preProcessor,
    },
  ].filter(Boolean);
}
