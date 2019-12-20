import {State, AuthState, getInitialState} from './state-types';
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

// Sets whether the sidebar is visible in mobile mode.
export function setSidebarVisible(sidebarVisible: boolean) {
  const action = (state: State) => {
    if (state.sidebarVisible === sidebarVisible) return state;
    return {...state, sidebarVisible};
  };
  stateManager.processAction(action);
}

// Shows the change password form when database is locked.
export function setChangePassword(changePassword: boolean) {
  const action = (state: State) => {
    if (state.changePassword === changePassword) return state;
    return {...state, changePassword};
  };
  stateManager.processAction(action);
}

// Resets the application state, except for the authentication state.
export function resetAppState() {
  const action = (state: State) => {
    const initialState = getInitialState();
    return {...initialState, authState: state.authState};
  };
  stateManager.processAction(action);
}
