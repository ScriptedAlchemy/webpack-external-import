import React, {Component} from 'react';
import {hot} from 'react-hot-loader';
import HelloWorld from './components/goodbye-world';

import('http://localhost:3002/importManifest.js').then(() => {
  import(/* importUrl */'http://localhost:3002/' + window.entryManifest['website-two']['hello-world.js']).then(() => {
  console.log('Webpack Modules:',__webpack_modules__);
    // console.log(externalFunction)
    const resolvesd =  __webpack_require__('someFunction');
resolvesd.externalFunction()
    // externalFunction()
    // console.log('Require Statement:',__webpack_require__('externalFunction'))
    //   __webpack_require__('externalFunction').default()
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

export default App
