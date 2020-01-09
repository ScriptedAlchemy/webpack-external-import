import React, { Component } from 'react';
import {
  ExternalComponent, corsImport, getChunkPath, getChunkDependencies, importDependenciesOf,
} from 'webpack-external-import';
import HelloWorld from './components/goodbye-world';

import('moment');
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      titleUrl: null,
      manifestLoaded: false,
      loaded: false,
    };
  }

  componentDidMount() {
    corsImport('http://localhost:3002/importManifest.js').then(() => {
      this.setState({ manifestLoaded: true });
      importDependenciesOf('http://localhost:3002/', 'website-two', 'TitleComponent').then((url) => {
        this.setState({ titleUrl: url });
      });

      import(/* webpackIgnore:true */getChunkPath('http://localhost:3002', 'website-two', 'SomeExternalModule.js')).then(() => {
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
    console.log(__webpack_require__('SomeExternalModule'));
    return __webpack_require__('SomeExternalModule').default();
  }

  render() {
    const { manifestLoaded, titleUrl } = this.state;
    if (!manifestLoaded) {
      return 'Loading...';
    }


    return (
      <div>
        <HelloWorld />
        {titleUrl && <ExternalComponent src={titleUrl} module="TitleComponent" export="Title" title="Some Heading" />}
        {this.renderDynamic()}
      </div>
    );
  }
}

export default App;
