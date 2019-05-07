# Webpack Scout

#### This is currently under active development, but stable
**On npm as webpack-external-import@0.0.1-beta.7**

## What it does?

This tool will allow you to `import()` external modules from other webpack builds, CDNs, or files hosted elsewhere, as if they were part of your current application the whole time. 

#### Why would you want to do this?
- Remove code duplication from multiple apps
- Implementation of micro-frontend architecture. Where each frontend is able to operate standalone, causing general code duplication when moving to another micro-frontend (MFE). 
- If you want to have multiple webpack builds work as if they were bundeled together. SPA on the frontend, multiple webpack builds on the back
- You want to manage common js / vendor files automatically. This is useful, instead of dealing with peer dependencies, externals, or anything else. You can just load the component from a remote source. 
- LOSA Style frontend architecture: When you run multiple apps on a single page.
- Want to load components over the wire

## Basic Setup
```bash
npm install webpack-external-import --save
```

**The basic setup will allow you to import URLs**

For example: `import('https://code.jquery.com/jquery-3.3.1.min.js');`

Add the babel plugin to you're babelrc. `webpack-external-import/babel`

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

## Advanced Setup - frontend orchestration - Micro Frontend Architecture 
This setup allows for injection of webpack modules from another build into your build. 


**webpack.config.js**

_Make sure manifestName_ is unique per webpack build.

If you have multiple builds, they all need to have  their own manifestName
 
```js
require('webpack-external-import/inde')
{
    plugins: [
        new URLImportPlugin({
          manifestName: 'website-one'
        })
    ]
}
```

**.babelrc**
Add the babel plugin to babelrc
```json
{
    "presets": [],
    "plugins": [
        "webpack-external-import/babel",
        "@babel/plugin-syntax-dynamic-import",
    ]
}
```

## Usage
Here's some examples:
Pretend we have two separate builds - for two separate apps with their own _independent_ build

I use `externalize` to mark this module (file) so it can be consumed by another name, in this case, another client side app, should be able to retrieve this file as `ExampleModule` 

**Webpack Build 1**
```js
// title.js
// I want to use this 
import React from 'react';

export const Title = ({title}) => {
  return (<h1>{title}</h1>)
}

export const alert = (message) => {
  alert(title)
}


/*externalize:ExampleModule*/

```

**Webpack Build 2**

```js
import('http://website1.com/js/theExampleFile.js').then(({ExampleModule})=>{
  ExampleModule.alert('custom alert')
});

// What about React?

()=>{
  return (
    <ExternalComponent src={import(/* importUrl */ helloWorldUrl)} module="ExampleModule" export='Title' title={'Some Heading'}/>
  )
}
```

### The entry manifest

Each webpack build using the webpack plugin will output a manifest file to your build output directory 

The manifest is allows you to find a chunk that you want even if the name has been hashed. 

Below is an example of using the manifest.

In this file, i am importing code from another website and build. My application is loading Website 2's manifest. Which is automatically added to `window.entryManifest`, under its `manifestName` you set in the webpack plugin. After that, im importing a chunk from website-two, in this case - the chunk is code-split. 

```js
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

```

## Full Example

```js
// WEBSITE-ONE
//app.js

import React, {Component} from 'react';
import {hot} from 'react-hot-loader';
import HelloWorld from './components/goodbye-world';
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
    // I also rename the chunk with webpackChunkName, so i can reference it by a custom name in window.entryManifest
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

**Webpack Plugin**
```js
   new URLImportPlugin({
      manifestName: 'unknown-project', //default
      fileName: 'importManifest.js', // default
    })
```


## DEMO
How to start (using the demo)

1) `npm install` then `cd manual; npm install`
2) `npm run manual` from the root directory

this will run the compile command to build a new copy of the plugin as well as start the little manual demo project
