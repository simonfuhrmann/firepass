import {LitElement, css, html, nothing} from 'lit';
import {customElement, property, query} from 'lit/decorators.js';

import {OxyDialog} from 'oxygen-mdc/oxy-dialog';
import {OxyInput} from 'oxygen-mdc/oxy-input';
import {OxyTextarea} from 'oxygen-mdc/oxy-textarea';
import {OxyToast} from 'oxygen-mdc/oxy-toast';
import 'oxygen-mdc/oxy-button';
import 'oxygen-mdc/oxy-dialog';
import 'oxygen-mdc/oxy-icon';
import 'oxygen-mdc/oxy-input';
import 'oxygen-mdc/oxy-textarea';
import 'oxygen-mdc/oxy-toast';

import {DbEntry} from '../database/db-types';
import {FpDbEntryIcons} from './fp-db-entry-icons';
import {FpPassGenerator} from './fp-pass-generator';
import {sharedStyles} from './fp-styles'
import './fp-db-entry-icons';
import './fp-pass-generator';

@customElement('fp-db-entry')
export class FpDbEntry extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
        margin: 16px;
      }

      #header {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 12px;
      }
      #header #icon {
        width: 32px;
        height: 32px;
        padding: 2px;
        margin-right: 8px;
      }
      #header #icon-change {
        padding: 6px;
        margin: 0 8px 0 0;
        background-color: var(--theme-color-ice1);
      }
      #header #icon-change oxy-icon {
        width: 24px;
        height: 24px;
      }
      #header oxy-input {
        font-size: 1.2em;
        font-weight: medium;
        flex-grow: 1;
      }
      #header oxy-input[readonly] {
        --oxy-input-border: 1px solid transparent;
        --oxy-input-border-focused: 1px solid transparent;
      }

      #button-bar {
        display: flex;
        justify-content: flex-end;
        flex-shrink: 0;
        margin-top: 8px;
      }
      #button-bar oxy-button {
        margin-left: 16px;
        min-width: 72px;
        background-color: var(--separator-color);
      }
      #button-bar oxy-button oxy-icon {
        margin-right: 8px;
      }
      #button-bar #save-button {
        background-color: var(--theme-color-ice1);
      }

      #delete-dialog-content {
        display: flex;
        padding: 0 16px;
      }
      #delete-dialog oxy-icon {
        margin-right: 8px;
      }

      table {
        border-collapse: separate;
        border-spacing: 0 2px;
      }
      table th {
        font-weight: normal;
        white-space: nowrap;
        text-align: left;
        padding: 2px 8px;
        color: var(--tertiary-text-color);
      }
      table td {
        width: 100%;
      }
      oxy-input[readonly] {
        --oxy-input-background: transparent;
        --oxy-input-background-focused: transparent;
        --oxy-input-border: 1px solid var(--separator-color-faint);
        --oxy-input-border-focused: 1px solid var(--separator-color-faint);
        --oxy-input-box-shadow: none;
        --oxy-input-box-shadow-focused: none;
      }
      oxy-input oxy-button {
        color: var(--tertiary-text-color);
        padding: 8px;
        border-radius: 0;
      }
      oxy-input oxy-button oxy-icon {
        width: 16px;
        height: 16px;
      }

      oxy-textarea {
        min-height: 8em;
        margin: 4px 0;
      }
      oxy-textarea[readonly] {
        --oxy-textarea-background: transparent;
        --oxy-textarea-background-focused: transparent;
        --oxy-textarea-border: 1px solid var(--separator-color-faint);
        --oxy-textarea-border-focused: 1px solid var(--separator-color-faint);
        --oxy-textarea-box-shadow: none;
        --oxy-textarea-box-shadow-focused: none;
      }

      [show-password] {
        color: var(--theme-color-fire3);
      }
      [flex-row] {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      [flex-grow] {
        flex-grow: 1;
      }
    `;
  }

  private iconSelector: FpDbEntryIcons | null = null;
  private passGenerator: FpPassGenerator | null = null;
  private deleteDialog: OxyDialog | null = null;
  private toast: OxyToast | null = null;

  @query('#name') nameInput: OxyInput | undefined;
  @query('#url') urlInput: OxyInput | undefined;
  @query('#email') emailInput: OxyInput | undefined;
  @query('#login') loginInput: OxyInput | undefined;
  @query('#keywords') keywordsInput: OxyInput | undefined;
  @query('#password') passwordInput: OxyInput | undefined;
  @query('#notes') notesInput: OxyTextarea | undefined;

  @property({type: Object}) entry: DbEntry | null = null;
  @property({type: Boolean}) editing: boolean = false;
  @property({type: Boolean}) showPassword: boolean = false;
  @property({type: String}) entryIcon: string = '';

  firstUpdated() {
    if (!this.shadowRoot) return;
    this.iconSelector =
      this.shadowRoot.getElementById('icon-selector') as FpDbEntryIcons;
    this.deleteDialog =
      this.shadowRoot.getElementById('delete-dialog') as OxyDialog;
    this.passGenerator =
      this.shadowRoot.getElementById('generator') as FpPassGenerator;
    this.toast = this.shadowRoot.getElementById('toast') as OxyToast;
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('entry')) {
      this.stopEditing();
      this.copyEntryToInputs();
    }
    if (changedProps.has('editing') && this.editing) {
      this.startEditing();
    }
  }

  render() {
    if (!this.entry) return nothing;

    return html`
      <div id="header">
        <oxy-icon
            id="icon"
            icon=${this.entryIcon}
            ?hidden=${this.editing}>
        </oxy-icon>
        <oxy-button
            id="icon-change"
            title="Change icon"
            raised
            ?hidden=${!this.editing}
            @click=${this.onSelectIcon}>
          <oxy-icon icon=${this.entryIcon}></oxy-icon>
        </oxy-button>
        <oxy-input id="name" ?readonly=${!this.editing}></oxy-input>
      </div>

      <table>
        <tr>
          <th>URL</th>
          <td>
            <oxy-input id="url" ?readonly=${!this.editing}>
              <div flex-row slot="after">
                <oxy-button
                    ?disabled=${!this.entry.url}
                    ?hidden=${this.editing}
                    @click=${this.onOpenUrl}>
                  <oxy-icon icon="icons:open-in-new"></oxy-icon>
                </oxy-button>
                <oxy-button
                    ?disabled=${!this.entry.url}
                    @click=${this.onCopyUrl}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <th>Email</th>
          <td>
            <oxy-input id="email" ?readonly=${!this.editing}>
              <div flex-row slot="after">
                <oxy-button
                    ?disabled=${!this.entry.email}
                    @click=${this.onCopyEmail}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <th>Login</th>
          <td>
            <oxy-input id="login" ?readonly=${!this.editing}>
              <div flex-row slot="after">
                <oxy-button
                    ?disabled=${!this.entry.login}
                    @click=${this.onCopyLogin}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <th>Password</th>
          <td>
            <oxy-input
                id="password"
                ?readonly=${!this.editing}
                .type=${this.showPassword ? 'text' : 'password'}>
              <div flex-row slot="after">
                <oxy-button
                    ?show-password=${this.showPassword}
                    @click=${this.onToggleShowPasswordClick}>
                  <oxy-icon icon="icons:visibility"></oxy-icon>
                </oxy-button>
                <oxy-button
                    ?hidden=${!this.editing}
                    @click=${this.onGeneratePassword}>
                  <oxy-icon icon="communication:vpn-key"></oxy-icon>
                </oxy-button>
                <oxy-button
                    ?hidden=${this.editing}
                    ?disabled=${!this.entry.password}
                    @click=${this.onCopyPassword}>
                  <oxy-icon icon="icons:content-copy"></oxy-icon>
                </oxy-button>
              </div>
            </oxy-input>
          </td>
        </tr>

        <tr>
          <th>Keywords</th>
          <td>
            <oxy-input id="keywords" ?readonly=${!this.editing}></oxy-input>
          </td>
        </tr>

        <tr>
          <td colspan="3">
            <oxy-textarea
                id="notes"
                placeholder="Notes"
                ?readonly=${!this.editing}>
            </oxy-textarea>
          </td>
        </tr>
      </table>

      <div id="button-bar">
        <oxy-button
            id="revert-button"
            title="Revert changes"
            raised
            ?hidden=${!this.editing}
            @click=${this.onRevertClick}>
          <oxy-icon icon="icons:settings-backup-restore"></oxy-icon>
          Revert
        </oxy-button>
        <oxy-button
            id="delete-button"
            title="Delete entry"
            raised
            @click=${this.openDeleteDialog}>
          <oxy-icon icon="icons:delete"></oxy-icon>
          Delete
        </oxy-button>
        <oxy-button
            id="edit-button"
            title="Edit entry"
            raised
            ?hidden=${this.editing}
            @click=${this.startEditing}>
          <oxy-icon icon="icons:create"></oxy-icon>
          Edit
        </oxy-button>
        <oxy-button
            id="save-button"
            title="Save entry"
            raised
            ?hidden=${!this.editing}
            @click=${this.onSaveClick}>
          <oxy-icon icon="icons:save"></oxy-icon>
          Save
        </oxy-button>
      </div>

      <fp-db-entry-icons
          id="icon-selector"
          @changed=${this.onIconSelected}>
      </fp-db-entry-icons>

      <oxy-dialog id="delete-dialog" heading="Delete entry" backdrop>
        <div id="delete-dialog-content">
          <oxy-icon icon=${this.entryIcon}></oxy-icon>
          <div>${this.entry ? this.entry.name : ''}</div>
        </div>
        <div slot="buttons">
          <oxy-button text @click=${this.closeDeleteDialog}>
            Cancel
          </oxy-button>
          <oxy-button text @click=${this.confirmDeleteDialog}>
            Delete
          </oxy-button>
        </div>
      </oxy-dialog>

      <fp-pass-generator
          id="generator"
          selectable
          @change=${this.onPasswordGenerated}>
      </fp-pass-generator>

      <oxy-toast id="toast"></oxy-toast>
    `;
  }

  private startEditing() {
    this.editing = true;

    // Focus the name input.
    if (!this.shadowRoot) return;
    const nameInput = this.shadowRoot.getElementById('name') as OxyInput;
    nameInput.focus();
  }

  private stopEditing() {
    this.editing = false;
    this.showPassword = false;
  }

  private openDeleteDialog() {
    if (!this.deleteDialog) return;
    this.deleteDialog.open();
  }

  private closeDeleteDialog() {
    if (!this.deleteDialog) return;
    this.deleteDialog.close();
  }

  private confirmDeleteDialog() {
    this.closeDeleteDialog();
    this.dispatchEvent(new CustomEvent('delete', {detail: this.entry}));
  }

  private onSaveClick() {
    this.copyInputsToEntry();
    this.stopEditing();
    this.dispatchEvent(new CustomEvent('save', {detail: this.entry}));
  }

  private onRevertClick() {
    this.copyEntryToInputs();
    this.stopEditing();
  }

  private onOpenUrl() {
    if (!this.entry) return;
    window.open(this.entry.url, '_blank');
  }

  private onGeneratePassword() {
    if (!this.passGenerator) return;
    this.passGenerator.open();
  }

  private onPasswordGenerated(event: CustomEvent<string>) {
    if (!this.shadowRoot) return;
    const input = this.shadowRoot.getElementById('password') as OxyInput;
    if (!input) return;
    const password = event.detail;
    input.value = password;
    this.openToast('Password updated');
  }

  private onCopyUrl() {
    this.copyToClipboard('url');
    this.openToast('URL copied to clipboard');
  }

  private onCopyEmail() {
    this.copyToClipboard('email');
    this.openToast('Email copied to clipboard');
  }

  private onCopyLogin() {
    this.copyToClipboard('login');
    this.openToast('Login copied to clipboard');
  }

  private onCopyPassword() {
    this.copyToClipboard('password');
    this.openToast('Password copied to clipboard');
  }

  private copyToClipboard(inputId: string) {
    if (!this.shadowRoot) return;
    const input = this.shadowRoot.getElementById(inputId) as OxyInput;
    input.copyToClipboard();
  }

  private openToast(message: string) {
    if (!this.toast) return;
    this.toast.openNormal(message);
  }

  private onSelectIcon() {
    if (!this.iconSelector) return;
    this.iconSelector.open();
  }

  private onIconSelected(event: CustomEvent<string>) {
    if (!event.detail) return;
    this.entryIcon = event.detail;
  }

  private onToggleShowPasswordClick() {
    this.showPassword = !this.showPassword;
  }

  private copyEntryToInputs() {
    if (!this.entry) return;
    this.entryIcon = this.entry.icon;
    this.nameInput!.value = this.entry.name;
    this.urlInput!.value = this.entry.url;
    this.emailInput!.value = this.entry.email;
    this.loginInput!.value = this.entry.login;
    this.keywordsInput!.value = this.entry.keywords;
    this.passwordInput!.value = this.entry.password;
    this.notesInput!.value = this.entry.notes;
  }

  private copyInputsToEntry() {
    if (!this.entry) return;
    this.entry = {
      name: this.nameInput?.value || '',
      icon: this.entryIcon,
      url: this.urlInput?.value || '',
      email: this.emailInput?.value || '',
      login: this.loginInput?.value || '',
      keywords: this.keywordsInput?.value || '',
      aesIv: '',
      password: this.passwordInput?.value || '',
      notes: this.notesInput?.value || '',
    };
  }
}
