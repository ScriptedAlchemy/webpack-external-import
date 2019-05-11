const webpackMerge = require('webpack-merge');
const common = require('./webpack.common');
const paths = require('./paths');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const URLImportPlugin = require("../../webpack");
const path = require('path');

const envs = {
  development: 'dev',
  production: 'prod',
};
/* eslint-disable global-require,import/no-dynamic-require */
const env = envs[process.env.NODE_ENV || 'development'];
const envConfig = require(`./webpack.${env}.js`);

module.exports = (siteId) => {
  const commonPaths = paths(siteId);
  const manifestName = siteId === 1 ? 'website-one' : 'website-two';
  const templatePath = path.resolve(__dirname, `../Website${siteId}/template.html`);

  return webpackMerge(common(commonPaths), envConfig(commonPaths), {
    plugins: [
      new URLImportPlugin({
        manifestName,
      }),
      new HtmlWebpackPlugin({
        template: templatePath,
        inject: true
      }),
    ]
  });
};