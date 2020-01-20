const webpack = require("webpack");

const external = require.resolve("../../");

module.exports = commonPaths => ({
  mode: "development",
  devtool: "inline-source-map",
  entry: commonPaths.entry,
  output: {
    filename: "[name].js",
    path: commonPaths.outputPath,
    chunkFilename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: ["style-loader", "css-loader", "sass-loader"]
      }
    ]
  },
  optimization: {
    runtimeChunk: {
      name: "webpackRuntime"
    },
    splitChunks: {
      chunks: "all",
      maxInitialRequests: Infinity,
      minSize: 0
      // cacheGroups: {
      //   vendor: {
      //     test: /[\\/]node_modules[\\/]/,
      //     name(module) {
      //       // get the name. E.g. node_modules/packageName/not/this/part.js
      //       // or node_modules/packageName
      //       const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
      //       // npm package names are URL-safe, but some servers don't like @ symbols
      //       return `npm.${packageName.replace('@', '')}`;
      //     },
      //   },
      // },
    }
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
