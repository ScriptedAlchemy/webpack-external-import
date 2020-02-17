const webpack = require("webpack");

module.exports = commonPaths => ({
  mode: "development",
  devtool: "inline-source-map",
  entry: commonPaths.entry,
  output: {
    filename: "[name].js",
    path: commonPaths.outputPath,
    chunkFilename: "[name].[contenthash].js"
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
  plugins: [new webpack.HotModuleReplacementPlugin()]
});
