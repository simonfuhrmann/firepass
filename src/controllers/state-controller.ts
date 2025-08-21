import {ReactiveController, ReactiveControllerHost} from 'lit';

import {State, stateManager} from '../modules/state-types';

// The host must implement stateChanged() method.
export interface StateAwareHost extends ReactiveControllerHost {
  stateChanged(newState: State, oldState?: State): void;
}

// Lit controller that automatically calls the host's stateChanged() method
// when the global state changes. https://lit.dev/docs/composition/controllers/
export class StateController implements ReactiveController {
  private host: StateAwareHost;
  private callback = this.onStateChanged.bind(this);

  constructor(host: StateAwareHost) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected() {
    stateManager.addListener(this.callback);
  }

  hostDisconnected() {
    stateManager.removeListener(this.callback);
  }

  get state() {
    return stateManager.getState();
  }

  private onStateChanged(newState: State, oldState?: State) {
    this.host.stateChanged(newState, oldState);
  }
}

// Re-export State for convenience.
export {State};
