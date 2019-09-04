import React, { Component } from 'react';
import('https://code.jquery.com/jquery-3.3.1.min.js');

const Test = (props, state, actions) => <div>{state.title}</div>;

const TestTwo = (props, state, actions) => {
  console.log('peace redux');
  return (<div>{state.title}</div>);
};

export const externalFunction = () => {
  window.wasExternalFunctionCalled = true;

  console.log('some function thats externalized')
};

/*externalize: SomeExternalModule */

const TestThree = (props, state, actions) => (
  <button onClick={() => dispatch({
    type: 'fake',
    payload: 'nothin',
  })}
  >test
  </button>
);

function TestFour(props, state, actions) {
  return (<div>testin</div>);
}

const TestFive = function (props, state, actions) {
  return (<div>testn</div>);
};


export { Test, TestTwo, TestThree };

export default (props) => {
  // const timeStamp = moment()
  return (<div>This component was dynamically loaded</div>);
}


