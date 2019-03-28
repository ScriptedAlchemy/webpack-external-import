import _Remixx from "remixx";
import React, { Component } from 'react';
import SomeComponent from './someDir/SomeComponent';

const WrappedTest = (props, state, actions) => React.createElement("div", null, state.title);

const Test = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond('__respond_pending_chunk_id__')
      return WrappedTest(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

const WrappedTestTwo = (props, state, actions) => {
  console.log('peace redux');
  return React.createElement("div", null, state.title);
};

const TestTwo = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond('__respond_pending_chunk_id__')
      return WrappedTestTwo(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

const WrappedTestThree = (props, state, actions) => React.createElement("button", {
  onClick: () => dispatch({
    type: 'fake',
    payload: 'nothin'
  })
}, "test");

const TestThree = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond('__respond_pending_chunk_id__')
      return WrappedTestThree(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

function WrappedTestFour(props, state, actions) {
  return React.createElement("div", null, "testin");
}

const TestFour = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond('__respond_pending_chunk_id__')
      return WrappedTestFour(props, state, _Remixx.bindActionCreators(dispatch, actions))
};

const WrappedTestFive = function (props, state, actions) {
  return React.createElement("div", null, "testn");
};

const TestFive = (props) => {
      const dispatch = _Remixx.useReduxDispatch();
       const { state, actions } = _Remixx.useRespond('__respond_pending_chunk_id__')
      return WrappedTestFive(props, state, _Remixx.bindActionCreators(dispatch, actions))
};
export { Test, TestTwo, TestThree, TestFour, TestFive };
