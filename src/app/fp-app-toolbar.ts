import {LitElement, html, css} from 'lit-element';
import {property, query, customElement} from 'lit-element';

import {EventsMixin} from '../mixins/events-mixin';
import {State} from '../modules/state-types';
import {StateMixin} from '../mixins/state-mixin';
import {FpPassGenerator} from './fp-pass-generator';
import {appConfig} from '../config/application';
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-icon';
import '../oxygen/oxy-icons-base';
import '../oxygen/oxy-icons-communication';
import './fp-pass-generator';

@customElement('fp-app-toolbar')
export class FpAppToolbar extends StateMixin(EventsMixin(LitElement)) {
  static get styles() {
    return css`
      ${sharedStyles}
      #toolbar {
        display: flex;
        flex-direction: row;
        align-items: center;
        background-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 0 8px rgba(0, 0, 0, 0.5);
      }
      #lock-button {
        position: relative;
      }
      #lock-button > div {
        position: absolute;
        font-size: 0.7em;
        color: black;
        background-color: var(--secondary-text-color);
        bottom: 14px;
      }
      #logo {
        display: flex;
        align-items: center;
        flex-grow: 1;
        margin: 0px 8px;
      }
      #logo oxy-icon {
        color: var(--theme-color-fire3);
      }
      #logo h1 {
        color: var(--tertiary-text-color);
        font-size: 1.2em;
        margin: 0 0 0 8px;
      }
      oxy-button {
        color: var(--secondary-text-color);
        padding: 12px;
        border-radius: 0;
      }
      [hidden] {
        display: none !important;
      }
    `;
  }

  private idleTimeoutIntervalHandle: number = -1;

  @query('#generator') generator: FpPassGenerator|undefined;

  @property({type: Boolean}) dbUnlocked = false;
  @property({type: String}) idleTimeout = '';

  connectedCallback() {
    super.connectedCallback();
    this.resetIdleTimeoutInterval();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.clearIdleTimeoutInterval();
  }

  updated(changedProps: Map<string, unknown>) {
    if (changedProps.has('dbUnlocked')) {
      this.resetIdleTimeoutInterval();
    }
  }

  stateChanged(newState: State, oldState: State|null) {
    if (!oldState || newState.lastActivityMs !== oldState.lastActivityMs) {
      this.resetIdleTimeoutInterval();
    }
  }

  render() {
    return html`
      <div id="toolbar">
        <!-- Logo. -->
        <div id="logo">
          <oxy-icon icon="social:whatshot"></oxy-icon>
          <h1>Firepass</h1>
        </div>

        <!-- Buttons. -->
        <oxy-button
            title="Generate Password"
            @click=${this.onOpenGenerator}>
          <oxy-icon icon="communication:vpn-key"></oxy-icon>
        </oxy-button>
        <oxy-button
            title="Settings"
            @click=${this.onOpenSettings}>
          <oxy-icon icon="icons:settings"></oxy-icon>
        </oxy-button>
        <oxy-button
            title="Log out"
            @click=${this.onLogout}>
          <oxy-icon icon="icons:exit-to-app"></oxy-icon>
        </oxy-button>
        <oxy-button
            id="lock-button"
            title="Lock database"
            ?disabled=${!this.dbUnlocked}
            @click=${this.onLock}>
          <oxy-icon icon="icons:lock"></oxy-icon>
          <div ?hidden=${!this.idleTimeout}>${this.idleTimeout}</div>
        </oxy-button>
      </div>

      <fp-pass-generator id="generator"></fp-pass-generator>
    `;
  }

  private onOpenGenerator() {
    const generator = this.generator;
    if (!generator) return;
    generator.open();
  }

  private onOpenSettings() {
    // TODO
  }

  private onLogout() {
    this.dispatch(this.USER_SIGNOFF);
  }

  private onLock() {
    this.dispatch(this.DB_LOCK);
  }

  private resetIdleTimeoutInterval() {
    this.clearIdleTimeoutInterval();
    this.idleTimeoutIntervalHandle = window.setInterval(
          this.updateIdleTimeout.bind(this), 1000);
    this.updateIdleTimeout();
  }

  private clearIdleTimeoutInterval() {
    if (this.idleTimeoutIntervalHandle < 0) return;
    window.clearInterval(this.idleTimeoutIntervalHandle);
    this.idleTimeoutIntervalHandle = -1;
  }

  private updateIdleTimeout() {
    if (!this.dbUnlocked) {
      this.idleTimeout = '';
      return;
    }

    const elapsedMs = Date.now() - this.getState().lastActivityMs;
    const remainingMs = Math.max(0, appConfig.idleTimeoutMs - elapsedMs);
    const remainingSecs = Math.ceil(remainingMs / 1000);
    const remainingMins = Math.ceil(remainingSecs / 60);
    if (remainingSecs >= 60) {
      this.idleTimeout = remainingMins.toString();
    } else if (remainingSecs > 0) {
      this.idleTimeout = remainingSecs.toString();
    } else {
      this.idleTimeout = '';
    }
  }
}
