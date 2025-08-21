import {AuthState, DbView, State, stateManager} from './state-types';
import {DbState} from '../database/database';

// Sets the user authentication state.
export function setAuthState(authState: AuthState) {
  const action = (state: State) => {
    if (state.authState === authState) return state;
    return {...state, authState};
  };
  stateManager.processAction(action);
}

// Sets the database view.
export function setDbView(dbView: DbView) {
  const action = (state: State) => {
    if (state.dbView === dbView) return state;
    return {...state, dbView};
  };
  stateManager.processAction(action);
}

// Sets the database state.
export function setDbState(dbState: DbState) {
  const action = (state: State) => {
    if (state.dbState === dbState) return state;
    return {...state, dbState};
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
