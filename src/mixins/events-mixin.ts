import {LitElement} from 'lit-element';

interface EventReference {
  name: string;
  callback: EventListenerOrEventListenerObject;
  options: AddEventListenerOptions|undefined;
}

type Constructor<T = LitElement> = new (...args: any[]) => T;

// Helper mixin for global events.
export function EventsMixin<TBase extends Constructor>(Base: TBase) {
  return class extends Base {
    // Available global events.
    protected DB_LOCK: string = 'db-lock';
    protected USER_SIGNOFF: string = 'user-signoff';
    protected IDLE_TIMEOUT: string = 'idle-timeout';

    private listeners_: EventReference[] = [];

    constructor(...args: any[]) {
      super(...args);
    }

    // Registers a global event listener and automatically removes the listener
    // when the element disconnects from the DOM. Example:
    // this.addListener(this.DB_LOCK, this.onLock_.bind(this));
    addListener(name: string, callback: EventListenerOrEventListenerObject,
                options?: AddEventListenerOptions|undefined) {
      window.addEventListener(name, callback, options);
      this.listeners_.push({name, callback, options});
    }

    // Removes all previously registered listeners when the element disconnects
    // from the DOM.
    disconnectedCallback() {
      super.disconnectedCallback();
      this.listeners_.forEach(eventRef => {
        window.removeEventListener(eventRef.name, eventRef.callback,
                                  eventRef.options);
      });
    }

    // Dispatches an event. Use one of the predefined events.
    // Example: this.dispatch(this.DB_UNLOCK_FAILURE, 'Incorrect password');
    dispatch(name: string, detail?: any) {
      const init = { detail };
      window.dispatchEvent(new CustomEvent(name, init));
    }
  };
}
