import {LitElement, css, html} from 'lit';
import {customElement, property, query, state} from 'lit/decorators.js';

import {OxyInput} from 'oxygen-mdc/oxy-input'
import 'oxygen-mdc/oxy-button';
import 'oxygen-mdc/oxy-input'

import {Database, DatabaseError} from '../database/database';
import {sharedStyles} from './fp-styles'

@customElement('fp-db-change-pass')
export class FpDbChangePass extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
      }
      :host([disabled]) {
        opacity: 0.5;
      }
      #error {
        color: var(--error-text-color);
        font-size: 0.9em;
        min-height: 1.75em;
        margin: 8px 2px;
      }
      #buttons {
        display: flex;
        flex-direction: row;
      }
      oxy-button {
        background: rgba(255, 255, 255, 0.1);
      }
      oxy-input {
        margin-bottom: 8px;
      }
      div.label {
        margin: 4px 2px;
        color: var(--secondary-text-color);
      }
      div.flex {
        flex-grow: 1;
      }
    `;
  }

  @query('#old-pass') oldPassElem: OxyInput | undefined;
  @query('#new-pass') newPassElem: OxyInput | undefined;
  @query('#repeat-pass') repeatPassElem: OxyInput | undefined;
  @property({type: Boolean, reflect: true}) disabled: boolean = false;
  @state() private errorMessage: string = '';

  firstUpdated() {
    this.resetFocus();
  }

  render() {
    return html`
      <div class="label">Old password</div>
      <oxy-input
          id="old-pass"
          type="password"
          ?disabled=${this.disabled}
          @keydown=${this.onOldPassKeydown}>
      </oxy-input>

      <div class="label">New password</div>
      <oxy-input
          id="new-pass"
          type="password"
          ?disabled=${this.disabled}
          @keydown=${this.onNewPassKeydown}>
      </oxy-input>

      <div class="label">Repeat new password</div>
      <oxy-input
          id="repeat-pass"
          type="password"
          ?disabled=${this.disabled}
          @keydown=${this.onRepeatPassKeydown}>
      </oxy-input>

      <div id="error">${this.errorMessage}</div>

      <div id="buttons">
        <oxy-button ?disabled=${this.disabled} @click=${this.onCancel}>
          Cancel
        </oxy-button>
        <div class="flex"></div>
        <oxy-button ?disabled=${this.disabled} @click=${this.onContinue}>
          Continue
        </oxy-button>
      </div>
    `;
  }

  private resetFocus() {
    setTimeout(() => {
      this.oldPassElem?.focus();
      this.oldPassElem?.select();
    }, 0);
  }

  private onOldPassKeydown(event: KeyboardEvent) {
    if (event.key != 'Enter') return;
    this.newPassElem?.focus();
  }

  private onNewPassKeydown(event: KeyboardEvent) {
    if (event.key != 'Enter') return;
    this.repeatPassElem?.focus();
  }

  private onRepeatPassKeydown(event: KeyboardEvent) {
    if (event.key != 'Enter') return;
    this.onContinue();
  }

  private onCancel() {
    this.dispatchEvent(new CustomEvent('finish'));
  }

  private onContinue() {
    this.disabled = true;
    this.errorMessage = '';

    // Old and new passwords must be in order.
    const oldPassElem = this.oldPassElem;
    const newPassElem = this.newPassElem;
    const repeatPassElem = this.repeatPassElem;
    if (!oldPassElem || !newPassElem || !repeatPassElem) return;
    const oldPass = oldPassElem.value;
    const newPass = newPassElem.value;
    const repeatPass = repeatPassElem.value;
    if (newPass !== repeatPass) {
      this.disabled = false;
      this.errorMessage = 'Passwords do not match';
      this.resetFocus();
      return;
    }
    if (oldPass === newPass) {
      this.disabled = false;
      this.errorMessage = 'Passwords identical';
      this.resetFocus();
      return;
    }
    if (!oldPass || !newPass) {
      this.disabled = false;
      this.errorMessage = 'Password empty';
      this.resetFocus();
      return;
    }

    this.changePassword(oldPass, newPass)
      .catch((error: DatabaseError) => {
        this.errorMessage = error.message || error.code || error.toString();
        this.resetFocus();
      }).finally(() => {
        this.disabled = false;
      });
  }

  private async changePassword(oldPass: string, newPass: string): Promise<void> {
    console.log('Downloading database...');
    const database = new Database();
    await database.download();
    console.log('Changing database password...');
    await database.changePassword(oldPass, newPass);
    console.log('Uploading database...');
    await database.upload();
    console.log('Database password changed.');
    this.dispatchEvent(new CustomEvent('finish'));
  }
}
