// Declaration of the global state structure.
export interface State {
  lastActivityMs: number;
}

// Creates the global state with initial values.
export function initializeState(): State {
  return {
    lastActivityMs: Date.now(),
  };
}
