import "webpack-external-import/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";
import { corsImport } from "../../../index";

Promise.all([
  corsImport(`http://localhost:3002/importManifest.js?${Date.now()}`),
  corsImport(`http://localhost:3003/importManifest.js?${Date.now()}`)
]).then(() => {
  __webpack_require__
    .interleaved("website-2/TitleComponent")
    .then(() => console.log('direct require',__webpack_require__("TitleComponent")));
  ReactDOM.render(<App />, document.getElementById("app"));
});

