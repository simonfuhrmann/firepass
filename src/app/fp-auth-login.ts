import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators.js';

import 'oxygen-mdc/oxy-input'
import {OxyInput} from 'oxygen-mdc/oxy-input'

import {devConfig} from '../config/development';
import {sharedStyles} from './fp-styles'

@customElement('fp-auth-login')
export class FpAuthLogin extends LitElement {
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
      div.label {
        margin: 4px 2px;
        color: var(--tertiary-text-color);
      }
      oxy-input {
        margin-bottom: 8px;
      }
      #error {
        color: var(--error-text-color);
        font-size: 0.9em;
        margin: 8px 2px;
      }
    `;
  }

  private emailInput: OxyInput | null = null;
  private passwordInput: OxyInput | null = null;

  @property({type: Boolean, reflect: true}) disabled = false;
  @property({type: String}) errorMessage = '';

  override firstUpdated() {
    if (!this.shadowRoot) return;
    this.emailInput = this.shadowRoot.getElementById('email') as OxyInput;
    this.passwordInput = this.shadowRoot.getElementById('password') as OxyInput;

    setTimeout(() => {
      if (!this.emailInput) return;
      this.emailInput.focus();
    }, 0);
  }

  override render() {
    return html`
      <div class="label">Login</div>
      <oxy-input
          id="email"
          type="email"
          value=${devConfig.loginEmail}
          ?disabled=${this.disabled}
          @keydown=${this.onEmailKeydown}>
      </oxy-input>

      <div class="label">Password</div>
      <oxy-input
          id="password"
          type="password"
          value=${devConfig.loginPassword}
          ?disabled=${this.disabled}
          @keydown=${this.onPassKeydown}>
      </oxy-input>

      <div id="error">${this.errorMessage}</div>
    `;
  }

  focusPassword() {
    setTimeout(() => {
      if (!this.passwordInput) return;
      this.passwordInput.focus();
      this.passwordInput.select();
    }, 0);
  }

  private onEmailKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || !this.passwordInput) return;
    this.passwordInput.focus();
    this.passwordInput.select();
  }

  private onPassKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    this.login();
  }

  private login() {
    if (!this.emailInput || !this.passwordInput) return;
    const email = this.emailInput.value;
    const pass = this.passwordInput.value;
    if (!email || !pass) return;
    const detail = {detail: {email, pass}};
    this.dispatchEvent(new CustomEvent('signon', detail));
  }
}
