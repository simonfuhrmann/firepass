import {StateManager, StateListener as StateListenerT} from './state-manager';
import {DbState} from '../database/database';

// State of the user authentication.
export enum AuthState {
  PENDING,
  ERROR,
  SIGNED_OFF,
  SIGNED_ON,
}

// Database view after authentication.
export enum DbView {
  DATABASE_STATE,
  CHANGE_PASSWORD,
  CHANGE_CRYPTO,
}

// Declaration of the global state structure.
export interface State {
  authState: AuthState;
  dbView: DbView;
  dbState: DbState;
  lastActivityMs: number;
  sidebarVisible: boolean;
}

// Creates the global state with initial values.
export function getInitialState(): State {
  return {
    authState: AuthState.PENDING,
    dbView: DbView.DATABASE_STATE,
    dbState: DbState.INITIAL,
    lastActivityMs: Date.now(),
    sidebarVisible: true,
  };
}

export const stateManager = new StateManager(getInitialState());
export type StateListener = StateListenerT<State>;
