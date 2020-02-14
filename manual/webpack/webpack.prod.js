const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = commonPaths => ({
  mode: "development",
  entry: commonPaths.entry,
  output: {
    filename: `${commonPaths.jsFolder}/[name].[fullhash].js`,
    path: commonPaths.outputPath,
    chunkFilename: `${commonPaths.jsFolder}/[name].[chunkhash].js`
  },
  optimization: {
    mergeDuplicateChunks: false,
    // Keep the runtime chunk seperated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
  },

  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      }
    ]
  },
  devServer: {
    contentBase: commonPaths.outputPath,
    compress: true,
    hot: true,
    port: `300${commonPaths.siteId}`,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "*"
    }
  },
  devtool: "inline-source-map"
});
