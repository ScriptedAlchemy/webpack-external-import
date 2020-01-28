import React, { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import "./polyfill";

const v2Effect = (props, importPromise, setComponent) => {
  const { interleave, export: exportName } = props;
  interleave
    .then(module => {
      console.log("MODULE", module);
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
    v2Effect(props, importPromise, setComponent);
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
  // eslint-disable-next-line react/require-default-props
  src: requiredPropsCheck,
  // eslint-disable-next-line react/require-default-props
  interleave: requiredPropsCheck,
  cors: PropTypes.bool,
  export: PropTypes.string
};

ExternalComponent.defaultProps = {
  cors: false,
  export: null
};

export default ExternalComponent;
