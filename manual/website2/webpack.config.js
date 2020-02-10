const webpack = require("webpack");
const configFactory = require("../webpack/webpackConfigFactory");
const URLImportPlugin = require("../../webpack");

const siteId = 2;
module.exports = configFactory(siteId, {
  plugins: [
    new URLImportPlugin({
      manifestName: "website-2",
      fileName: "importManifest.js",
      basePath: ``,
      publicPath: `//localhost:3002/`,
      useExternals: {
        react: "React"
      }
    })
  ]
});
