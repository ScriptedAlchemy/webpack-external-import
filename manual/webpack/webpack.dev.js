const webpack = require('webpack');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin')
const external = require.resolve('../../dist/scout')
const commonPaths = require('./paths');
module.exports = {
  mode: 'development',
  entry: {
    main: require.resolve('../src/index.jsx'),
    other: require.resolve('../src/anoterEntry.js'),
  },
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
  devServer: {
    contentBase: commonPaths.outputPath,
    compress: true,
    hot: true,
  },
  resolve: {
    alias: {
      'webpack-external-import': external,
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, '../src/template.html'),
      inject: false
    }),
    new webpack.HotModuleReplacementPlugin()
  ],
};
