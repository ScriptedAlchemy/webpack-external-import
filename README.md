# Webpack External Import

> **import() other modules from third parties, or other webpack builds
> themselves while sharing dependencies! At runtime! Welcome To Webpack Module
> Federation**

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

> This Project has been incoporated into the Webpack 5 core. Track the progress
> and share the issue for wider exposure. I believe a system like this would
> offer great benefits for the JavaScript community.
> https://github.com/webpack/webpack/issues/10352

Because this project is now based out of the Webpack 5 repo. It serves mostly as
an example, testing ground, and documentation house.

## How to run example project

1. Run an install from the root `yarn install`

2. From the root of the project, run `yarn dev`

## Usage

Configure each webpack build you intend to federate code between.

```js
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');
module.exports = {
  // other webpack config options...
  output: {
    publicPath: 'http://localhost:3002/', //important to specify url path if loading code from alternative domains/ports
  },
  plugins: [
    new ModuleFederationPlugin({
      name: 'website1',
      library: { type: 'var', name: 'website1' },
      filename: 'remoteEntry.js',
      exposes: {
        Footer: './src/Footer',
      },
      remotes: {
        website2: 'website2',
      },
      shared: ['react', 'react-dom'],
    }),
  ],
};
```

## Consuming code from a remote

Webpack will generate a special file along with a standard build. In this
example, i have called it `remoteEntry.js`

Add the remote entry to an application that will consume federated modules.

```html
<html>
  <head>
    <script src="http://localhost:3002/remoteEntry.js"></script>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>
```

Consume code from a remote using any require syntax.

```js
import React, { lazy, Suspense, useState } from 'react';
import Footer from './Footer';
import Footer2 from 'website2/Footer'; // federated

const Title = lazy(() => import('website2/Title')); // federated

export default () => {
  return (
    <>
      <Suspense fallback={'fallback'}>
        <Title />
      </Suspense>
      <p>
        This app loads the heading above from website2, and doesnt expose
        anything itself.
      </p>
      <Footer />
      <Footer2 />
    </>
  );
};
```

# API

| name     | Must be a unique name, used as the namespace to reference federated code. No two apps should share the same namespace                                                                                                                                 |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| library  | Expects an object, the type can be any of the following. `{ type: 'var' | 'this' | 'window' | 'self' | 'global' | 'commonjs' | 'commonjs2' | 'amd', 'amd-require' | 'umd' | 'umd2' | 'system', name: defaults to the "name" option specified above }` |
| filename | Name of the generated javascript file. The name will be static (no hash) in order to allow orchestration between webpack builds.                                                                                                                      |
| exposes  | Expects an object/array. The key is how a module will be required from another app, the value is a relative path based on the context of the build.                                                                                                   |
| remotes  | A list of other remote names. A remote name is the string used in the `name` option. Its used to inform Webpack of the scope where a module is located                                                                                                |
| shared   | Object/Array of requests or modules that should be shared between federated code. A remote will depend on the host's dependency, if none exists, the remote will fallback and load its own                                                            |

# Examples of using Module Federation outside of the browser - Useful for SSR

Read more:
https://github.com/webpack/webpack/tree/b5eeb7d67dcb1dab246a4ea9cef62255e177406d/test/configCases/container/2-container-full

```js
module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: 'container',
      library: { type: 'commonjs-module' },
      filename: 'container.js',
      remotes: {
        containerB: '../1-container-full/container.js',
      },
      shared: ['react'],
    }),
  ],
};
```

Inside the App, remotes can be consumed as such.

```js
import React from 'react';
import ComponentC from 'containerB/ComponentC';

export default () => {
  return `App rendered with [${React()}] and [${ComponentC()}]`;
};
```
