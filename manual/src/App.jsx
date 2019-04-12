import React, { Component } from 'react';
import { hot } from 'react-hot-loader';
import HelloWorld from './components/hello-world';

import('http://localhost:8080/importManifest.js')
import(/* importUrl */'http://localhost:8080/' + window.entryManifest['demo-build']['other.js']).then(({ fakemodule }) => {
  console.log(fakemodule);
  fakemodule.default();
});

const withCleanup = answer => {
  ReactDOM.unmountComponentAtNode(modal);
  document.body.removeChild(modal);
  if (!answer) {
    const save = global.saveChanges();
    if (save instanceof Promise) {
      save
        .then(() => {
          callback(true);
        })
        .catch(() => {
          callback(false);
        });
    }
  }
  callback(answer);
};

//import('./utils').then(console.log)
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
