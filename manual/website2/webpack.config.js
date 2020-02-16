const configFactory = require("../webpack/webpackConfigFactory");
const { ContainerPlugin, ContainerReferencePlugin } = require("../../");

const siteId = 2;
module.exports = configFactory(siteId, {
  plugins: [
    new ContainerPlugin({
      name: "websiteTwo",
      expose: {
        Title: "./src/components/Title/index.js"
      }
    })
  ]
});
