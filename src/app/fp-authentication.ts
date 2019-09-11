import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';

import * as firebase from 'firebase/app';
import 'firebase/auth';

import {EventsMixin} from '../mixins/events-mixin';
import {FpAuthLogin} from './fp-auth-login';
import {sharedStyles} from './fp-styles'
import './fp-auth-login';

enum AuthState {
  PENDING,
  ERROR,
  SIGNED_OFF,
  SIGNED_ON,
}

@customElement('fp-authentication')
export class FpAuthentication extends EventsMixin(LitElement) {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
      }
      #error, #loader {
        align-self: center;
        text-align: center;
        margin: 128px 32px;
      }
      #error .code {
        color: var(--error-text-color);
      }
      #error .message {
        color: var(--tertiary-text-color);
        font-size: 0.8em;
        margin: 8px;
      }
      #loader {
        color: var(--tertiary-text-color);
        animation: fadein 10s;
      }
      #login {
        align-self: center;
        margin: 128px 32px;
        width: 250px;
      }
      @keyframes fadein {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    `;
  }

  @property({type: Number}) state = AuthState.PENDING;
  @property({type: String}) errorCode = '';
  @property({type: String}) errorMessage = '';

  connectedCallback() {
    super.connectedCallback();
    this.addListener(this.USER_SIGNOFF,
        this.onUserSignoff.bind(this) as EventListener);
  }

  render() {
    return html`
      ${this.state === AuthState.PENDING ? this.renderLoading() : ''}
      ${this.state === AuthState.ERROR ? this.renderAuthError() : ''}
      ${this.state === AuthState.SIGNED_OFF ? this.renderSignon() : ''}
    `;
  }

  firstUpdated() {
    // Get access to the auth module. If the Firebase API key is invalid,
    // or Firebase is not initialized, this will fail.
    let firebaseAuth = null;
    try {
      firebaseAuth = firebase.auth();
    } catch (error) {
      this.errorCode = error.code;
      this.errorMessage = 'Missing Firebase config or authentication setup';
      this.setAuthState(AuthState.ERROR);
      return;
    }
    firebaseAuth.onAuthStateChanged((user: any) => {
      this.setAuthState(!!user ? AuthState.SIGNED_ON : AuthState.SIGNED_OFF);
    });
  }

  private renderAuthError() {
    return html`
      <div id="error">
        <div class="code">${this.errorCode}</div>
        <div class="message">${this.errorMessage}</div>
      </div>
    `;
  }

  private renderLoading() {
    return html`<div id="loader">Loading...</div>`;
  }

  private renderSignon() {
    return html`
      <fp-auth-login
          id="login"
          @signon=${this.onUserSignon}>
      </fp-auth-login>`;
  }

  private setAuthState(newState: AuthState) {
    this.state = newState;
    const detail = {detail: newState === AuthState.SIGNED_ON};
    this.dispatchEvent(new CustomEvent('state-change', detail));
  }

  private onUserSignoff() {
    firebase.auth().signOut();
  }

  private onUserSignon(event: CustomEvent) {
    if (!this.shadowRoot) return;
    const authLogin = <FpAuthLogin>this.shadowRoot.getElementById('login');
    if (!authLogin) return;

    authLogin.disabled = true;
    authLogin.errorMessage = '';
    const email: string = event.detail.email;
    const pass: string = event.detail.pass;
    firebase.auth().signInWithEmailAndPassword(email, pass)
        .catch((error: any) => {
          if (!authLogin) return;
          authLogin.disabled = false;
          authLogin.errorMessage = error.code;
          authLogin.focusPassword();
          this.setAuthState(AuthState.SIGNED_OFF);
        });
  }
}
