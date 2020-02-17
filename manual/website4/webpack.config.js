const configFactory = require("../webpack/webpackConfigFactory");
const { ContainerReferencePlugin } = require("../../");

const siteId = 4;
module.exports = configFactory(siteId, {
  plugins: [
    new ContainerReferencePlugin({
      remoteType: "system",
      remotes: ["websiteTwo"],
      override: {
        react: "react"
      }
    })
  ]
});
