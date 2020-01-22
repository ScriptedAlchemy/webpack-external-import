import "webpack-external-import/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";
import { corsImport } from "../../../index";

Promise.all([corsImport("http://localhost:3002/importManifest.js"),corsImport("http://localhost:3003/importManifest.js")]).then(() =>
  ReactDOM.render(<App />, document.getElementById("app"))
);
