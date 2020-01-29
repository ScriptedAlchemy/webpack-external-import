import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

const v2Effect = (props, setComponent) => {
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
  const { interleave, export: exportName, cors, ...rest } = props;
  const [{ Component }, setComponent] = useState({ Component: null });

  useEffect(() => {
    v2Effect(props, setComponent);
  }, []);
  if (!Component) {
    return null;
  }
  // eslint-disable-next-line react/jsx-props-no-spreading
  return <Component {...rest} />;
};

ExternalComponent.propTypes = {
  interleave: PropTypes.object.isRequired,
  cors: PropTypes.bool,
  export: PropTypes.string
};

ExternalComponent.defaultProps = {
  cors: false,
  export: null
};

export default ExternalComponent;
