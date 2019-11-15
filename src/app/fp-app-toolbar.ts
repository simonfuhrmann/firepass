import {LitElement, html, css} from 'lit-element';
import {property, query, customElement} from 'lit-element';

import {EventsMixin} from '../mixins/events-mixin';
import {FpPassGenerator} from './fp-pass-generator';
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-icon';
import '../oxygen/oxy-icons-base';
import '../oxygen/oxy-icons-communication';
import './fp-pass-generator';

@customElement('fp-app-toolbar')
export class FpAppToolbar extends EventsMixin(LitElement) {
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
        bottom: 15px;
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

  @query('#generator') generator: FpPassGenerator|undefined;

  @property({type: Boolean}) dbUnlocked = false;
  @property({type: Number}) idleTimeoutMs = 0;

  connectedCallback() {
    super.connectedCallback();
    this.addListener(this.IDLE_TIMEOUT,
        this.updateIdleTimeout.bind(this) as EventListener);
    this.addListener(this.DB_LOCK,
        this.resetIdleTimeout.bind(this) as EventListener);
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
          <div ?hidden=${!this.idleTimeoutMs}>${this.formatIdleTime()}</div>
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

  private updateIdleTimeout(event: CustomEvent<number>) {
    this.idleTimeoutMs = event.detail;
  }

  private resetIdleTimeout() {
    this.idleTimeoutMs = 0;
  }

  private formatIdleTime() {
    const secs = Math.ceil(this.idleTimeoutMs / 1000);
    const mins = Math.ceil(secs / 60);
    return secs >= 60 ? mins.toString() : secs.toString();
  }
}
