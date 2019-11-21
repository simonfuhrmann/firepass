import {State} from './state-types';
import {stateManager} from './state-manager';

// Sets the last user activity for determining the idle timeout.
export function setLastActivityMs(lastActivityMs: number) {
  const action = (state: State) => {
    if (state.lastActivityMs === lastActivityMs) return state;
    return {...state, lastActivityMs};
  };
  stateManager.processAction(action);
}
