import {LitElement} from 'lit-element';

import {State} from '../modules/state-types';
import {StateListener, stateManager} from '../modules/state-manager';

type Constructor<T = LitElement> = new (...args: any[]) => T;

// Helper mixin for the global state management.
export function StateMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    readonly stateListener: StateListener = this.stateChanged.bind(this);

    constructor(...args: any[]) {
      super(...args);
    }

    connectedCallback() {
      super.connectedCallback();
      stateManager.addListener(this.stateListener);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      stateManager.removeListener(this.stateListener);
    }

    getState() {
      return stateManager.getState();
    }

    stateChanged(_newState: State, _oldState: State|null) {
      // No-op. Will be called on sub-classes.
    }
  };
}
