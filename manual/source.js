import React, { Component } from 'react';

const Test = (props, state, actions) => {
  return <div>{state.title}</div>;
};

const TestTwo = (props, state, actions) => {
  return <div>{state.title}</div>;
};


const TestThree = () => (
  <button onClick={() => dispatch({
    type: 'fake',
    payload: 'nothin'
  })}>test</button>
);


export { Test, TestTwo, TestThree };
