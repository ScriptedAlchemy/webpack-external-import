const configFactory = require("../webpack/webpackConfigFactory");
const { ContainerPlugin } = require("../../");

const siteId = 2;
module.exports = configFactory(siteId, {
  output: {
    publicPath: 'http://localhost:3002/'
  },
  plugins: [
    new ContainerPlugin({
      name: "websiteTwo",
      expose: {
        Title: "./src/components/Title/index.js"
      }
    })
  ]
});
