import {
  ReduxProvider,
  useReduxDispatch,
  useReduxState,
  useReduxStateSimple,
} from 'remixx';
import { bindActionCreators } from 'redux';

const useReduxActions = () => {
  console.log('actionsGoHere');
};

const useRespond = (module) => {

  return {
    state: useReduxState(),
    actions: useReduxActions()
  };
};

export default {
  ReduxProvider,
  useReduxDispatch,
  useReduxState,
  useReduxStateSimple,
  useReduxActions,
  bindActionCreators,
  useRespond
};
