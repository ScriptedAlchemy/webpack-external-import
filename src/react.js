import React, { Component } from 'react';
import PropTypes from 'prop-types';
import './polyfill';
import { importWithDependencies, importDependenciesOf } from './index';

const ExternalComponent = (props) => {
  const { src, module, export: exportName, coors, ...rest } = props;
  let Component = null;
  const [loaded, setLoaded] = useState(false);
  
  useEffect(() => {
    require('./polyfill');
    if (!src) {
      throw new Error(`dynamic-import: no url ${JSON.stringify(props, null, 2)}`);
    }

    importPromise(src).then(() => {
      const requiredComponent = __webpack_require__(module);
      Component = requiredComponent.default ? requiredComponent.default : requiredComponent[exportName];
      setLoaded(true)
    }).catch((e) => {
      throw new Error(`dynamic-import: ${e.message}`);
    });
  }, []);
  const importPromise = useCallback(
    () => {
      if (!src) return Promise.reject();
      if (cors) {
        return require('./corsImport').default(src);
      }
      return new Promise((resolve) => {
        resolve(new Function(`return import("${src}")`)());
      });
    },
    [src, cors],
  );
  if (!loaded) return null;
  return (
    <Component {...rest} />
  )
}

ExternalComponent.propTypes = {
  src: PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.string]).isRequired,
  module: PropTypes.string,
  cors: PropTypes.bool,
};

export default ExternalComponent;
