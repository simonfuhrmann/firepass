import {ReactiveController, ReactiveControllerHost} from 'lit';

import {State, StateListener, stateManager} from '../modules/state-types';

// Controller to manage the application global state.
// https://lit.dev/docs/composition/controllers/
export class StateController implements ReactiveController {
  private host: ReactiveControllerHost;
  private callback: StateListener;

  constructor(host: ReactiveControllerHost, callback: StateListener) {
    this.host = host;
    this.host.addController(this);
    this.callback = callback;
  }

  hostConnected() {
    stateManager.addListener(this.callback);
  }

  hostDisconnected() {
    stateManager.removeListener(this.callback);
  }

  get() {
    return stateManager.getState();
  }
}

// Re-export State for convenience.
export {State};
