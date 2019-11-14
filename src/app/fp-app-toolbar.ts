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
      oxy-button {
        color: var(--secondary-text-color);
        padding: 12px;
        border-radius: 0;
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
      [hidden] {
        display: none !important;
      }
    `;
  }

  @query('#generator') generator: FpPassGenerator|undefined;

  @property({type: Boolean}) dbUnlocked = false;

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
            @click=${this.onGenerator_}>
          <oxy-icon icon="communication:vpn-key"></oxy-icon>
        </oxy-button>
        <oxy-button
            title="Settings"
            @click=${this.onSettings_}>
          <oxy-icon icon="icons:settings"></oxy-icon>
        </oxy-button>
        <oxy-button
            title="Log out"
            @click=${this.onLogout_}>
          <oxy-icon icon="icons:exit-to-app"></oxy-icon>
        </oxy-button>
        <oxy-button
            title="Lock database"
            ?disabled=${!this.dbUnlocked}
            @click=${this.onLock_}>
          <oxy-icon icon="icons:lock"></oxy-icon>
        </oxy-button>
      </div>

      <fp-pass-generator id="generator"></fp-pass-generator>
    `;
  }

  onGenerator_() {
    const generator = this.generator;
    if (!generator) return;
    generator.open();
  }

  onSettings_() {
    // TODO
  }

  onLogout_() {
    this.dispatch(this.USER_SIGNOFF);
  }

  onLock_() {
    this.dispatch(this.DB_LOCK);
  }
}
