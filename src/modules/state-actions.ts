import {State, AuthState} from './state-types';
import {stateManager} from './state-manager';

// Sets the user authentication state.
export function setAuthState(authState: AuthState) {
  const action = (state: State) => {
    if (state.authState === authState) return state;
    return {...state, authState};
  };
  stateManager.processAction(action);
}

// Sets the last user activity for determining the idle timeout.
export function setLastActivityMs(lastActivityMs: number) {
  const action = (state: State) => {
    if (state.lastActivityMs === lastActivityMs) return state;
    return {...state, lastActivityMs};
  };
  stateManager.processAction(action);
}
