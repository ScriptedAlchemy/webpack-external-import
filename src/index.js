import {
  ReduxProvider,
  useReduxDispatch,
  useReduxState,
  useReduxStateSimple,
} from 'remixx';
import {bindActionCreators} from 'redux'
const useReduxActions = () => {
  console.log('actionsGoHere')
}

export default {
  ReduxProvider,
  useReduxDispatch,
  useReduxState,
  useReduxStateSimple,
  useReduxActions,
  bindActionCreators
};
