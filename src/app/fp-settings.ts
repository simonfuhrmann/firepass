import {LitElement, css, html} from 'lit';
import {property, customElement} from 'lit/decorators.js';

import 'oxygen-mdc/oxy-button';

import {EventsController} from '../controllers/events-controller';
import * as Actions from '../modules/state-actions';
import {DbView} from '../modules/state-types';
import {sharedStyles} from './fp-styles'

@customElement('fp-settings')
export class FpSettings extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      #dialog {
        position: fixed;
        right: 16px;
        top: 64px;
        max-width: calc(100% - 64px);
        display: flex;
        flex-direction: column;
        background-color: var(--oxy-dialog-background);
        z-index: 10;
        padding: 8px 0;
        border-radius: 8px;
      }
      #backdrop {
        position: fixed;
        left: 0;
        top: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.5);
        z-index: 5;
      }
      oxy-button {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        font-weight: normal;
        border-radius: 0;
        line-height: 1.2em;
        padding: 8px 16px;
      }
      oxy-button .primary {
      }
      oxy-button .secondary {
        color: var(--tertiary-text-color);
        font-size: 0.85em;
      }
    `;
  }

  private events = new EventsController(this);

  @property({type: Boolean}) opened = false;

  render() {
    return html`
      <div id="backdrop" ?hidden=${!this.opened} @click=${this.close}>
      <div id="dialog" ?hidden=${!this.opened}>
        <oxy-button @click=${this.onExport}>
          <div class="primary">Export database</div>
          <div class="secondary">Download the encrypted database</div>
        </oxy-button>
        <oxy-button @click=${this.onChangePassword}>
          <div class="primary">Change password</div>
          <div class="secondary">Change the database password</div>
        </oxy-button>
        <oxy-button @click=${this.onChangeCrypto}>
          <div class="primary">Upgrade database</div>
          <div class="secondary">Use safer cryptographic settings</div>
        </oxy-button>
      </div>
    `;
  }

  open() {
    this.opened = true;
  }

  close() {
    this.opened = false;
  }

  private onExport() {
    this.events.dispatch(EventsController.DB_EXPORT);
  }

  private onChangePassword() {
    this.events.dispatch(EventsController.DB_LOCK);
    Actions.setDbView(DbView.CHANGE_PASSWORD);
  }

  private onChangeCrypto() {
    this.events.dispatch(EventsController.DB_LOCK);
    Actions.setDbView(DbView.CHANGE_CRYPTO);
  }
}
