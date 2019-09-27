import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './polyfill';

class ExternalComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };
    this.importPromise = this.importPromise.bind(this);
    this.Component = null;
  }

  importPromise(src) {
    if (!src) {
      return new Promise((resolve, reject) => {
        reject();
      });
    }
    if (this.props.cors) {
      return require('./corsImport').default(src);
    }

    return new Promise((resolve) => {
      resolve(new Function(`return import("${src}")`)());
    });
  }

  componentDidCatch() {
    throw new Error('ExternalComponent: You might be missing dependencies. Try using passing importWithDependencies() as the src props');
  }

  componentDidMount() {
    require('./polyfill');

    const { src, module, export: exportName } = this.props;
    if (!src) {
      throw new Error(`dynamic-import: no url ${JSON.stringify(this.props, null, 2)}`);
    }

    this.importPromise(src).then(() => {
      const requiredComponent = __webpack_require__(module);
      this.Component = requiredComponent.default ? requiredComponent.default : requiredComponent[exportName];
      this.setState({ loaded: true });
    }).catch((e) => {
      throw new Error(`dynamic-import: ${e.message}`);
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

ExternalComponent.propTypes = {
  src: PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.string]).isRequired,
  module: PropTypes.string,
  cors: PropTypes.bool,
};

export default ExternalComponent;
