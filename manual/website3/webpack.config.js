// const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const configFactory = require("../webpack/webpackConfigFactory");

const siteId = 3;

module.exports = configFactory(siteId, {
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [
          // ExtractCssChunks.loader,
          "css-loader"
        ]
      }
    ]
  },
  plugins: [
    // new ExtractCssChunks({
    //   filename: "[name].css",
    //   chunkFilename: "[name].css"
    // })
  ]
});
