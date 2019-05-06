import React, {Component} from 'react';
import {hot} from 'react-hot-loader';
import HelloWorld from './components/goodbye-world';
import {ExternalComponent} from 'webpack-external-import'

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    import('http://localhost:3002/importManifest.js').then(() => {
      this.setState({manifestLoaded: true})
      import(/* importUrl */'http://localhost:3002/' + window.entryManifest['website-two']['hello-world.js']).then(({someModule}) => {
        console.log('got module, will render it in 2 seconds')
        someModule.externalFunction()
        setTimeout(() => {
          this.setState({loaded: true})

        }, 2000)
      });
    })
  }

  renderDynamic = () => {
    const {loaded} = this.state
    if (!loaded) return null
    return this.state.loaded && __webpack_require__('someModule').default()
  }

  render() {
    const {manifestLoaded} = this.state
    const helloWorldUrl = manifestLoaded && 'http://localhost:3002/' + window.entryManifest['website-two']['Title.js']

    return (
      <div>
        <HelloWorld/>
        { manifestLoaded && <ExternalComponent src={import(/* importUrl */ helloWorldUrl)} module="TitleComponent" export='Title' title={'Some Heading'}/>}
        {this.renderDynamic()}
      </div>
    )
  }
}

export default App
