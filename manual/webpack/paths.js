const path = require('path');

module.exports = (siteId) => ({
  root: path.resolve(__dirname, '../'),
  outputPath: path.resolve(__dirname, '../', `Website${siteId}`, 'dist'),
  entry: siteId === 1 ? require.resolve('../Website1/src/index.jsx') : require.resolve('../Website2/src/index.jsx'),
  imagesFolder: 'images',
  fontsFolder: 'fonts',
  cssFolder: 'css',
  jsFolder: 'js',
  siteId,
});
