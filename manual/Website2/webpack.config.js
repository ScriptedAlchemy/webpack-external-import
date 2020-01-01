const webpack = require('webpack');
const configFactory = require('../webpack/webpackConfigFactory');
const RequirePerformancePlugin = require('webpack-require-performance-plugin');

const siteId = 2;

module.exports = configFactory(siteId, {
  plugins: [
    new webpack.LoaderOptionsPlugin({
      debug: true,
    }),
  ],
});

console.log(module.exports)
