import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';

import {appConfig} from '../config/application';
import {StateController} from '../controllers/state-controller';
import {AuthState, State} from '../modules/state-types';
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
      #version {
        position: fixed;
        left: 2px;
        bottom: 2px;
        color: #333;
        font-size: 0.7em;
      }
    `;
  }

  @state() private isAuthenticated = false;

  constructor() {
    super();
    new StateController(this, this.stateChanged.bind(this));
  }

  stateChanged(newState: State) {
    this.isAuthenticated = newState.authState === AuthState.SIGNED_ON;
  }

  render() {
    return html`
      <fp-authentication></fp-authentication>
      ${this.isAuthenticated ? this.renderDatabase() : ''}
      ${!this.isAuthenticated ? this.renderVersion() : ''}
    `;
  }

  private renderDatabase() {
    return html`
      <fp-database></fp-database>
    `;
  }

  private renderVersion() {
    return html`
      <div id="version">v${appConfig.appVersion}</div>
    `;
  }
}
