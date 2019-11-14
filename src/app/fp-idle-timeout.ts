import {LitElement} from 'lit-element';
import {customElement} from 'lit-element';

import {EventsMixin} from '../mixins/events-mixin';

@customElement('fp-idle-timeout')
export class FpIdleTimeout extends EventsMixin(LitElement) {
  private resetListener = this.resetTimeout.bind(this);
  private intervalHandle = -1;
  private checkIntervalMs = 10000;  // 10 Seconds
  private maxIdleTimeMs = 1000 * 60 * 5;  // 5 Minutes
  private lastActivityMs = Date.now();

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('click', this.resetListener);
    window.addEventListener('keydown', this.resetListener);
    this.intervalHandle = window.setInterval(
        this.checkTimeout.bind(this), this.checkIntervalMs);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('click', this.resetListener);
    window.removeEventListener('keydown', this.resetListener);
    window.clearInterval(this.intervalHandle);
  }

  private resetTimeout() {
    this.lastActivityMs = Date.now();
  }

  private checkTimeout() {
    if (this.lastActivityMs + this.maxIdleTimeMs < Date.now()) {
      this.timeout();
    }
  }

  private timeout() {
    this.dispatch(this.DB_LOCK);
  }
}
