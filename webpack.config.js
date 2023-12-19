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
  devtool: IS_PROD ? 'source-map' : 'cheap-module-source-map',

  devServer: {
    host: 'localhost',
    port: '3000',
    open: true,
    hot: true,
    historyApiFallback: true,
  },

  entry: path.resolve(__dirname, './src/main.ts'),

  output: {
    path: IS_PROD ? path.resolve(__dirname, './dist') : undefined,
    filename: IS_PROD ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
    chunkFilename: IS_PROD ? 'js/[name].[contenthash:8].chunk.js' : 'js/[name].chunk.js',
    assetModuleFilename: 'media/[name].[hash][ext][query]',
    clean: IS_PROD,
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

    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './public/index.html'),
    }),

    IS_PROD && new MiniCssExtractPlugin({
      filename: 'css/[name].[contenthash:8].css',
      chunkFilename: 'css/[name].[contenthash:8].chunk.css',
    }),

    IS_PROD && new CopyPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, './public'),
          to: path.resolve(__dirname, './dist'),
          globOptions: {
            ignore: [
              // 不拷贝 index.html, 避免与 HtmlWebpackPlugin 冲突
              '**/index.html',
            ],
          },
        },
      ],
    }),

    new VueLoaderPlugin(),

    new DefinePlugin({
    }),

  ].filter(Boolean),

  optimization: {
    splitChunks: {
      chunks: 'all',
    },
    runtimeChunk: {
      name: (entrypoint) => `runtime~${entrypoint.name}.js`,
    },

    minimize: IS_PROD,
    minimizer: [
      new CssMinimizerPlugin(),
      new TerserPlugin(),

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
