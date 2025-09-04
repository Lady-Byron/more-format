const path = require('path');
const base = require('flarum-webpack-config')();

base.entry = {
  forum: path.resolve(__dirname, 'src/forum/index.tsx'),
};

module.exports = base;
