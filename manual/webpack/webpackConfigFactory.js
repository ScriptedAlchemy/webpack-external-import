/* eslint-disable import/no-unresolved */

const webpackMerge = require("webpack-merge");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");
const WriteFilePlugin = require("write-file-webpack-plugin");
const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const common = require("./webpack.common");
const paths = require("./paths");
const { ContainerPlugin } = require("../../");

const envs = {
  development: "dev",
  production: "prod",
  test: "dev"
};
/* eslint-disable global-require,import/no-dynamic-require */
const env = envs[process.env.NODE_ENV || "development"];
const envConfig = require(`./webpack.${env}.js`);

module.exports = (siteId, options) => {
  const commonPaths = paths(siteId);
  const manifestName = `website-${siteId}`;
  const templatePath = path.resolve(
    __dirname,
    `../website${siteId}/template.html`
  );

  return webpackMerge(
    common(commonPaths),
    envConfig(commonPaths),
    {
      plugins: [
        new ContainerPlugin({
          name: "remoteEntry",
          expose: {
            Title: "./src/components/Title/index.js"
          }
        })
        // new HtmlWebpackPlugin({
        //   template: templatePath,
        //   inject: true
        // })
      ]
    },
    options
  );
};
