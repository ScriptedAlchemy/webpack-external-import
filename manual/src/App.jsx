import React, {Component} from 'react';
import {hot} from 'react-hot-loader';
import HelloWorld from './components/hello-world';

import('http://localhost:8080/importManifest.js').then(() => {
  import(/* importUrl */'http://localhost:8080/' + window.entryManifest['demo-build']['other.js']).then(({externalFunction}) => {
    console.log('Webpack Modules:',__webpack_modules__);
    console.log('Require Statement:',__webpack_require__('externalFunction'))
    __webpack_require__('externalFunction').default()
  });
})


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return <HelloWorld title="Hello from React webpack"/>;
  }
}

export default hot(module)(App);
