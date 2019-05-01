const path = require('path');

module.exports = {
  root: path.resolve(__dirname, '../'),
  outputPath: path.resolve(__dirname, '../', 'build'),
  templatePath: path.resolve(__dirname, '../', `Website${process.env.MFE}/template.html`),
  entry: process.env.MFE === 1 ? require.resolve('../Website1/src/index.jsx') : require.resolve('../Website2/src/index.jsx'),
  imagesFolder: 'images',
  fontsFolder: 'fonts',
  cssFolder: 'css',
  jsFolder: 'js',
};
