import {LitElement, html, css} from 'lit-element';
import {customElement, property, query} from 'lit-element';

import {Database, DatabaseError} from '../database/database';
import {OxyInput} from '../oxygen/oxy-input'
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-input'

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
      #form {
        display: flex;
        flex-direction: column;
        align-self: center;
        margin: calc(128px - 49px) 32px 128px 32px;
        width: 250px;
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
        justify-content: flex-end;
      }
      oxy-button {
        background-color: rgba(255, 255, 255, 0.1);
      }
      oxy-input {
        margin-bottom: 8px;
      }
      div.label {
        margin: 4px 2px;
        color: var(--tertiary-text-color);
      }
      div.flex {
        flex-grow: 1;
      }
    `;
  }

  @query('#old-pass') oldPassElem: OxyInput|undefined;
  @query('#new-pass') newPassElem: OxyInput|undefined;
  @query('#repeat-pass') repeatPassElem: OxyInput|undefined;
  @property({type: String}) errorMessage: string = '';
  @property({type: Boolean, reflect: true}) disabled: boolean = false;

  firstUpdated() {
    this.resetFocus();
  }

  render() {
    return html`
      <div id="form">
        <div class="label">Old Password</div>
        <oxy-input
            id="old-pass"
            type="password"
            ?disabled=${this.disabled}
            @keydown=${this.onOldPassKeydown}>
        </oxy-input>

        <div class="label">New Password</div>
        <oxy-input
            id="new-pass"
            type="password"
            ?disabled=${this.disabled}
            @keydown=${this.onNewPassKeydown}>
        </oxy-input>

        <div class="label">Repeat</div>
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
      </div>
    `;
  }

  private resetFocus() {
    setTimeout(() => {
      const oldPassElem = this.oldPassElem;
      if (!oldPassElem) return;
      oldPassElem.focus();
      oldPassElem.select();
    }, 0);
  }

  private onOldPassKeydown(event: KeyboardEvent) {
    if (event.keyCode != 13) return;
    const newPassElem = this.newPassElem;
    if (!newPassElem) return;
    newPassElem.focus();
  }

  private onNewPassKeydown(event: KeyboardEvent) {
    if (event.keyCode != 13) return;
    const repeatPassElem = this.repeatPassElem;
    if (!repeatPassElem) return;
    repeatPassElem.focus();
  }

  private onRepeatPassKeydown(event: KeyboardEvent) {
    if (event.keyCode != 13) return;
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

    this.changePassword(oldPass, newPass).then(() => {
      this.disabled = false;
      this.dispatchEvent(new CustomEvent('finish'));
    }).catch((error: DatabaseError) => {
      this.disabled = false;
      this.errorMessage = error.message || error.code || error.toString();
      this.resetFocus();
    });
  }

  private async changePassword(oldPass: string, newPass: string): Promise<void> {
    console.log('Downloading database...');
    const database = new Database();
    await database.download(true);
    console.log('Changing database password...');
    await database.changePassword(oldPass, newPass);
    console.log('Uploading database...');
    await database.upload();
    console.log('Database password changed.');
  }
}
