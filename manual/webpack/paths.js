const path = require("path");

module.exports = siteId => ({
  root: path.resolve(__dirname, "../"),
  outputPath: path.resolve(__dirname, "../", `website${siteId}`, "dist"),
  entry: require.resolve(`../website${siteId}/src/index.jsx`),
  imagesFolder: "images",
  fontsFolder: "fonts",
  cssFolder: "css",
  jsFolder: "js",
  siteId
});
