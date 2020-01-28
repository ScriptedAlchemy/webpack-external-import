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

import("moment");
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      titleUrl: null,
      manifestLoaded: false,
      loaded: false
    };
  }

  // componentDidMount() {
  //   __webpack_require__
  //     .interleaved("website-3/TitleComponentWithCSSFile")
  //     .then(() => __webpack_require__("TitleComponentWithCSSFile"))
  // }

  renderDynamic = () => {
    const { loaded } = this.state;
    if (!loaded) return null;
    return __webpack_require__("SomeExternalModule").default();
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
          module="TitleComponent"
          title="Some Heading"
        />

        <ExternalComponent
          interleave={__webpack_require__
            .interleaved("website-3/TitleComponentWithCSSFile")
            .then(() => __webpack_require__("TitleComponentWithCSSFile"))}
          module="TitleComponentWithCSSFile"
          export="Title"
          title="Title Component With CSS File Import"
        />
        {this.renderDynamic()}
      </div>
    );
  }
}

export default App;
