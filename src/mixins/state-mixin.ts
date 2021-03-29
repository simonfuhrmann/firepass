import {LitElement} from 'lit-element';

import {State, stateManager} from '../modules/state-types';

type Constructor<T = LitElement> = new (...args: any[]) => T;

// Helper mixin for the global state management.
export function StateMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    private readonly mixinStateListener = this.stateChanged.bind(this);

    constructor(...args: any[]) {
      super(...args);
    }

    connectedCallback() {
      super.connectedCallback();
      stateManager.addListener(this.mixinStateListener);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      stateManager.removeListener(this.mixinStateListener);
    }

    getState() {
      return stateManager.getState();
    }

    stateChanged(_newState: State, _oldState: State|null) {
      // No-op. Will be called on sub-classes.
    }
  };
}
