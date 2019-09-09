import React, { Component } from 'react';
import { ExternalComponent } from '../../../index';
import HelloWorld from './components/goodbye-world';
import corsImport from "../../../src/corsImport";

import('moment');
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    corsImport(/* webpackIgnore:true */'http://localhost:3002/importManifest.js').then(() => {
      this.setState({ manifestLoaded: true });
      import(/* webpackIgnore:true */`http://localhost:3002/${window.entryManifest['website-two']['SomeExternalModule.js']}`).then(() => {
        console.log('got module, will render it in 2 seconds');
        setTimeout(() => {
          this.setState({ loaded: true });
        }, 2000);
      });
    });
  }

  renderDynamic = () => {
    const { loaded } = this.state;
    if (!loaded) return null;

    return __webpack_require__('SomeExternalModule').default();
  }

  render() {
    const { manifestLoaded } = this.state;
    const helloWorldUrl = manifestLoaded && `http://localhost:3002/${window.entryManifest['website-two']['TitleComponent.js']}`;

    return (
      <div>
        <HelloWorld />
        { manifestLoaded && <ExternalComponent src={helloWorldUrl} module="TitleComponent" export="Title" title="Some Heading" />}
        {this.renderDynamic()}
      </div>
    );
  }
}

export default App;
