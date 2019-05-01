const webpack = require('webpack');
const path = require('path');
const WriteFilePlugin = require('write-file-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const external = require.resolve('../../dist/scout')
const URLImportPlugin = require("../../dist/webpack")
const commonPaths = require('./paths');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: commonPaths[process.env.MFE],
  output: {
    filename: '[name].js',
    path: commonPaths.outputPath,
    chunkFilename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(css|scss)$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
              modules: true,
              camelCase: true,
              localIdentName: '[local]___[hash:base64:5]',
            },
          },
          'sass-loader',
        ],
      },
    ],
  },
  optimization: {
    runtimeChunk: {
      name: "manifest",
    },
    splitChunks: {
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name(module) {
            // get the name. E.g. node_modules/packageName/not/this/part.js
            // or node_modules/packageName
            const packageName = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/)[1];
            // npm package names are URL-safe, but some servers don't like @ symbols
            return `npm.${packageName.replace('@', '')}`;
          },
        },
      },
    },
  },
  devServer: {
    contentBase: commonPaths.outputPath,
    compress: true,
    hot: true,
    port: `300${process.env.MFE}`,
  },
  resolve: {
    alias: {
      'webpack-external-import': external,
    }
  },
  plugins: [
    new URLImportPlugin({
      manifestName: process.env.MFE === 1 ? 'website-one' : 'website-two'
    }),
    // new WriteFilePlugin(),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, `../Website${process.env.MFE}/template.html`),
      inject: true
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
};
