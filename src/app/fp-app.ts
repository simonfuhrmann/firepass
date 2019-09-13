import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';
import * as firebase from 'firebase/app';

import {firebaseConfig} from '../config/firebase';
import './fp-authentication';
import './fp-database';

@customElement('fp-app')
export class FpApp extends LitElement {
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

  render() {
    return html`
      <fp-authentication
          @state-change=${this.onAuthStateChanged}>
      </fp-authentication>
      ${this.isAuthenticated ? this.renderDatabase() : ''}
    `;
  }

  renderDatabase() {
    return html`
      <fp-database></fp-database>
    `;
  }

  private onAuthStateChanged(event: CustomEvent<boolean>) {
    this.isAuthenticated = event.detail;
  }
}
