import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';
import * as firebase from 'firebase/app';

import {firebaseConfig} from '../config/firebase';
import {AuthState, State} from '../modules/state-types';
import {StateMixin} from '../mixins/state-mixin';
import './fp-authentication';
import './fp-database';

@customElement('fp-app')
export class FpApp extends StateMixin(LitElement) {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        height: 100vh;
      }
      fp-database {
        flex-grow: 1;
      }
    `;
  }

  @property({type: Boolean}) isAuthenticated = false;

  constructor() {
    super();
    // Initialize the Firebase app.
    firebase.initializeApp(firebaseConfig);
  }

  stateChanged(newState: State, oldState: State|null) {
    if (!oldState || newState.authState !== oldState.authState) {
      this.isAuthenticated = newState.authState === AuthState.SIGNED_ON;
    }
  }

  render() {
    return html`
      <fp-authentication></fp-authentication>
      ${this.isAuthenticated ? this.renderDatabase() : ''}
    `;
  }

  renderDatabase() {
    return html`
      <fp-database></fp-database>
    `;
  }
}
