const configFactory = require("../webpack/webpackConfigFactory");
const URLImportPlugin = require("../../webpack");

const siteId = 1;

module.exports = configFactory(siteId, {
  plugins: [
    new URLImportPlugin({
      manifestName: "website-1",
      fileName: "importManifest.js",
      basePath: ``,
      publicPath: `//localhost:3001/`,
      transformExtensions: /^(gz|map)$/i,
      provideExternals: ["react"]
    })
  ]
});
