import {LitElement} from 'lit';
import {customElement} from 'lit/decorators.js';

import {appConfig} from '../config/application';
import {EventsController} from '../controllers/events-controller';
import * as Actions from '../modules/state-actions';

@customElement('fp-idle-timeout')
export class FpIdleTimeout extends LitElement {
  private readonly clickListener = this.resetTimeout.bind(this);
  private readonly keydownListener = this.onKeydown.bind(this);
  private readonly eventsController = new EventsController(this);
  private timeoutHandle = -1;

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this.clickListener);
    window.addEventListener('keydown', this.keydownListener);
    this.resetTimeout();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this.clickListener);
    window.removeEventListener('keydown', this.keydownListener);
    this.clearTimeout();
  }

  private onKeydown(event: KeyboardEvent) {
    const ignore = ['Alt', 'Shift', 'Control', 'Meta', 'CapsLock'];
    if (ignore.includes(event.key)) return;
    this.resetTimeout();
  }

  private resetTimeout() {
    this.clearTimeout();
    Actions.setLastActivityMs(Date.now());
    this.timeoutHandle = window.setTimeout(
      this.lockDatabase.bind(this), appConfig.idleTimeoutMs);
  }

  private clearTimeout() {
    if (this.timeoutHandle < 0) return;
    window.clearTimeout(this.timeoutHandle);
    this.timeoutHandle = -1;
  }

  private lockDatabase() {
    this.eventsController.dispatch(EventsController.DB_LOCK);
  }
}
