import React, {
   useCallback, useEffect, useState,
} from 'react';
import PropTypes from 'prop-types';
import './polyfill';

const ExternalComponent = (props) => {
  const {
    src, module, export: exportName, cors, ...rest
  } = props;
  const [loaded, setLoaded] = useState(false);
  const [Component, setComponent] = useState({component: null});
  const importPromise = useCallback(
    () => {
      const isPromise = src instanceof Promise;
      if (!src) return Promise.reject();
      if (props.cors) {
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
    },
    [src, cors],
  );

  useEffect(() => {
    require('./polyfill');
    if (!src) {
      throw new Error(`dynamic-import: no url ${JSON.stringify(props, null, 2)}`);
    }

    importPromise(src).then(() => {
      // patch into loadable
      if (window.__LOADABLE_LOADED_CHUNKS__) {
        window.webpackJsonp.forEach((item) => {
          window.__LOADABLE_LOADED_CHUNKS__.push(item);
        });
      }
      const requiredComponent = __webpack_require__(module);
      const component = requiredComponent.default ? requiredComponent.default : requiredComponent[exportName];
      setComponent({component});
      setLoaded(true);
    }).catch((e) => {
      throw new Error(`dynamic-import: ${e.message}`);
    });
  }, []);

  if (!Component.component) return null;
  return (
    <Component.component {...rest} />
  );
};

ExternalComponent.propTypes = {
  src: PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.string]).isRequired,
  module: PropTypes.string.isRequired,
  cors: PropTypes.bool,
  export: PropTypes.string,
};

export default ExternalComponent;
