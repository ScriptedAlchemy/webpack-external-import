import React, { Component } from "react";
import { hot } from "react-hot-loader";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      component: null
    };
  }

  componentDidMount() {
    import("websiteTwo/Title");
  }

  render() {
    return "website 4";
  }
}

export default hot(module)(App);
