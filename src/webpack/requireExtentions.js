const Template = require("webpack/lib/Template");

// setting up async require capabilities
// eslint-disable-next-line no-unused-vars
export default (source, requireFn) => {
  const template = Template.asString([
    source,
    "",
    Template.getFunctionContent(
      require("./interleaveFn").requireInterleaveExtension
    )
  ]);
  return template.replace("__webpack_require__", requireFn);
};
