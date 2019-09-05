import React, { Component } from 'react';
import PropTypes from 'prop-types';
import dimport from 'dimport/legacy';
import scout from './scout';

class ExternalComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };

    this.Component = null;
  }

  componentDidMount() {
    if (!window.import) {
      window.import = dimport;
    }
    const { src, module, export: exportName } = this.props;
    import(/* webpackIgnore: true */src).then(() => {
      const requiredComponent = __webpack_require__(module);
      this.Component = requiredComponent.default ? requiredComponent.default : requiredComponent[exportName];
      this.setState({ loaded: true });
    }).catch((e) => {
      throw new Error(`dynamic-import:${e.message}`);
    });
  }

  render() {
    const { Component } = this;
    const { loaded } = this.state;
    if (!loaded) return null

    const { src, module, ...rest } = this.props;
    return (
      <Component {...rest} />
    );
  }
}

export { ExternalComponent };

ExternalComponent.propTypes = {
  src: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  module: PropTypes.string,
};
export default scout;
