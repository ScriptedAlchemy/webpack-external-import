import React, { Component } from 'react';
import SomeComponent from './someDir/SomeComponent';

const Test = (props, state, actions) => <div>{state.title}</div>;

const TestTwo = (props, state, actions) => <div>{state.title}</div>;


const TestThree = () => (
  <button onClick={() => dispatch({
    type: 'fake',
    payload: 'nothin',
  })}
  >test
  </button>
);


export { Test, TestTwo, TestThree };
