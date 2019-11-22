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
    const isPromise = src instanceof Promise;

    if (this.props.cors) {
      if (isPromise) {
        return src.then((src) => require('./corsImport').default(src));
      }
      return require('./corsImport').default(src);
    }
    if (isPromise) {
      return src.then((src) => new Promise((resolve) => {
        resolve(new Function(`return import("${src}")`)());
      }));
    }
    return new Promise((resolve) => {
      resolve(new Function(`return import("${src}")`)());
    });
  }

  componentDidMount() {
    require('./polyfill');

    const { src, module, export: exportName } = this.props;
    if (!src) {
      throw new Error(`dynamic-import: no url ${JSON.stringify(this.props, null, 2)}`);
    }
    window.__webpack_require__ = __webpack_require__;
    window.__webpack_modules__ = __webpack_modules__;
    this.importPromise(src).then(() => {
      window.webpackJsonp.forEach((item)=>{
        console.log(item);
        window.__LOADABLE_LOADED_CHUNKS__.push(item)
      })
      try {
        __webpack_require__(module);
        __webpack_require__(module);
        __webpack_require__(module);
      } catch (e) {
      }
      setTimeout(() => {
        const requiredComponent = __webpack_require__(module);
        console.log(requiredComponent);
        this.Component = requiredComponent.default ? requiredComponent.default : requiredComponent[exportName];
        this.setState({ loaded: true });
      }, 1000);
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
