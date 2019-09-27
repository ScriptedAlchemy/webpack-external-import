import React, { Component } from 'react';
import {
  ExternalComponent,
  corsImport,
  getChunkPath,
  importWithDependencies,
} from 'webpack-external-import';
import HelloWorld from './components/goodbye-world';

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
          <ExternalComponent
            src={importWithDependencies('http://localhost:3002', 'website-two', 'TitleComponent')}
            module="TitleComponent"
            export="Title"
            title="Some Heading"
          />
          {this.renderDynamic()}
        </div>
      );
    }
}

export default App;
