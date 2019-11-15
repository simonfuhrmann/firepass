import {LitElement} from 'lit-element';
import {customElement} from 'lit-element';

import {EventsMixin} from '../mixins/events-mixin';

@customElement('fp-idle-timeout')
export class FpIdleTimeout extends EventsMixin(LitElement) {
  private resetListener = this.resetTimeout.bind(this);
  private intervalHandle = -1;
  private checkIntervalMs = 1000;  // Every second
  private maxIdleTimeMs = 1000 * 60 * 5;  // 5 Minutes
  private lastActivityMs = Date.now();

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this.resetListener);
    window.addEventListener('keypress', this.resetListener);
    this.intervalHandle = window.setInterval(
        this.checkTimeout.bind(this), this.checkIntervalMs);
    this.checkTimeout();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this.resetListener);
    window.removeEventListener('keypress', this.resetListener);
    window.clearInterval(this.intervalHandle);
  }

  private resetTimeout() {
    this.lastActivityMs = Date.now();
  }

  private checkTimeout() {
    const idleTimeMs = Date.now() - this.lastActivityMs;
    if (idleTimeMs > this.maxIdleTimeMs) {
      this.dispatch(this.DB_LOCK);
    } else {
      this.dispatch(this.IDLE_TIMEOUT, this.maxIdleTimeMs - idleTimeMs);
    }
  }
}
