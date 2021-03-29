// Signature for a state change listener. Both, new and old state are provided.
// The old state is `null` when the listener is called for the first time, i.e.,
// directly after adding the listener to the manager.
export type StateListener<State> =
    (newState: State, oldState: State|null) => void;

// A state action that transforms the current state into a new state. Similar
// to Redux, actions must not directly modify the state, but make immutable
// updates, by copying the existing state and making changes to the copy.
// If the action does not cause any state change, the same state is returned.
export type StateAction<State> = (state: State) => State;

// The state manager's API supports adding and removing state change listeners,
// and processing of actions which modify the state.
//
// Basic usage:
//
//   class MyComponent {
//     private readonly listener = this.stateChanged.bind(this);
//     connectedCallback() {
//       super.connectedCallback();
//       stateManager.addListener(this.listener);
//     }
//     disconnectedCallback() {
//       super.disconnectedCallback();
//       stateManager.removeListener(this.listener);
//     }
//     private stateChanged(newState: State, oldState: State|null) {
//       // Do something.
//     }
//   }
//
// This basic usage of registering and removing listeners can be tedious.
// The recommended StateMixin cuts down on this boilerplate code.
export class StateManager<State> {
  private listeners: StateListener<State>[] = [];
  private state: State;
  private queue: {newState: State, oldState: State}[] = [];

  // Initializes the state manager with an initial state.
  constructor(initialState: State) {
    this.state = initialState;
  }

  // Adds a new listener to the manager. The new listener is immediately called
  // with `newState` set to the current state, and `oldState` set to `null`.
  addListener(listener: StateListener<State>) {
    this.listeners.push(listener);
    listener(this.state, null);
  }

  // Removes a listener from the manager.
  removeListener(listener: StateListener<State>) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Returns the current state.
  getState() {
    return this.state;
  }

  // Processes an action that changes the state.
  processAction(action: StateAction<State>) {
    const oldState = this.state;
    const newState = action(this.state);
    if (oldState === newState) return;
    this.state = newState;
    this.notify(newState, oldState);
  }

  // Notifies all listeners. This function may be invoked recursively if a new
  // action is processed during notification. Recursive notifications are simply
  // queued to prevent sending state change notifications in the wrong order.
  // Without a queue, some listeners may receive change notifications as the
  // recursion unwinds, hence receive notifications in reverse order.
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
