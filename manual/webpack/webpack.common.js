const webpack = require('webpack');


module.exports = (commonPaths) => ({
  module: {
    rules: [
      // {
      //   enforce: 'pre',
      //   test: /\.(js|jsx)$/,
      //   loader: 'eslint-loader',
      //   exclude: /(node_modules)/,
      //   options: {
      //     emitWarning: process.env.NODE_ENV !== 'production',
      //   },
      // },
      {
        test: /\.(js|jsx)$/,
        loader: 'babel-loader',
        exclude: /(node_modules)/,
        options: {
          babelrcRoots: [
            '.',
            __dirname,
          ],
        },
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: commonPaths.imagesFolder,
            },
          },
        ],
      },
      {
        test: /\.(woff2|ttf|woff|eot)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              outputPath: commonPaths.fontsFolder,
            },
          },
        ],
      },
    ],
  },
  serve: {
    content: commonPaths.entry,
    dev: {
      publicPath: commonPaths.outputPath,
    },
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['*', '.js', '.jsx', '.css', '.scss'],
  },
  plugins: [
  ],
});
