/* eslint-disable @typescript-eslint/no-use-before-define */
const path = require('path');
const ESLintWebpackPlugin = require('eslint-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const config = require('./build/config');

const IS_PROD = process.env.NODE_ENV === 'production';

const IS_DEV = !IS_PROD;

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

  externals: IS_PROD ? config.externals : {},

  experiments: {
    outputModule: true,
  },

  output: IS_PROD ? {
    path: path.resolve(__dirname, './dist'),
    filename: config.javaScriptFile,
    assetModuleFilename: 'media/[name].[ext][query]',

    library: {
      type: 'module',
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

    IS_DEV && new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
    }),

    IS_PROD && new MiniCssExtractPlugin({
      filename: config.cssFile,
    }),

    new VueLoaderPlugin(),
  ].filter(Boolean),

  optimization: {
    minimize: IS_PROD,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: config.drop_console,
          },
        },
      }),
    ],
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
