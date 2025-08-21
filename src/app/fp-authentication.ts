import {LitElement, css, html} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';
import * as Auth from 'firebase/auth';

import './fp-auth-login';
import {AuthState, State, DbView} from '../modules/state-types';
import {DbState} from '../database/database';
import {EventsController} from '../controllers/events-controller';
import {firebaseApp} from '../config/firebase';
import {FpAuthLogin} from './fp-auth-login';
import {sharedStyles} from './fp-styles'
import {StateController} from '../controllers/state-controller';
import * as Actions from '../modules/state-actions';

@customElement('fp-authentication')
export class FpAuthentication extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
      }
      #error, #loader, #login {
        align-self: center;
        margin: calc(64px + 48px) 32px 0 32px;
        width: 250px;
      }
      #error {
        text-align: center;
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
        text-align: center;
        animation: fadein 10s;
      }
      @keyframes fadein {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
    `;
  }

  private readonly eventsController = new EventsController(this);
  private auth: Auth.Auth | null = null;

  @query('#login') loginElement: FpAuthLogin | undefined;
  @state() private authState = AuthState.PENDING;
  @state() private errorCode = '';
  @state() private errorMessage = '';

  constructor() {
    super();
    new StateController(this);
  }

  stateChanged(newState: State) {
    this.authState = newState.authState;
  }

  override connectedCallback() {
    super.connectedCallback();
    this.eventsController.addListener(EventsController.USER_SIGNOFF,
      this.onUserSignoff.bind(this) as EventListener);
  }

  override firstUpdated() {
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

  override render() {
    return html`
      ${this.authState === AuthState.PENDING ? this.renderLoading() : ''}
      ${this.authState === AuthState.ERROR ? this.renderAuthError() : ''}
      ${this.authState === AuthState.SIGNED_OFF ? this.renderSignon() : ''}
    `;
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
      <fp-auth-login id="login" @signon=${this.onUserSignon}></fp-auth-login>
    `;
  }

  private onUserSignoff() {
    if (!this.auth) return;
    this.auth.signOut();
    Actions.setAuthState(AuthState.SIGNED_OFF);
    Actions.setDbView(DbView.DATABASE_STATE);
    Actions.setDbState(DbState.INITIAL);
    Actions.setSidebarVisible(true);
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
        Actions.setAuthState(AuthState.SIGNED_OFF);
      });
  }
}
