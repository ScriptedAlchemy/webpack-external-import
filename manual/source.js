import React, { Component } from 'react';
import SomeComponent from './someDir/SomeComponent';

const Test = (props, state, actions) => <div>{state.title}</div>;

const TestTwo = (props, state, actions) => {
  console.log('peace redux')
  return (<div>{state.title}</div>)
};


const TestThree = (props, state, actions) => (
  <button onClick={() => dispatch({
    type: 'fake',
    payload: 'nothin',
  })}
  >test
  </button>
);

function TestFour(props, state, actions) {
  return (<div>testin</div>)
}

const TestFive = function(props, state, actions) {
  return (<div>testn</div>)
}


export { Test, TestTwo, TestThree };
