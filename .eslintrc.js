const isProd = process.env.NODE_ENV === 'production';

module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
  },
  extends: [
    'plugin:vue/recommended',
    'airbnb-base',
    'airbnb-typescript/base',
  ],

  parser: 'vue-eslint-parser', // 解析 vue
  parserOptions: {
    parser: '@typescript-eslint/parser', // 解析 ts
    extraFileExtensions: ['.vue'],
    ecmaVersion: 2020,
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json'],
  },

  settings: {
    'import/resolver': {
      // https://github.com/benmosher/eslint-plugin-import/issues/1396
      [require.resolve('eslint-import-resolver-node')]: {},
      [require.resolve('eslint-import-resolver-webpack')]: {
        config: require.resolve('./webpack.config.js'),
      },
    },
    'import/extensions': [
      '.js',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
    ],
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
    'vue/max-attributes-per-line': 'off',
  },
};
