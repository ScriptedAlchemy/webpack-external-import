import React from 'react';
import ReactDOM from 'react-dom';
import App from './App.jsx';

const externalFunction = () => {
  console.log('some function thats externalized')
};

/*externalize: externalFunction*/

export default externalFunction;

ReactDOM.render(<App />, document.getElementById('app'));
