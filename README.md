
# Webpack Dynamic URL imports 


**This is currently under active development, but stable**

**Find it on npm as `webpack-external-import@0.0.1-beta.7`**

## What is it?

**A tool that allows you to `import()` external modules from other webpack builds, CDNs, or files hosted elsewhere, as if they were part of your current application.**

## What can I do with it?

- **Load components over the wire** - Pull in components at runtime.

- **Build leaner micro-frontends (MFE)** - 
Micro-frontends can share bundles with one another while still remaining self-contained, removing needless code duplication.

- **Split a large, multi-team app into separate deployables while keeping it as one SPA** - Large apps can be split into separate feature bundles that can be deployed independently, reducing deployment bottlenecks.

- **Manage common js / vendor files automatically.** - Instead of dealing with peer dependencies, externals, or anything else, you can just load the dependency from a remote source.

- **LOSA Style frontend architecture** - Run multiple apps on a single page.

## Setup

### Install

From npm:
```bash
npm install webpack-external-import --save
```

or, from yarn:
```bash
yarn add webpack-external-import --save
```

### Basic Setup - Importing URLs only

The basic setup will allow you to import from URLs.  For example: `import('https://code.jquery.com/jquery-3.3.1.min.js');`

Add the `webpack-external-import/babel` plugin to your babelrc:

**.babelrc**
```json
{
    "presets": [],
    "plugins": [
        "webpack-external-import/babel",
        "@babel/plugin-syntax-dynamic-import",
        "@babel/plugin-proposal-class-properties"
    ]
}
```

### Advanced Setup - Injecting Webpack modules from another build

Use the webpack plugin to inject webpack modules from another build into your build. 

_**Important**: Make sure manifestName_ is unique per webpack build.
If you have multiple builds, they all need to have  their own manifestName

**webpack.config.js**
```js
const URLImportPlugin = require('webpack-external-import/webpack')
{
    plugins: [
        new URLImportPlugin({
          manifestName: 'website-one'
        })
    ]
}
```
then add the babel plugin to babelrc:

**.babelrc**
```json
{
    "presets": [],
    "plugins": [
        "webpack-external-import/babel",
        "@babel/plugin-syntax-dynamic-import",
    ]
}
```

## Example Usage
Pretend we have two separate apps that each have their own _independent_ build.  We want to share a module from one of our apps with the other.

To do this, we add an `externalize` comment to the module. This tells the plugin to make the module available externally with the name `ExampleModule`:


<table>
<tr>
<th>
<!-- empty -->
</th>
<th>
Application A
</th>
<th>
Application B 
</th>
</tr>
<tr>

<td>
  <strong>Provider: Javascript Asset</strong>
</td>

<td>
<pre>
    
```js
// Title.js

import React from 'react';

export 
 const Title = ({title}) => {
  return title
}

export 
 const alert = (message) => {
  alert(message)
}


/*externalize:ExampleModule*/
```
</pre>
</td>

</tr>
<tr>

<td>
    <pre>
    
        Provider: Code-Splits asset into title-cnk
    
   </pre>
</td>

<td>
<pre>

```js

// Title.js

componentDidMount() {
  import(
  /* webpackChunkName: "title-cnk"*/ 
  './components/Title'
  );
}
```

</pre>
<td>

<td>empty<td>

</tr>

<tr>
<td>
    <strong>Consumer File</strong>
</td>
<td><!--        --></td>

<td>
    <pre>
    
    // App.js
    
    import('http://website1.com/js/ex-file.js')
    .then(({ExampleModule})=>{
      ExampleModule.alert('custom alert')
    });
    
   </pre>
</td>
</tr>

<tr>
    <td>
        <pre><br/><br/><br/>React Example<br/></pre>
    </td>
<td><!--        --></td>
    <td>
        <pre>
js
import {ExternalComponent} from 'webpack-external-import'

()=>{
  return (
    <ExternalComponent src={import(/* importUrl */ helloWorldUrl)} module="ExampleModule" export='Title' title={'Some Heading'}/>
  )
}
        </pre>
    </td>
</tr>
</table>



**Application A:**
```js
// Title.js

import React from 'react';

export const Title = ({title}) => {
  return (<h1>{title}</h1>)
}

export const alert = (message) => {
  alert(message)
}


/*externalize:ExampleModule*/

```

The `ExampleModule` can now be pulled into our other app using `import`:

**Application B:**
```js
import('http://website1.com/js/theExampleFile.js').then(({ExampleModule})=>{
  ExampleModule.alert('custom alert')
});
```

There is also a React component, `ExternalComponent`, that can be useful for importing React components:

```js
import {ExternalComponent} from 'webpack-external-import'

()=>{
  return (
    <ExternalComponent src={import(/* importUrl */ helloWorldUrl)} module="ExampleModule" export='Title' title={'Some Heading'}/>
  )
}
```

## API:

```js
// webpack.config.js

module.exports = {
  output: {
    publicPath
  },
  plugins: [
    new ManifestPlugin(options)
  ]
}
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

A cache of key/value pairs to used to seed the manifest. This may include a set of [custom key/value](https://developer.mozilla.org/en-US/Add-ons/WebExtensions/manifest.json) pairs to include in your manifest, or may be used to combine manifests across compilations in [multi-compiler mode](https://github.com/webpack/webpack/tree/master/examples/multi-compiler). To combine manifests, pass a shared seed object to each compiler's ManifestPlugin instance.

### `options.filter`

Type: `Function(FileDescriptor): Boolean`

Filter out files. [FileDescriptor typings](#filedescriptor)


### `options.map`

Type: `Function(FileDescriptor): FileDescriptor`

Modify files details before the manifest is created. [FileDescriptor typings](#filedescriptor)

### `options.sort`

Type: `Function(FileDescriptor): number`

Sort files before they are passed to `generate`. [FileDescriptor typings](#filedescriptor)

### `options.generate`

Type: `Function(Object, FileDescriptor): Object`<br>
Default: `(seed, files) => files.reduce((manifest, {name, path}) => ({...manifest, [name]: path}), seed)`

Create the manifest. It can return anything as long as it's serialisable by `JSON.stringify`. [FileDescriptor typings](#filedescriptor)

### `options.serialize`

Type: `Function(Object): string`<br>
Default: `(manifest) => JSON.stringify(manifest, null, 2)`

Output manifest file in different format then json (i.e. yaml).


## FileDescriptor

```ts
FileDescriptor {
  path: string;
  name: string | null;
  isInitial: boolean;
  isChunk: boolean;
  chunk?: Chunk;
  isAsset: boolean;
  isModuleAsset: boolean;
}
```

### The entry manifest

Each webpack build using the webpack plugin will output a manifest file to the build output directory.

The manifest allows you to find a chunk that you want, even if the name has been hashed.

Below is an example of using the manifest.

In this file, I am importing code from another website/build. My application is loading website-two's manifest, which is automatically added to `window.entryManifest` under the `manifestName` I set in the webpack plugin. After that, I'm importing a chunk from website-two, in this case - the chunk is code-split. 

```js
  componentDidMount() {
    import('http://localhost:3002/importManifest.js').then(() => {
      this.setState({manifestLoaded: true})
      import(/* importUrl */'http://localhost:3002/' + window.entryManifest['website-two']['hello-world.js'])
        .then(({someModule}) => {
          console.log('got the module, will render it in 2 seconds..')
          someModule.externalFunction()
          setTimeout(() => {
            this.setState({loaded: true})
          }, 2000)
        });
      })
  }

```

## Full Example

```js
// WEBSITE-ONE
//app.js

import React, {Component} from 'react';
import {hot} from 'react-hot-loader';
import HelloWorld from './components/hello-world';
import {ExternalComponent} from 'webpack-external-import'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    import('http://localhost:3002/importManifest.js').then(() => {
      this.setState({manifestLoaded: true})
      import(/* importUrl */'http://localhost:3002/' + window.entryManifest['website-two']['hello-world.js']).then(({someModule}) => {
        console.log('got module, will render it in 2 seconds')
        someModule.externalFunction()
        setTimeout(() => {
          this.setState({loaded: true})

        }, 2000)
      });
    })
  }

  renderDynamic = () => {
    const {loaded} = this.state
    if (!loaded) return null
    return this.state.loaded && __webpack_require__('someModule').default()
  }

  render() {
    const {manifestLoaded} = this.state
    const helloWorldUrl = manifestLoaded && 'http://localhost:3002/' + window.entryManifest['website-two']['Title.js']

    return (
      <div>
        <HelloWorld/>
        { manifestLoaded && <ExternalComponent src={import(/* importUrl */ helloWorldUrl)} module="TitleComponent" export='Title' title={'Some Heading'}/>}
        {this.renderDynamic()}
      </div>
    )
  }
}

export default App

//WEBSITE-TWO
//App.js
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      component: null
    };
  }

  componentDidMount() {
    // Easy way to code-split files you want to use on other applications
    // I also rename the chunk with webpackChunkName, so I can reference it by a custom name in window.entryManifest
    import(/* webpackChunkName: "Title"*/ './components/Title');
    import(/* webpackChunkName: "hello-worl-chunk"*/ './components/hello-world').then((HelloWorld) => {
      this.setState({component: HelloWorld.default})
    })
  }

  render() {
    if (!this.state.component) return <div/>
    const {component: HelloWorld} = this.state
    return <HelloWorld title="Hello from React webpack"/>;

  }
}

export default hot(module)(App);

// Title.js

import React from 'react';

export const Title = ({title}) => {
  return (<h1>{title}</h1>)
}


/*externalize:TitleComponent*/


```

## Options

### **Webpack Plugin**
```js
   new URLImportPlugin({
      manifestName: 'unknown-project', //default
      fileName: 'importManifest.js', // default
      publicPath: null,
      basePath: ''
    })
```

### **ExternalComponent**
React Component

#### **Props**:

**`src`: string** - Import source URL

**`module`: string** - Module name, must match what was declared using /*externalize:ExampleModule*/

**`export`: string** - The named export to use as a component from module being imported


#### Usage
```js
<ExternalComponent src={import(/* importUrl */ helloWorldUrl)} module="ExampleModule" export='Title' title={'Some Heading'}/>
```

## DEMO
How to start (using the demo)

1) `npm install` then `cd manual; npm install`
2) `npm run manual` from the root directory

This will run the compile command to build a new copy of the plugin, as well as start the little manual [demo project](https://github.com/ScriptedAlchemy/webpack-external-import/tree/master/manual)

