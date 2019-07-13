import React, { Component } from 'react';
import PropTypes from 'prop-types';
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
    const { src, module, export: exportName } = this.props;
    src.then(() => {
      console.log(__webpack_modules__);
      const requiredComponent = __webpack_require__(module);
      console.log('required', requiredComponent);
      this.Component = requiredComponent.default ? requiredComponent.default : requiredComponent[exportName];
      this.setState({ loaded: true });
    }).catch((e) => {
      console.log(e.prototype);
    });
  }

  render() {
    const Component = this.Component;
    const { loaded } = this.state;
    if (!loaded) return <span>loading</span>;

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
