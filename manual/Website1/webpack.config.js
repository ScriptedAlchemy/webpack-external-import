const webpack = require("webpack");
const RequirePerformancePlugin = require("webpack-require-performance-plugin");
const configFactory = require("../webpack/webpackConfigFactory");

const siteId = 1;

module.exports = configFactory(siteId, {
});
