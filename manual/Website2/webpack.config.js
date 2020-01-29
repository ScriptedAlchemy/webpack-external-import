const webpack = require("webpack");
const configFactory = require("../webpack/webpackConfigFactory");

const siteId = 2;

module.exports = configFactory(siteId, {
  plugins: [
    new webpack.LoaderOptionsPlugin({
      debug: false
    })
  ]
});

console.log(module.exports);
