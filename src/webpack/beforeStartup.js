const Template = require("webpack/lib/Template");

// eslint-disable-next-line import/prefer-default-export
export function addWebpackRegister(source, requireFn) {
  if (source) {
    const splitSource = source.split("jsonpArray.push = webpackJsonpCallback;");

    return Template.asString([
      splitSource[0].replace(
        `var jsonpArray = window["${requireFn}"] = window["${requireFn}"] || [];`,
        Template.asString([
          `var jsonpArray = window["${requireFn}"] = window["${requireFn}"] || [];`,
          'var webpackRegister = window["webpackRegister"] = window["webpackRegister"] || [];'
        ])
      ),
      "jsonpArray.push = function(data) {",
      Template.indent([
        "data[0].forEach(function(chunkId) {",
        Template.indent([
          "if (interleaveDeferred[chunkId]) {",
          Template.indent(
            "interleaveDeferred[chunkId].resolver[0](interleaveDeferred);"
          ),
          "}"
        ]),
        "});"
      ]),
      Template.indent("webpackJsonpCallback(data);"),
      "};",
      "webpackRegister.push = registerLocals;",
      splitSource[1]
    ]);
  }
}
