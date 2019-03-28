import React, { Component } from 'react';
import SomeComponent from './someDir/SomeComponent';

const WrappedTest = (props, state, actions) => {
  return React.createElement("div", null, state.title);
};

const Test = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond(module.id)
      return WrappedTest(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

const WrappedTestTwo = (props, state, actions) => {
  return React.createElement("div", null, state.title);
};

const TestTwo = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond(module.id)
      return WrappedTestTwo(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

const WrappedTestThree = () => React.createElement("button", {
  onClick: () => dispatch({
    type: 'fake',
    payload: 'nothin'
  })
}, "test");

const TestThree = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond(module.id)
      return WrappedTestThree(props, state, _Remixx.bindActionCreators(dispatch, actions))
};
export { Test, TestTwo, TestThree };