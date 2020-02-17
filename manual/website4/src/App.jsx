import React, { Component } from "react";
import { hot } from "react-hot-loader";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      Component: null
    };
  }

  componentDidMount() {
    import("websiteTwo/Title").then(Module => {
      console.log( Module.Title );
      this.setState({ Component: Module.Title });
    });
  }

  render() {
    console.log('render', this.state)
    if (this.state.Component) {
      const Com = this.state.Component;
      console.log(Com)
      return <Com />;
    }
    return "website 4";
  }
}

export default hot(module)(App);
