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
}

// Creates the global state with initial values.
export function initializeState(): State {
  return {
    authState: AuthState.PENDING,
    lastActivityMs: Date.now(),
    sidebarVisible: true,
  };
}
