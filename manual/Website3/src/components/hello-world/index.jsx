import React, { Component } from 'react';
import Title from '../Title'

const Test = props => <div>{props.title}</div>;

const TestTwo = (props, state, actions) => (<div>{state.title}</div>);

export const externalFunction = () => {
    console.log(Title.constructor)
  window.wasExternalFunctionCalled = true;
  console.log('some function thats externalized');
};


const TestThree = (props, state, actions) => (
  <button onClick={() => dispatch({
    type: 'fake',
    payload: 'nothin',
  })}
  >
test
  </button>
);


function TestFour(props, state, actions) {
  return (<div>testin</div>);
}

export const TestFive = function (props, state, actions) {
  return (<div>testn</div>);
};


export { Test, TestTwo, TestThree };

export default props => (<div>This component was dynamically loaded</div>);
