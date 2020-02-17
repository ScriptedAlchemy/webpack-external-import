const configFactory = require("../webpack/webpackConfigFactory");
const { ContainerReferencePlugin } = require("../../");

const siteId = 4;
module.exports = configFactory(siteId, {
  plugins: [
    new ContainerReferencePlugin({
      remoteType: "var",
      remotes: ["websiteTwo"],
      override: {
        react: "react"
      }
    })
  ]
});
