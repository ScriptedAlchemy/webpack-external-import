const webpack = require("webpack");
const configFactory = require("../webpack/webpackConfigFactory");
var VirtualModulesPlugin = require("webpack-virtual-modules");

const siteId = 2;
module.exports = configFactory(siteId, {
  plugins: [
    new VirtualModulesPlugin({
      "src/federatedEntry.js": 'module.exports = { foo: "foo" };'
    })
  ]
});
