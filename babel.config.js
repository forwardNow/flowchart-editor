module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset',
  ],
  plugins: [
    // 放在数组的最后一个位置，在其他插件执行完后再进行代码转换
    '@babel/plugin-proposal-optional-chaining',
  ],
};
