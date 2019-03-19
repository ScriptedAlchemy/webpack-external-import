import _Remixx from "remixx";
import React, { Component } from 'react';

const WrappedTest = (props, state, actions) => {
  return React.createElement("div", null, state.title);
};

const Test = (props) => {
      const state = _Remixx.useReduxState();
      const dispatch = _Remixx.useReduxDispatch();
      const actions = _Remixx.useReduxActions();
     
      return WrappedTest(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

const WrappedTestTwo = (props, state, actions) => {
  return React.createElement("div", null, state.title);
};

const TestTwo = (props) => {
      const state = _Remixx.useReduxState();
      const dispatch = _Remixx.useReduxDispatch();
      const actions = _Remixx.useReduxActions();
     
      return WrappedTestTwo(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

const WrappedTestThree = () => React.createElement("button", {
  onClick: () => dispatch({
    type: 'fake',
    payload: 'nothin'
  })
}, "test");

const TestThree = (props) => {
      const state = _Remixx.useReduxState();
      const dispatch = _Remixx.useReduxDispatch();
      const actions = _Remixx.useReduxActions();
     
      return WrappedTestThree(props, state, _Remixx.bindActionCreators(dispatch, actions))
};
export { Test, TestTwo, TestThree };