import React, { Component } from "react";
import { ExternalComponent } from "webpack-external-import";
import HelloWorld from "./components/goodbye-world";
import "react-select";
import { Form } from "tiny-mobx-form";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      titleUrl: null,
      manifestLoaded: false,
      loaded: false
    };

    console.log("Tree Shake Form", Form);
  }

  // componentDidMount() {
  //   setTimeout(() => {
  //     console.log("Tree Shake Form", Form);
  //   }, 3000);
  //   __webpack_require__
  //     .interleaved("website-3/TitleComponentWithCSSFile")
  //     .then(() => __webpack_require__("TitleComponentWithCSSFile"));
  // }

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

        {/*<ExternalComponent*/}
        {/*  interleave={__webpack_require__*/}
        {/*    .interleaved("website-3/TitleComponentWithCSSFile")*/}
        {/*    .then(() => __webpack_require__("TitleComponentWithCSSFile"))}*/}
        {/*  export="Title"*/}
        {/*  title="Title Component With CSS File Import"*/}
        {/*/>*/}
      </div>
    );
  }
}

export default App;
