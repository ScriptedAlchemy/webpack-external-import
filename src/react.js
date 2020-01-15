import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./polyfill";

const v1Effect = (props, importPromise, setComponent) => {
  require("./polyfill");
  const { src, export: exportName } = props;
  if (!src) {
    throw new Error(
      `dynamic-import: no url, props: ${JSON.stringify(props, null, 2)}`
    );
  }

  importPromise(src)
    .then(() => {
      // patch into loadable
      if (window.__LOADABLE_LOADED_CHUNKS__) {
        window.webpackJsonp.forEach(item => {
          window.__LOADABLE_LOADED_CHUNKS__.push(item);
        });
      }
      const requiredComponent = __webpack_require__(module);
      const Component = requiredComponent.default
        ? requiredComponent.default
        : requiredComponent[exportName];
      setComponent({ Component });
    })
    .catch(e => {
      throw new Error(`interleaving: ${e}`);
    });
};
const v2Effect = (props, importPromise, setComponent) => {
  const { interleave, export: exportName } = props;
  interleave
    .then(module => {
      const Component = module.default ? module.default : module[exportName];
      setComponent({ Component });
    })
    .catch(e => {
      throw new Error(`interleaving: ${e}`);
    });
};
const ExternalComponent = props => {
  const { interleave, src, module, export: exportName, cors, ...rest } = props;
  const [{ Component }, setComponent] = useState({ Component: null });
  const importPromise = useCallback(() => {
    const isPromise = src instanceof Promise;
    const interLeavePromise = src instanceof Promise;

    if (!interLeavePromise) {
      if (!src) return Promise.reject();

      if (props.cors) {
        if (isPromise) {
          return src.then(src => require("./corsImport").default(src));
        }
        return require("./corsImport").default(src);
      }

      if (isPromise) {
        return src.then(
          src =>
            new Promise(resolve => {
              resolve(new Function(`return import("${src}")`)());
            })
        );
      }
      return new Promise(resolve => {
        resolve(new Function(`return import("${src}")`)());
      });
    }
  }, [src, cors, interleave]);

  useEffect(() => {
    if (!interleave) {
      v1Effect(props, importPromise, setComponent);
    } else {
      v2Effect(props, importPromise, setComponent);
    }
  }, []);
  if (!Component) {
    return null;
  }
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...rest} />;
};

const requiredPropsCheck = (props, propName, componentName) => {
  if (!props.interleave && !props.src) {
    return new Error(
      `One of 'interleave' or 'src' is required by '${componentName}' component.`
    );
  }
};

ExternalComponent.propTypes = {
  src: requiredPropsCheck,
  interleave: requiredPropsCheck,
  module: PropTypes.string.isRequired,
  cors: PropTypes.bool,
  export: PropTypes.string
};

ExternalComponent.defaultProps = {
  cors: false,
  export: null
};

export default ExternalComponent;
