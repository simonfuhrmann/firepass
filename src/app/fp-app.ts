import {LitElement, css, html} from 'lit';
import {customElement, state} from 'lit/decorators.js';

import './fp-authentication';
import './fp-database';
import {appConfig} from '../config/application';
import {AuthState, State} from '../modules/state-types';
import {DbState} from '../database/database';
import {StateController} from '../controllers/state-controller';

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
        color: #666;
        font-size: 0.7em;
      }
    `;
  }

  @state() private isAuthenticated = false;
  @state() private showVersion = true;

  constructor() {
    super();
    new StateController(this);
  }

  stateChanged(newState: State) {
    this.isAuthenticated = newState.authState === AuthState.SIGNED_ON;
    this.showVersion = newState.dbState !== DbState.UNLOCKED;
  }

  override render() {
    return html`
      <fp-authentication></fp-authentication>
      ${this.isAuthenticated ? this.renderDatabase() : ''}
      ${this.showVersion ? this.renderVersion() : ''}
    `;
  }

  private renderDatabase() {
    return html`<fp-database></fp-database>`;
  }

  private renderVersion() {
    return html`<div id="version">v${appConfig.appVersion}</div>`;
  }
}
