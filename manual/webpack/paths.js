const path = require('path');

module.exports = {
  root: path.resolve(__dirname, '../'),
  outputPath: path.resolve(__dirname, '../', 'build'),
  entry: process.env.MFE === 1 ? require.resolve('../Website1/src/index.jsx') : require.resolve('../Website2/src/index.jsx'),
  imagesFolder: 'images',
  fontsFolder: 'fonts',
  cssFolder: 'css',
  jsFolder: 'js',
};
