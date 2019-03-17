import React, { Component } from 'react';

const Test = () => {
  const state = useReduxState();
  const dispatch = useReduxDispatch();
  return React.createElement("button", {
    onClick: () => dispatch({
      type: 'fake',
      payload: 'nothin'
    })
  }, "test");
};

class TestTwo extends Component {
  render() {
    const state = useReduxState();
    const dispatch = useReduxDispatch();
    return React.createElement("button", {
      onClick: () => dispatch({
        type: 'fake',
        payload: 'nothin'
      })
    }, "test");
  }

}

;

const TestThree = () => React.createElement("button", {
  onClick: () => dispatch({
    type: 'fake',
    payload: 'nothin'
  })
}, "test");

export { TestTwo, Test, TestThree };