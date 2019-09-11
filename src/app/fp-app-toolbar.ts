import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

import {EventsMixin} from '../mixins/events-mixin';
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-input';
import '../oxygen/oxy-icon';
import '../oxygen/oxy-icons-base';
import '../oxygen/oxy-icons-communication';

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
      [hidden] {
        display: none !important;
      }
    `;
  }

  @property({type: Boolean}) dbUnlocked = false;

  render() {
    return html`
      <div id="toolbar">
        <oxy-input
            class="flex"
            ?hidden=${!this.dbUnlocked}
            icon="icons:search">
        </oxy-input>
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
    `;
  }

  onGenerator_() {
    // TODO
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
