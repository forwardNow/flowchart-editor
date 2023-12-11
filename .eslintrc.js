const { resolve } = require('path');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    'plugin:vue/essential',
    '@vue/airbnb',
    '@vue/typescript/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },

  settings: {
    // #region 解决 “.ts 文件 import/extensions import/no-unresolved” 报错的问题
    // 参考：https://qa.1r1g.com/sf/ask/4556640931/
    // 'import/extensions': ['.js', '.jsx', '.mjs', '.ts', '.tsx'],
    'import/resolver': {
      webpack: {
        config: {
          resolve: {
            extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],

            // 解决 “.vue 文件 @ 不识别” 报错的问题
            alias: {
              '@': resolve('./src'),
            },
          },
        },
      },
    },
    // #endregion
  },

  rules: {
    'no-console': isProd ? 'warn' : 'off',
    'no-debugger': isProd ? 'warn' : 'off',

    // #region 解决 ts 中使用枚举时， no-shadow 报错的问题
    'no-shadow': 'off',
    '@typescript-eslint/no-shadow': ['error'],
    // #endregion

    'max-len': 'off',
    'no-use-before-define': 'off',
    'vuejs-accessibility/click-events-have-key-events': 'off',
    camelcase: 'warn',
    'import/prefer-default-export': 'off',
    'vuejs-accessibility/form-control-has-label': 'off',
    'vue/multi-word-component-names': 'warn',

    'vuejs-accessibility/label-has-for': 'warn'
  },
};
