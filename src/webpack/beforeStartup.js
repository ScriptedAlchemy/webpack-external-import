const Template = require("webpack/lib/Template");

export function addWebpackRegister(source, chunk, hash) {
  if (source) {
    const splitSrouce = source.split("jsonpArray.push = webpackJsonpCallback;");
    return Template.asString([
      splitSrouce[0].replace(
        'var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];',
        'var jsonpArray = window["webpackJsonp"] = window["webpackJsonp"] || [];\nvar webpackRegister = window["webpackRegister"] = window["webpackRegister"] || [];'
      ),
      // splitSrouce[0].replace(
      //   "var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);",
      //   "var oldJsonpFunction = jsonpArray.push.bind(jsonpArray);\nwebpackRegister.push.bind(webpackRegister);"
      // ),
      "jsonpArray.push = webpackJsonpCallback;",
      "webpackRegister.push = registerLocals",
      splitSrouce[1]
    ]);
  }
  console.log("chunk:addWebpackRegister:", chunk);
}
