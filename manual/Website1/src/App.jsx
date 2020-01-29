import React, { Component } from "react";
import {
  ExternalComponent,
  corsImport,
  getChunkPath,
  getChunkDependencies,
  importDependenciesOf
} from "webpack-external-import";
import HelloWorld from "./components/goodbye-world";
import "react-select";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      titleUrl: null,
      manifestLoaded: false,
      loaded: false
    };
  }

  componentDidMount() {
    __webpack_require__
      .interleaved("website-3/TitleComponentWithCSSFile")
      .then(() => __webpack_require__("TitleComponentWithCSSFile"))
  }

  renderDynamic = () => {
    const { loaded } = this.state;
    if (!loaded) return null;
    console.log(__webpack_require__("SomeExternalModule"))
  };

  render() {
    return (
      <div>
        <HelloWorld />

        <ExternalComponent
          interleave={__webpack_require__
            .interleaved("website-2/TitleComponent")
            .then(() => __webpack_require__("TitleComponent"))}
          export="Title"
          title="Some Heading"
        />

        <ExternalComponent
          interleave={__webpack_require__
            .interleaved("website-3/TitleComponentWithCSSFile")
            .then(() => __webpack_require__("TitleComponentWithCSSFile"))}
          export="Title"
          title="Title Component With CSS File Import"
        />
        {this.renderDynamic()}
      </div>
    );
  }
}

export default App;
