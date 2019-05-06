import React, {Component} from 'react';
import {hot} from 'react-hot-loader';


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
