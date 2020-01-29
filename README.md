# Webpack External Import

> **import() other chunks and modules from third parties, or other webpack builds themselves! At runtime!**

<p align="center">
    
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
  <a href="https://www.npmjs.com/package/webpack-external-import">
    <img src="https://img.shields.io/npm/v/webpack-external-import.svg" alt="Version" />
  </a>

  <a href="https://www.npmjs.com/package/webpack-external-import">
    <img src="https://img.shields.io/npm/dt/webpack-external-import.svg" alt="Downloads" />
  </a>

  <a href="https://www.npmjs.com/package/webpack-external-import">
    <img src="https://img.shields.io/npm/dm/webpack-external-import.svg" alt="License" />
  </a>
  
  <a href="https://www.npmjs.com/package/webpack-external-import">
    <img src="https://img.shields.io/npm/l/webpack-external-import.svg" alt="License" />
  </a>
</p>

<p align="center">
 <img src="docs/webpack-external-import.png" width="40%" alt="webpack-external-import" />
</p>

```shell
$ yarn add webpack-external-import
```

_This project is under active development_

\*\*To jump to the _development_ section [click here](#development)

# Installation

### npm

```sh
npm install webpack-external-import --save
```

### Yarn

```sh
yarn add webpack-external-import
```

## Getting Started

1.  Add `webpack-external-import/webpack` to your webpack plugins:

```js
// techblog.webpack.config.js
const URLImportPlugin = require("webpack-external-import/webpack");
{
  plugins: [
    new URLImportPlugin({
      manifestName: "website-one"
    })
  ];
}

// otherblog.webpack.config
const URLImportPlugin = require("webpack-external-import/webpack");
{
  plugins: [
    new URLImportPlugin({
      manifestName: "website-two"
    })
  ];
}
```

2. If you are interleaving webpack bundles, load their manifests somewhere

```js
// index.js
import { corsImport } from "webpack-external-import";
import React from "react";
import ReactDOM from "react-dom";
import App from "./App.jsx";

// using Date.now() for cache busting the file. It should only less than 2kb
corsImport(`http://localhost:3002/importManifest.js?${Date.now()}`).then(() => {
  ReactDOM.render(<App />, document.getElementById("app"));
});

// you could also use native imports

import(
  /* webpackIgnore:true */ `http://localhost:3002/importManifest.js?${Date.now()}`
).then(() => {
  ReactDOM.render(<App />, document.getElementById("app"));
});
```

## Usage

This plugin works with any Webpack driven application

#### Vanilla JS

This assumes a import manifest was loaded somewhere else in the application already.

If you have not imported manifest then wrap your function in another promise:

```js
corsImport("http://localhost:3002/importManifest.js").then(() => {
  someFunction();
});
```

As long as the `importManifest` was loaded - this is how it would be used
`__webpack_require_.interleaved()` expects a module to contain both the module.id and the namespace

This allows external-import to know where to interleave from.
`__webpack_require_.interleaved([namespace]/[module.id])`

Below is an example of interleaving a module from `website-2`

```js
// import a chunk from another website build with webpack-external-import

__webpack_require__.interleaved("website-2/ValidationRules").then(() => {
  const validationRules = __webpack_require__("ValidationRules");
  // proceed to use as a you would with a normal require statement
  validationRules.validateObject(someObject);
});
```

### With JSX

`ExternalComponent` exists for ease of use with React Components and is as SFC using React.Hooks

```js
import { ExternalComponent } from "webpack-external-import";
class SomeComponent extends Component {
  render() {
    return (
      <div>
        <ExternalComponent
          interleave={__webpack_require__
            .interleaved("website-2/TitleComponent")
            .then(() => __webpack_require__("TitleComponent"))}
          export="Title"
          title="Some Heading"
        />
      </div>
    );
  }
}
```

## What is the use of `webpack-external-import` ?

- **Load components over the wire** - Pull in components at runtime.
- **Build leaner micro-frontends (MFE)** -
  Micro-frontends can share bundle chunks and resources with each other while remaining self-contained, removing needless code duplication.
- **Split a large, multi-team app into separate deployable chunks while keeping it as one SPA** - Large apps can be split into separate feature bundles that can be deployed independently, reducing deployment bottlenecks.
- **Manage common js/vendor files automatically.** - Instead of dealing with peer dependencies, externals, or anything else, you can load the dependency from a remote source.
- **LOSA Style frontend architecture** - Run multiple apps on a single page.
- **FOSA Style frontend orchestration** - Powerful frontend orchestration, self-organizing application architecture. Many builds act as one

### Advanced Setup - Injecting Webpack modules from another build

Use the webpack plugin to inject webpack modules from another build into your build.

_**Important**: Make sure manifestName_ is unique per webpack build.
If you have multiple builds, they all need to have a unique manifestName

**webpack.config.js**

```js
const URLImportPlugin = require("webpack-external-import/webpack");
{
  plugins: [
    new URLImportPlugin({
      manifestName: "website-one"
    })
  ];
}
```

## Mark Files for interleaving

Pretend we have two separate apps that each have their _independent_ build. We want to share a module from one of our apps with the other.

To do this, you must add an `externalize` object to `package.json`.
The `externalize` object tells the plugin to make the module accessible through a predictable name.

For example:

```json
// wbsite-two package.json
{
  "name": "some-package-name",
  "interleave": {
    "src/components/Title/index.js": "TitleComponent",
    "src/components/hello-world/index.js": "SomeExternalModule"
  }
}
```

```js
// website-one App.js
__webpack_require__
  .interleaved("website-3/TitleComponentWithCSSFile")
  .then(() => __webpack_require__("TitleComponentWithCSSFile"));
```

This ensures a easy way for other consumers, teams, engineers to look up what another project or team is willing
to allow for interleaving

## Full Example

WEBSITE-ONE
app.js

```js
import React, { Component } from "react";
import { ExternalComponent } from "webpack-external-import";
import HelloWorld from "./components/goodbye-world";
import "react-select";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      titleUrl: null,
      manifestLoaded: false,
      loaded: false
    };
  }

  componentDidMount() {
    __webpack_require__
      .interleaved("website-3/TitleComponentWithCSSFile")
      .then(() => __webpack_require__("TitleComponentWithCSSFile"));
  }

  renderDynamic = () => {
    const { loaded } = this.state;
    if (!loaded) return null;
    return __webpack_require__("SomeExternalModule").default();
  };

  render() {
    return (
      <div>
        <HelloWorld />

        <ExternalComponent
          interleave={__webpack_require__
            .interleaved("website-2/TitleComponent")
            .then(() => __webpack_require__("TitleComponent"))}
          export="Title"
          module="TitleComponent"
          title="Some Heading"
        />

        <ExternalComponent
          interleave={__webpack_require__
            .interleaved("website-3/TitleComponentWithCSSFile")
            .then(() => __webpack_require__("TitleComponentWithCSSFile"))}
          export="Title"
          title="Title Component With CSS File Import"
        />
        {this.renderDynamic()}
      </div>
    );
  }
}

Promise.all([
  corsImport(`http://localhost:3002/importManifest.js?${Date.now()}`),
  corsImport(`http://localhost:3003/importManifest.js?${Date.now()}`)
]).then(() => {
  ReactDOM.render(<App />, document.getElementById("app"));
});
```

WEBSITE-TWO:
package.json

```json
{
  "name": "website-two",
  "version": "0.0.0-development",
  "repository": {
    "type": "git",
    "url": "https://github.com/faceyspacey/remixx.git"
  },
  "author": "Zack Jackson <zack@ScriptedAlchemy.com> (https://github.com/ScriptedAlchemy)",
  "interleave": {
    "src/components/Title/index.js": "TitleComponentWithCSSFile",
    "src/components/Title/style.css": "TitleComponentWithCSSFileCSS",
    "src/components/hello-world/index.js": "SomeExternalModule"
  }
}
```

## API:

```js
// Website Two -  webpack.config.js

module.exports = {
  output: {
    publicPath
  },
  plugins: [
    new URLImportPlugin({
      manifestName: "website-two",
      fileName: "importManifest.js",
      basePath: ``,
      publicPath: `//localhost:3002/`,
      transformExtensions: /^(gz|map)$/i,
      writeToFileEmit: false,
      seed: null,
      filter: null,
      debug: true,
      map: null,
      generate: null,
      sort: null
    })
  ]
};

// Website One webpack.config.js
module.exports = {
  output: {
    publicPath
  },
  plugins: [
    new URLImportPlugin({
      manifestName: "website-one",
      fileName: "importManifest.js",
      basePath: ``,
      publicPath: `//localhost:3001/`,
      transformExtensions: /^(gz|map)$/i,
      writeToFileEmit: false,
      seed: null,
      filter: null,
      debug: true,
      map: null,
      generate: null,
      sort: null
    })
  ]
};
```

### `options.fileName`

Type: `String`<br>
Default: `manifest.json`

The manifest filename in your output directory.

### `options.publicPath`

Type: `String`
Default: `output.publicPath`

A path prefix that will be added to values of the manifest.

### `options.basePath`

Type: `String`

A path prefix for all keys. Useful for including your output path in the manifest.

### `options.writeToFileEmit`

Type: `Boolean`<br>
Default: `false`

If set to `true` will emit to build folder and memory in combination with `webpack-dev-server`

### `options.seed`

Type: `Object`<br>
Default: `{}`

A cache of key/value pairs to used to seed the manifest. This may include a set of [custom key/value](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json) pairs to include in your manifest or may be used to combine manifests across compilations in [multi-compiler mode](https://github.com/webpack/webpack/tree/master/examples/multi-compiler). To combine manifests, pass a shared seed object to each compiler's ManifestPlugin instance.

### `options.filter`

Type: `Function(FileDescriptor): Boolean`

### `options.test`

Type: `Function(Object, FileDescriptor): Object`<br>
Default: `src`

Test resource path to see if plugin should apply transformations

### `options.map`

Type: `Function(FileDescriptor): FileDescriptor`

Modify files details before the manifest is created. [FileDescriptor typings](#filedescriptor)

### `options.sort`

Type: `Function(FileDescriptor): number`

Sort files before they are passed to `generate`. [FileDescriptor typings](#filedescriptor)

### `options.generate`

Type: `Function(Object, FileDescriptor): Object`<br>
Default: `(seed, files) => files.reduce((manifest, {name, path}) => ({...manifest, [name]: path}), seed)`

Create the manifest. It can return anything as long as it's serializable by `JSON.stringify`. [FileDescriptor typings](#filedescriptor)

### `options.serialize`

Type: `Function(Object): string`<br>
Default: `(manifest) => JSON.stringify(manifest, null, 2)`

Output manifest file in a different format then json (i.e., yaml).

### **ExternalComponent**

React Component

#### **Props**:

**`src`: string** - a url to a javascript file, note it will need to be built by another webpack build running this plugin

**`interleave`: function** - the `__webpack_require__.interleave()` function, which will return a module

**`export`: string** - The named export to use as a component from the module being imported

### The entry manifest

Each webpack build using the webpack plugin emits a manifest file to the build output directory.

The manifest allows you to find a chunk that you want, even if the name has been hashed.

Below is an example of using the manifest.

In this file, I am importing code from another website/build. My application is loading website two's manifest, which is automatically added to `window.entryManifest` under the `manifestName` I set in the webpack plugin. After that, I'm importing a chunk from website-two, in this case - the chunk is code-split.

```js
componentDidMount() {
  corsImport('http://localhost:3002/importManifest.js').then(() => {
      const Title = __webpack_require__
        .interleaved("website-two/TitleComponent")
        .then(() => __webpack_require__("TitleComponent"))

        console.log(Title) // => Module {default: ()=>{}, Title: ()=>{}}
  });
}
```

## DEMO

How to start using the demo
In the _root directory_, run the following

1. run `yarn install`
2. run `yarn demo` from the root directory
3. browse to [localhost:3001](http://localhost:3001) and you will see components from two other websites

This command will install, all dependencies, build the source for the plugin, install the demo dependencies, run all builds and start serving

## Development & Debugging

How to start the demo in debug mode, using node --inspect and connecting to a chrome debugger

> This is mainly for debugging the webpack plugin

In the root directory, run the following

1. `yarn install`
2. `yarn demo:debug` from the root directory
3. browse to [localhost:3001](http://localhost:3001)

**Note:** _[localhost:3001](http://localhost:3001) is the "consumer app, while the other is the provider app". Both apps work independently and you should check both of them out (they are extremely basic)_

Open chrome dev tools and you should see the box highlighted below appear, click on it to connect to the webpack debugger
![GitHub Logo](/docs/inspect.png)
