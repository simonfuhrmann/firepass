import {ReactiveController, ReactiveControllerHost} from 'lit';

interface EventReference {
  name: string;
  callback: EventListenerOrEventListenerObject;
  options: AddEventListenerOptions|undefined;
}

// Controller to dispatch and listen to global events.
// https://lit.dev/docs/composition/controllers/
export class EventsController implements ReactiveController {
  // Available global events. NOTE: The 'popstate' event is fired by the
  // browser itself when the history state is modified.
  static DB_LOCK: string = 'db-lock';
  static DB_EXPORT: string = 'db-export';
  static USER_SIGNOFF: string = 'user-signoff';
  static IDLE_TIMEOUT: string = 'idle-timeout';
  static HISTORY_POPSTATE: string = 'popstate';

  private host: ReactiveControllerHost;
  private listeners: EventReference[] = [];

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  // Registers a global event listener and automatically removes the listener
  // when the element disconnects from the DOM. Example:
  // this.events.addListener(EventsController.DB_LOCK, this.onLock.bind(this));
  addListener(name: string, callback: EventListenerOrEventListenerObject,
      options?: AddEventListenerOptions|undefined) {
    window.addEventListener(name, callback, options);
    this.listeners.push({name, callback, options});
  }

  // Dispatches an event. Use one of the predefined events.
  // Example: this.events.dispatch(EventsController.DB_LOCK);
  dispatch(name: string, detail?: any) {
    const init = { detail };
    window.dispatchEvent(new CustomEvent(name, init));
  }

  hostDisconnected() {
    this.listeners.forEach(eventRef => {
      window.removeEventListener(
          eventRef.name, eventRef.callback, eventRef.options);
    });
  }
}
