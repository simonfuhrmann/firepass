import {State, getInitialState} from './state-types';

// A state change notification sent for all state change listeners.
export interface Notification {
  oldState: State;
  newState: State;
}

// Signature for a state change listener. The new state and the old state are
// both provided. The old state is `null` after when the listener is called
// for the first time, directly after adding the listener to the manager.
export type StateListener = (newState: State, oldState: State|null) => void;

// A state action that transforms the current state into a new state. Similar
// to Redux, the state may not directly be modified. Hence, all objects on the
// path to the changed property must change (including the state itself).
// If the action does not cause any state change, the same state is returned.
export type StateAction = (state: State) => State;

// Manages the state change listeners and the notification queue.
class StateManager {
  private listeners: StateListener[] = [];
  private state: State = getInitialState();
  private queue: Notification[] = [];

  // Adds a new listener to the manager.
  addListener(listener: StateListener) {
    this.listeners.push(listener);
    listener(this.state, null);
  }

  // Removes a listener from the manager.
  removeListener(listener: StateListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Returns the current state.
  getState() {
    return this.state;
  }

  // Processes an action that changes the state.
  processAction(action: StateAction) {
    const oldState = this.state;
    const newState = action(this.state);
    if (oldState === newState) return;
    this.state = newState;
    this.notify(newState, oldState);
  }

  // Notifies all listeners. It is important to note that this function may
  // be called recursively if a new action is processed during notification.
  // Recursive notifications are simply queued to prevent sending state change
  // notifications in the wrong order. (That is, without a queue some listeners
  // may receive change notifications as the recursion unwinds, hence receive
  // notifications in reverse order.)
  private notify(newState: State, oldState: State) {
    if (this.queue.length > 0) {
      this.queue.push({newState, oldState});
      return;
    }

    this.queue.push({newState, oldState});
    while (this.queue.length > 0) {
      const notifyEntry = this.queue[0];
      this.listeners.forEach(listener => {
        listener(notifyEntry.newState, notifyEntry.oldState);
      });
      this.queue.shift();
    }
  }
}

export const stateManager = new StateManager();
