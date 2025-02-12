import {LitElement, css, html} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import * as Auth from 'firebase/auth';

import {firebaseApp} from '../config/firebase';
import {EventsController} from '../controllers/events-controller';
import {StateController} from '../controllers/state-controller';
import * as Actions from '../modules/state-actions';
import {AuthState, State} from '../modules/state-types';
import {FpAuthLogin} from './fp-auth-login';
import {sharedStyles} from './fp-styles'
import './fp-auth-login';

@customElement('fp-authentication')
export class FpAuthentication extends LitElement {
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

  private events = new EventsController(this);
  private auth: Auth.Auth|null = null;

  @query('#login') loginElement: FpAuthLogin|undefined;
  @state() private authState = AuthState.PENDING;
  @state() private errorCode = '';
  @state() private errorMessage = '';

  constructor() {
    super();
    new StateController(this, this.stateChanged.bind(this));
  }

  connectedCallback() {
    super.connectedCallback();
    this.events.addListener(EventsController.USER_SIGNOFF,
        this.onUserSignoff.bind(this) as EventListener);
  }

  stateChanged(newState: State, oldState: State|null) {
    if (!oldState || newState.authState !== oldState.authState) {
      this.authState = newState.authState;
    }
  }

  render() {
    return html`
      ${this.authState === AuthState.PENDING ? this.renderLoading() : ''}
      ${this.authState === AuthState.ERROR ? this.renderAuthError() : ''}
      ${this.authState === AuthState.SIGNED_OFF ? this.renderSignon() : ''}
    `;
  }

  firstUpdated() {
    // Get access to the auth module. If the Firebase API key is invalid,
    // or Firebase is not initialized, this will fail.
    try {
      this.auth = Auth.getAuth(firebaseApp);
    } catch (error) {
      this.errorCode = (error as Auth.AuthError).code;
      this.errorMessage = 'Missing Firebase config or authentication setup';
      Actions.setAuthState(AuthState.ERROR);
      return;
    }
    this.auth.onAuthStateChanged((user: any) => {
      Actions.setAuthState(!!user ? AuthState.SIGNED_ON : AuthState.SIGNED_OFF);
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

  private onUserSignoff() {
    if (!this.auth) return;
    Actions.resetAppState();
    this.auth.signOut();
  }

  private onUserSignon(event: CustomEvent) {
    if (!this.auth) return;
    const loginElement = this.loginElement;
    if (!loginElement) return;

    loginElement.disabled = true;
    loginElement.errorMessage = '';
    const email: string = event.detail.email;
    const pass: string = event.detail.pass;
    Auth.signInWithEmailAndPassword(this.auth, email, pass)
        .catch((error: any) => {
          loginElement.disabled = false;
          loginElement.errorMessage = error.code;
          loginElement.focusPassword();
          Actions.resetAppState();
          Actions.setAuthState(AuthState.SIGNED_OFF);
        });
  }
}
