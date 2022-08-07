import {LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

import {EventsController} from '../controllers/events-controller';
import * as Actions from '../modules/state-actions';
import {appConfig} from '../config/application';

@customElement('fp-idle-timeout')
export class FpIdleTimeout extends LitElement {
  private readonly clickListener = this.registerActivity.bind(this);
  private readonly keydownListener = this.onKeydown.bind(this);
  private events = new EventsController(this);
  private timeoutHandle = -1;

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this.clickListener);
    window.addEventListener('keydown', this.keydownListener);
    this.registerActivity();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this.clickListener);
    window.removeEventListener('keydown', this.keydownListener);
    this.clearTimeout();
  }

  private onKeydown(event: KeyboardEvent) {
    const ignore = ['Alt', 'Shift', 'Control', 'Meta', 'CapsLock'];
    if (ignore.includes(event.key)) return;
    this.registerActivity();
  }

  private registerActivity() {
    this.clearTimeout();
    this.setTimeout();
    Actions.setLastActivityMs(Date.now());
  }

  private setTimeout() {
    this.timeoutHandle = window.setTimeout(
        this.lockDatabase.bind(this), appConfig.idleTimeoutMs);
  }

  private clearTimeout() {
    if (this.timeoutHandle < 0) return;
    window.clearTimeout(this.timeoutHandle);
    this.timeoutHandle = -1;
  }

  private lockDatabase() {
    this.events.dispatch(EventsController.DB_LOCK);
  }
}
