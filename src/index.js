import React, { Component } from 'react';
import PropTypes from 'prop-types';

if (!window.import) {
  window.import = require('dimport/legacy');
}
class ExternalComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };

    this.Component = null;
  }


  componentDidMount() {
    const { src, module, export: exportName } = this.props;
    new Promise((resolve) => {
      resolve(new Function(`return import("${src}")`)());
    }).then(() => {
      console.log('made it this far', module);
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
    if (!loaded) return null;

    const { src, module, ...rest } = this.props;
    return (
      <Component {...rest} />
    );
  }
}

export { ExternalComponent };

ExternalComponent.propTypes = {
  src: PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.string]).isRequired,
  module: PropTypes.string,
};
