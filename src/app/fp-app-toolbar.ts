import {LitElement, html, css} from 'lit-element';
import {property, query, customElement} from 'lit-element';

import {EventsMixin} from '../mixins/events-mixin';
import {FpPassGenerator} from './fp-pass-generator';
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-input';
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
        justify-content: flex-end;
        border-bottom: 1px solid #333;
      }
      oxy-input {
        margin: 4px 8px;
        flex-grow: 1;
        --oxy-input-background-color: transparent;
        --oxy-input-border-color: transparent;
        --oxy-input-box-shadow: none;
      }
      oxy-button {
        color: var(--secondary-text-color);
        padding: 12px;
        border-radius: 0;
      }
      oxy-input [slot="before"] {
        color: var(--secondary-text-color);
        margin: 2px 0 2px 6px;
        cursor: pointer;
        width: 20px;
        height: 20px;
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
        <!-- Search input. -->
        <oxy-input ?hidden=${!this.dbUnlocked}>
          <oxy-icon slot="before" icon="icons:search"></oxy-icon>
        </oxy-input>

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
