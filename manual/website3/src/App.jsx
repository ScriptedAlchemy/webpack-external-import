import React, { Component } from "react";
import { hot } from "react-hot-loader";
import { Title } from "./components/Title";
import "./other.css";
class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      component: null
    };
  }

  componentDidMount() {
    import("./components/hello-world").then(HelloWorld => {
      this.setState({ component: HelloWorld.Test });
    });
  }

  render() {
    if (!this.state.component) return null;
    const { component: HelloWorld } = this.state;
    return <Title title="Hello, from website3" />;
  }
}

export default hot(module)(App);
