const path = require('path');
const base = require('flarum-webpack-config')();

// 显式指定入口，避免自动探测不到 .tsx 时生成 0 个入口
base.entry = {
  forum: path.resolve(__dirname, 'src/forum/index.tsx'),
};

module.exports = base;
