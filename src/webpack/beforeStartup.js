const Template = require("webpack/lib/Template");

// eslint-disable-next-line import/prefer-default-export
export function addWebpackRegister(source) {
  if (source) {
    const splitSrouce = source.split("jsonpArray.push = webpackJsonpCallback;");

    return Template.asString([
      splitSrouce[0].replace(
        'var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];',
        Template.asString([
          'var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];',
          'var webpackRegister = window["webpackRegister"] = window["webpackRegister"] || [];'
        ])
      ),
      "jsonpArray.push = function(data) {",
      Template.indent([
        "data[0].forEach(function(chunkId) {",
        Template.indent([
          "if (interleaveDeferred[chunkId]) {",
          Template.indent(
            "console.log('interleaveDeferred',interleaveDeferred);interleaveDeferred[chunkId].resolver[0](interleaveDeferred);"
          ),
          "}"
        ]),
        "});"
      ]),
      Template.indent("webpackJsonpCallback(data);"),
      "};",
      "webpackRegister.push = registerLocals;",
      splitSrouce[1]
    ]);
  }
}
