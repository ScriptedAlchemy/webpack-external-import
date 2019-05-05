import scout from './scout';
import React, {Fragment, Component} from 'react';
import PropTypes from 'prop-types'

class ExternalComponent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false
    }

    this.Component = null
  }

  componentDidMount() {
    const {src, module, export: exportName} = this.props;

    src.then(() => {
      const requiredComponent = __webpack_require__(module)
      this.Component = requiredComponent.default ? requiredComponent.default : requiredComponent[exportName]
      this.setState({loaded: true})
    })
  }

  render() {
    const Component = this.Component
    const {loaded} = this.state
    if (!loaded) return <span>loading</span>

    const {srouce, module, ...rest} = this.props
    return (
      <Component {...rest}/>
    )
  }
}

export {ExternalComponent}

ExternalComponent.propTypes = {
  src: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  module: PropTypes.string
}
export default scout
