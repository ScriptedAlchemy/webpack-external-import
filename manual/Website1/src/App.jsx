import React, {Component} from 'react';
import {hot} from 'react-hot-loader';
import HelloWorld from './components/goodbye-world';


class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    import('http://localhost:3002/importManifest.js').then(() => {
      import(/* importUrl */'http://localhost:3002/' + window.entryManifest['website-two']['hello-world.js']).then(({someFunction}) => {
        // console.log('Webpack Modules:',__webpack_modules__);
        console.log('got module, will render it in 2 seconds')
        someFunction.externalFunction()
        setTimeout(() => {
          this.setState({loaded: true})

        }, 2000)
      });
    })

  }

  render() {

    if (this.state.loaded) {
      return __webpack_require__('someFunction').default()
    }
    return <HelloWorld/>;
  }
}

export default App
