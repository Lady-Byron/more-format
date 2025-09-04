const path = require('path');

// 告诉 flarum-webpack-config：此前端会使用到其它扩展的导出
module.exports = require('flarum-webpack-config')({
  useExtensions: ['askvortsov-rich-text'],
});

module.exports.entry = {
  forum: path.resolve(__dirname, 'src/forum/index.tsx'),
};

