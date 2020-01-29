const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const {CleanWebpackPlugin} = require("clean-webpack-plugin");
const WriteFilePlugin = require("write-file-webpack-plugin");
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = commonPaths => ({
  mode: "production",
  entry: commonPaths.entry,
  output: {
    filename: `${commonPaths.jsFolder}/[name].[hash].js`,
    path: commonPaths.outputPath,
    chunkFilename: `${commonPaths.jsFolder}/[name].[chunkhash].js`
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        // Use multi-process parallel running to improve the build speed
        // Default number of concurrent runs: os.cpus().length - 1
        parallel: true,
        // Enable file caching
        cache: true,
        sourceMap: true
      }),
      new OptimizeCSSAssetsPlugin()
    ],
    // Automatically split vendor and commons
    // https://twitter.com/wSokra/status/969633336732905474
    // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
    splitChunks: {
      chunks: "all",
      cacheGroups: {
        vendors: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "initial"
        }
      }
    },
    // Keep the runtime chunk seperated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
    runtimeChunk: {
      name: "webpackRuntime"
    }
  },

  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: "css-loader",
            options: {
              sourceMap: false,
              modules: true,
              camelCase: true,
              localIdentName: "[local]___[hash:base64:5]"
            }
          },
          "sass-loader"
        ]
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
  plugins: [
    new WriteFilePlugin(),
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: `${commonPaths.cssFolder}/[name].css`,
      chunkFilename: `${commonPaths.cssFolder}/[name].css`
    })
  ],
  devtool: "inline-source-map"
});
