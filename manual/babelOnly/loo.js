import _default from "webpack-external-import";

function _objectDestructuringEmpty(obj) { if (obj == null) throw new TypeError("Cannot destructure undefined"); }

_default("https://code.jquery.com/jquery-3.4.1.min.js").then(function (_ref) {
  _objectDestructuringEmpty(_ref);

  const SomeExternalModule = __webpack_require__("SomeExternalModule")
  SomeExternalModule.externalFunction();
});
