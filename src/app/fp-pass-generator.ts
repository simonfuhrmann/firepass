import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

import {OxyCheckbox} from '../oxygen/oxy-checkbox';
import {OxyDialog} from '../oxygen/oxy-dialog';
import {OxyInput} from '../oxygen/oxy-input';
import {OxyToast} from '../oxygen/oxy-toast';
import {sharedStyles} from './fp-styles';
import '../oxygen/oxy-button';
import '../oxygen/oxy-checkbox';
import '../oxygen/oxy-dialog';
import '../oxygen/oxy-icon';
import '../oxygen/oxy-input';
import '../oxygen/oxy-slider';

// A password generator UI in a dialog window.
// If the element has the `selected` attribute, the "Copy" button turns into
// a "Select" button which fires the 'change' event with the password.
@customElement('fp-pass-generator')
export class FpPassGenerator extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      oxy-input {
        align-self: stretch;
        margin: 16px 32px 0 32px;
        font-size: 0.9em;
        --oxy-input-background-color: rgba(0, 0, 0, 0.1);
        --oxy-input-background-color-focused: rgba(0, 0, 0, 0.1);
        --oxy-input-border-color: var(--separator-color-faint);
        --oxy-input-border-color-focused: var(--separator-color-faint);
        --oxy-input-box-shadow: none;
        --oxy-input-box-shadow-focused: none;
      }
      oxy-input oxy-button {
        color: var(--tertiary-text-color);
        padding: 8px;
        border-radius: 0;
      }
      oxy-input oxy-button[active] {
        color: var(--theme-color-fire3);
      }
      oxy-input oxy-button oxy-icon {
        width: 16px;
        height: 16px;
      }
      #checkboxes {
        padding: 0 32px;
        border-right: 1px solid var(--separator-color-clear);
      }
      #sliders {
        padding: 0 32px;
      }
      #buttons {
        display: flex;
        flex-grow: 1;
      }
      .layout.horizontal {
        display: flex;
        flex-direction: row;
      }
      .layout.vertical {
        display: flex;
        flex-direction: column;
      }
      .layout.vertical.spaced > :not(:last-child) {
        margin-bottom: 8px;
      }
      [flex-grow] {
        flex-grow: 1;
      }
    `;
  }

  private dialog: OxyDialog|null = null;
  private input: OxyInput|null = null;
  private toast: OxyToast|null = null;
  private uppercase: OxyCheckbox|null = null;
  private lowercase: OxyCheckbox|null = null;
  private numbers: OxyCheckbox|null = null;
  private special: OxyCheckbox|null = null;

  @property({type: Number}) passwordLength: number = 16;
  @property({type: Number}) blockLength: number = 0;
  @property({type: Boolean}) showPassword: boolean = true;
  @property({type: Boolean}) selectable: boolean = false;

  firstUpdated() {
    if (!this.shadowRoot) return;
    this.dialog = this.shadowRoot.getElementById('dialog') as OxyDialog;
    this.input = this.shadowRoot.getElementById('input') as OxyInput;
    this.toast = this.shadowRoot.getElementById('toast') as OxyToast;
    this.uppercase = this.shadowRoot.getElementById('uppercase') as OxyCheckbox;
    this.lowercase = this.shadowRoot.getElementById('lowercase') as OxyCheckbox;
    this.numbers = this.shadowRoot.getElementById('numbers') as OxyCheckbox;
    this.special = this.shadowRoot.getElementById('special') as OxyCheckbox;
  }

  render() {
    return html`
      <oxy-dialog id="dialog" heading="Password generator" backdrop>
        <div class="layout horizontal">
          <div id="checkboxes" class="layout vertical">
            <oxy-checkbox
                id="uppercase"
                checked
                @change=${this.onRegenerate}>
              ABC
            </oxy-checkbox>
            <oxy-checkbox
                id="lowercase"
                checked
                @change=${this.onRegenerate}>
              abc
            </oxy-checkbox>
            <oxy-checkbox
                id="numbers"
                checked
                @change=${this.onRegenerate}>
              123
            </oxy-checkbox>
            <oxy-checkbox
                id="special"
                @change=${this.onRegenerate}>
              !@#
            </oxy-checkbox>
          </div>

          <div id="sliders" class="spaced layout vertical">
            <div>
              <div>Length of ${this.passwordLength}</div>
              <oxy-slider
                  min="3" max="64"
                  .value=${this.passwordLength}
                  @change=${this.onPassLengthChanged}>
              </oxy-slider>
            </div>

            <div>
              <div>Blocks of ${this.blockLength}</div>
              <oxy-slider
                  min="0" max="16"
                  .value=${this.blockLength}
                  @change=${this.onBlockLengthChanged}>
              </oxy-slider>
            </div>
          </div>
        </div>

        <oxy-input
            id="input"
            readonly
            .type=${this.showPassword ? 'text' : 'password'}>
          <div slot="after" class="layout horizontal">
            <oxy-button
                title="Show password"
                ?active=${this.showPassword}
                @click=${this.onShowPassword}>
              <oxy-icon icon="icons:visibility"></oxy-icon>
            </oxy-button>
          </div>
        </oxy-input>

        <div id="buttons" slot="buttons">
          <oxy-button
              text
              @click=${this.onRegenerate}>
            Regenerate
          </oxy-button>

          <div flex-grow></div>

          <oxy-button
              text
              ?hidden=${this.selectable}
              @click=${this.onCopyPassword}>
            Copy
          </oxy-button>
          <oxy-button
              text
              ?hidden=${this.selectable}
              @click=${this.close}>
            Close
          </oxy-button>

          <oxy-button
              text
              ?hidden=${!this.selectable}
              @click=${this.close}>
            Cancel
          </oxy-button>
          <oxy-button
              text
              ?hidden=${!this.selectable}
              @click=${this.onSelectPassword}>
            Select
          </oxy-button>
        </div>
      </oxy-dialog>

      <oxy-toast id="toast"></oxy-toast>
    `;
  }

  open() {
    if (!this.dialog) return;
    this.dialog.open();
  }

  close() {
    if (!this.dialog) return;
    this.dialog.close();
  }

  private onShowPassword() {
    this.showPassword = !this.showPassword;
  }

  private onCopyPassword() {
    if (!this.input) return;
    this.input.copyToClipboard();
    this.showToast('Password copied to clipboard');
  }

  private onSelectPassword() {
    if (!this.input) return;
    const password = this.input.value;
    this.dispatchEvent(new CustomEvent('change', {detail: password}));
    this.close();
  }

  private showToast(message: string) {
    if (!this.toast) return;
    this.toast.openNormal(message);
  }

  private onRegenerate() {
    if (!this.input) return;
    const pass = this.generatePassword();
    this.input.value = pass;
  }

  private onPassLengthChanged(event: CustomEvent<number>) {
    this.passwordLength = event.detail;
    this.onRegenerate();
  }

  private onBlockLengthChanged(event: CustomEvent<number>) {
    this.blockLength = event.detail;
    this.onRegenerate();
  }

  private generatePassword(): string {
    if (!this.lowercase || !this.uppercase || !this.numbers || !this.special) {
      return '';
    }

    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special1 = '!@#$%^&*-_=+';

    let charset = '';
    if (this.lowercase.checked) charset += lowercase;
    if (this.uppercase.checked) charset += uppercase;
    if (this.numbers.checked) charset += numbers;
    if (this.special.checked) charset += special1;

    const random = new Uint32Array(this.passwordLength);
    crypto.getRandomValues(random);

    const modulo = charset.length;
    let password = '';
    for (let i = 0; i < random.length; ++i) {
      if (i > 0 && i % this.blockLength === 0) {
        password += '-';
      }
      password += charset.charAt(random[i] % modulo);
    }
    return password;
  }
}
