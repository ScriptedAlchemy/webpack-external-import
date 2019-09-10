import React, { Component } from 'react';
import PropTypes from 'prop-types';
import "./polyfill";

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
        if (this.props.cors) {
            return require('./corsImport').default(src);
        }

        return new Promise((resolve) => {
            resolve(new Function(`return import("${src}")`)());
        });
    }

    componentDidMount() {
        const { src, module, export: exportName } = this.props;

        console.log(this.importPromise);
        this.importPromise(src).then(() => {
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

ExternalComponent.propTypes = {
    src: PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.string]).isRequired,
    module: PropTypes.string,
};

export default ExternalComponent
