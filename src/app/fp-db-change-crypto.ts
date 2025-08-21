import {LitElement, css, html, nothing} from 'lit';
import {customElement, query, property, state} from 'lit/decorators.js';

import 'oxygen-mdc/oxy-button';
import 'oxygen-mdc/oxy-icon';
import 'oxygen-mdc/oxy-icons-base';
import 'oxygen-mdc/oxy-input'

import {CryptoParams} from '../database/db-types';
import {Database, DatabaseError, equalCryptoParams} from '../database/database';
import {EventsController} from '../controllers/events-controller';
import {getDefaultCryptoParams} from '../database/db-data';
import {OxyInput} from 'oxygen-mdc/oxy-input'
import {sharedStyles} from './fp-styles'

// Assistant style flow with 3 pages.
enum CryptoPage {
  VIEW_CHANGE,
  MAKE_BACKUP,
  DB_UNLOCK,
}

@customElement('fp-db-change-crypto')
export class FpDbChangeCrypto extends LitElement {
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
      table {
        border-collapse: collapse;
        color: var(--tertiary-text-color);
        margin-bottom: 16px;
      }
      table td {
        padding: 2px;
      }
      table td.value {
        text-align: right;
        font-family: monospace;
      }
      #error {
        color: var(--error-text-color);
        font-size: 0.9em;
        min-height: 1.75em;
        margin: 8px 2px;
      }
      #buttons {
        display: flex;
        flex-direction: row;
      }
      oxy-button {
        background: rgba(255, 255, 255, 0.1);
      }
      oxy-input {
        margin-bottom: 8px;
      }
      div.label {
        margin: 4px 2px;
        color: var(--secondary-text-color);
      }
      div.underlined {
        border-bottom: 2px solid var(--secondary-text-color);
        padding-bottom: 4px;
      }
      table.old td[diff] {
        color: var(--primary-text-color);
      }
      table.new td[diff] {
        color: var(--theme-color-ice3);
      }
      div.description {
        font-size: 0.95em;
        color: var(--tertiary-text-color);
        margin: 8px 2px;
      }
      div.flex {
        flex-grow: 1;
      }
    `;
  }

  private readonly eventsController = new EventsController(this);

  @query('#password') passwordElem: OxyInput | undefined;
  @property({type: Boolean, reflect: true}) disabled: boolean = false;

  @property({attribute: false}) cryptoParams: CryptoParams | undefined;
  @state() private errorMessage: string = '';
  @state() private page = CryptoPage.VIEW_CHANGE;

  override render() {
    return html`
      ${this.renderCryptoPage()}
      ${this.renderBackupPage()}
      ${this.renderPasswordPage()}
    `;
  }

  private renderCryptoPage() {
    if (this.page !== CryptoPage.VIEW_CHANGE) return nothing;
    if (!this.cryptoParams) return nothing;
    const oldParams = this.cryptoParams;
    const newParams = getDefaultCryptoParams();
    const shouldUpgrade = !equalCryptoParams(oldParams, newParams);
    if (!shouldUpgrade) {
      this.errorMessage = 'Already up-to-date';
    }

    return html`
      <div class="underlined label">Current settings</div>
      ${this.renderCryptoTable(oldParams, newParams, 'old')}
      <div class="underlined label">New settings</div>
      ${this.renderCryptoTable(newParams, oldParams, 'new')}

      ${this.renderErrors()}
      ${this.renderButtons(/*continueEnabled=*/shouldUpgrade)}
    `;
  }

  private renderBackupPage() {
    if (this.page !== CryptoPage.MAKE_BACKUP) return nothing;
    const onBackup = () => {
      this.eventsController.dispatch(EventsController.DB_EXPORT);
    };
    return html`
      <div class="underlined label">Download a backup</div>
      <div class="description">Just in case anything goes wrong.</div>
      <oxy-button @click=${onBackup}>Export database</oxy-button>

      ${this.renderErrors()}
      ${this.renderButtons(/*continueEnabled=*/true)}
    `;
  }

  private renderPasswordPage() {
    if (this.page !== CryptoPage.DB_UNLOCK) return nothing;
    return html`
      <div class="underlined label">Unlock Password</div>
      <div class="description">
        This will decrypt your database with the old settings, re-encrypt the
        database with the new settings, and upload the upgraded database.
      </div>
      <oxy-input
          id="password"
          type="password"
          ?disabled=${this.disabled}
          @keydown=${this.onPasswordKeydown}>
      </oxy-input>

      ${this.renderErrors()}
      ${this.renderButtons(/*continueEnabled=*/true)}
    `;
  }

  private renderCryptoTable(params: CryptoParams, diffParams: CryptoParams,
    tableClass: string) {
    const cipherDiff = params.cipherMode != diffParams.cipherMode;
    const deriveDiff = params.deriveAlgo != diffParams.deriveAlgo;
    const hashAlgoDiff = params.hashAlgo != diffParams.hashAlgo;
    const hashItersDiff = params.iterations != diffParams.iterations;
    return html`
      <table class="${tableClass}">
        <tr>
          <td>Cipher mode</td>
          <td class="value" ?diff=${cipherDiff}>${params.cipherMode}</td>
        </tr>
        <tr>
          <td>Key algorithm</td>
          <td class="value" ?diff=${deriveDiff}>${params.deriveAlgo}</td>
        </tr>
        <tr>
          <td>Key hash</td>
          <td class="value" ?diff=${hashAlgoDiff}>${params.hashAlgo}</td>
        </tr>
        <tr>
          <td>Hash iterations</td>
          <td class="value" ?diff=${hashItersDiff}>${params.iterations}</td>
        </tr>
      </table>
    `;
  }

  private renderErrors() {
    return html`<div id="error">${this.errorMessage}</div>`;
  }

  private renderButtons(continueEnabled: boolean) {
    const continueDisabled = this.disabled || !continueEnabled;
    return html`
      <div id="buttons">
        <oxy-button ?disabled=${this.disabled} @click=${this.onCancel}>
          Cancel
        </oxy-button>
        <div class="flex"></div>
        <oxy-button ?disabled=${continueDisabled} @click=${this.onContinue}>
          Continue
        </oxy-button>
      </div>
    `;
  }

  private resetFocus() {
    setTimeout(() => {
      this.passwordElem?.focus();
      this.passwordElem?.select();
    }, 0);
  }

  private onPasswordKeydown(event: KeyboardEvent) {
    if (event.key != 'Enter') return;
    this.onContinue();
  }

  private onCancel() {
    this.dispatchEvent(new CustomEvent('finish'));
  }

  private onContinue() {
    if (this.page === CryptoPage.VIEW_CHANGE) {
      this.page = CryptoPage.MAKE_BACKUP;
    } else if (this.page === CryptoPage.MAKE_BACKUP) {
      this.page = CryptoPage.DB_UNLOCK;
      this.resetFocus();
    } else if (this.page === CryptoPage.DB_UNLOCK) {
      this.errorMessage = '';
      this.disabled = true;
      const passwordElem = this.passwordElem;
      if (!passwordElem) {
        this.errorMessage = 'Internal error';
        return;
      }
      this.upgradeDatabase(passwordElem.value)
        .catch((error: DatabaseError) => {
          this.errorMessage = error.message || error.code || error.toString();
          this.resetFocus();
        }).finally(() => {
          this.disabled = false;
        });
    }
  }

  private async upgradeDatabase(password: string) {
    console.log('Downloading database...');
    const database = new Database();
    await database.download();
    console.log('Updating crypto params...');
    await database.updateCryptoParams(password);
    console.log('Uploading database...');
    await database.upload();
    console.log('Database upgrade complete.');
    this.dispatchEvent(new CustomEvent('finish'));
  }
}
