import {StateManager} from './state-manager';

// State of the user authentication.
export enum AuthState {
  PENDING,
  ERROR,
  SIGNED_OFF,
  SIGNED_ON,
}

// Declaration of the global state structure.
export interface State {
  authState: AuthState;
  lastActivityMs: number;
  sidebarVisible: boolean;
  changePassword: boolean;
}

// Creates the global state with initial values.
export function getInitialState(): State {
  return {
    authState: AuthState.PENDING,
    lastActivityMs: Date.now(),
    sidebarVisible: true,
    changePassword: false,
  };
}

export const stateManager = new StateManager(getInitialState());
