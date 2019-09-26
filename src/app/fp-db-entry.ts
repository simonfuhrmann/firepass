import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';

import {DbEntry} from '../database/db-types';
import {FpDbEntryIcons} from './fp-db-entry-icons';
import {OxyDialog} from '../oxygen/oxy-dialog';
import {OxyInput} from '../oxygen/oxy-input';
import {OxyTextarea} from '../oxygen/oxy-textarea';
import {sharedStyles} from './fp-styles'
import './fp-db-entry-icons';
import '../oxygen/oxy-button';
import '../oxygen/oxy-input';
import '../oxygen/oxy-textarea';
import '../oxygen/oxy-dialog';

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

      #empty {
        font-size: 1.2em;
        color: var(--separator-color);
        text-align: center;
        margin: 128px 32px;
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
        flex-grow: 1;
      }

      #button-bar {
        display: flex;
        justify-content: flex-end;
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

      #delete-dialog {
        display: flex;
        flex-direction: column;
        align-items: center;
        top: 20%;
        left: 20%;
        right: 20%;
        max-height: 60%;
        background-color: #333;
        border-radius: 8px;
        transform: none;
      }
      #delete-dialog oxy-icon {
        margin-right: 8px;
      }
      #delete-dialog #delete-cancel-button {
        background-color: var(--theme-color-gray);
        margin: 32px 8px;
      }
      #delete-dialog #delete-confirm-button {
        background-color: var(--theme-color-fire1);
        margin: 32px 8px;
      }

      a {
        color: inherit;
      }
      table {
        border-collapse: separate;
        border-spacing: 0 2px;
      }
      table th {
        font-weight: normal;
        width: 1px;
        white-space: nowrap;
        text-align: left;
        padding: 2px 8px;
        color: var(--tertiary-text-color);
      }
      table td.buttons {
        width: 1px;
        white-space: nowrap;
        color: var(--tertiary-text-color);
      }
      table td.buttons oxy-button {
        color: inherit;
        padding: 4px;
        margin: 2px;
      }
      oxy-input[readonly] {
        --oxy-input-background-color: rgba(0, 0, 0, 0.2);
        --oxy-input-background-color-focused: rgba(0, 0, 0, 0.2);
        --oxy-input-border-color: transparent;
        --oxy-input-border-color-focused: transparent;
        --oxy-input-box-shadow: none;
        --oxy-input-box-shadow-focused: none;
      }
      oxy-textarea {
        min-height: 8em;
      }
      oxy-textarea[readonly] {
        --oxy-textarea-background-color: rgba(0, 0, 0, 0.2);
        --oxy-textarea-background-color-focused: rgba(0, 0, 0, 0.2);
        --oxy-textarea-border-color: transparent;
        --oxy-textarea-border-color-focused: transparent;
        --oxy-textarea-box-shadow: none;
        --oxy-textarea-box-shadow-focused: none;
      }

      [flex-row] {
        display: flex;
        flex-direction: row;
        align-items: center;
      }
      [flex-grow] {
        flex-grow: 1;
      }
      [hidden] {
        display: none !important;
      }
    `;
  }

  @property({type: Object}) entry: DbEntry|null = null;
  @property({type: Boolean}) editing: boolean = false;
  @property({type: Boolean}) showPassword: boolean = false;
  @property({type: String}) entryIcon: string = '';

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('entry')) {
      this.editing = false;
      this.showPassword = false;
      this.copyEntryToInputs();
    }
  }

  render() {
    return !this.entry ? this.renderEmpty() : this.renderView();
  }

  private renderEmpty() {
    return html`<div id="empty">Select an entry</div>`;
  }

  private renderView() {
    if (!this.entry) return html``;
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
          <th>Website</th>
          <td>
            <oxy-input id="url" ?readonly=${!this.editing}>
            </oxy-input>
          </td>
          <td class="buttons">
            <oxy-button>
              <oxy-icon icon="icons:content-copy"></oxy-icon>
            </oxy-button>
            <a href="${this.entry.url}" target="_blank">
              <oxy-button .disabled=${!this.entry.url}>
                <oxy-icon icon="icons:open-in-new"></oxy-icon>
              </oxy-button>
            </a>
          </td>
        </tr>

        <tr>
          <th>Email</th>
          <td>
            <oxy-input id="email" ?readonly=${!this.editing}></oxy-input>
          </td>
          <td class="buttons">
            <oxy-button>
              <oxy-icon icon="icons:content-copy"></oxy-icon>
            </oxy-button>
          </td>
        </tr>

        <tr>
          <th>Login</th>
          <td>
            <oxy-input id="login" ?readonly=${!this.editing}></oxy-input>
          </td>
          <td class="buttons">
            <oxy-button>
              <oxy-icon icon="icons:content-copy"></oxy-icon>
            </oxy-button>
          </td>
        </tr>

        <tr>
          <th>Pasword</th>
          <td>
            <oxy-input
                id="password"
                ?readonly=${!this.editing}
                .type=${this.showPassword ? 'text' : 'password'}>
            </oxy-input>
          </td>
          <td class="buttons">
            <oxy-button>
              <oxy-icon icon="icons:content-copy"></oxy-icon>
            </oxy-button>
            <oxy-button>
              <oxy-icon icon="communication:vpn-key"></oxy-icon>
            </oxy-button>
            <oxy-button @click=${this.onToggleShowPasswordClick}>
              <oxy-icon icon="icons:visibility"></oxy-icon>
            </oxy-button>
          </td>
        </tr>

        <tr>
          <th>Notes</th>
        </tr>
        <tr>
          <th colspan="3">
            <oxy-textarea id="notes" ?readonly=${!this.editing}></oxy-textarea>
          </th>
        </tr>
      </table>

      <div flex-grow></div>

      <div id="button-bar">
        <oxy-button
            id="delete-button"
            title="Delete entry"
            raised
            ?hidden=${this.editing}
            @click=${this.openDeleteDialog}>
          <oxy-icon icon="icons:delete"></oxy-icon>
          Delete
        </oxy-button>
        <oxy-button
            id="edit-button"
            title="Edit entry"
            raised
            ?hidden=${this.editing}
            @click=${this.onEditClick}>
          <oxy-icon icon="icons:create"></oxy-icon>
          Edit
        </oxy-button>
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

      <oxy-dialog id="delete-dialog" backdrop>
        <h1>Delete entry?</h1>
        <div flex-row>
          <oxy-icon icon=${this.entryIcon}></oxy-icon>
          <div>${this.entry.name}</div>
        </div>
        <div class="dialog-buttons">
          <oxy-button
              id="delete-cancel-button"
              raised
              @click=${this.closeDeleteDialog}>
            Cancel
          </oxy-button>
          <oxy-button
              id="delete-confirm-button"
              raised
              @click=${this.confirmDeleteDialog}>
            Delete
          </oxy-button>
        </div>
      </oxy-dialog>
    `;
  }

  private onEditClick() {
    this.editing = true;
  }

  private openDeleteDialog() {
    if (!this.shadowRoot) return;
    const dialog = <OxyDialog>this.shadowRoot.getElementById('delete-dialog');
    dialog.open();
  }

  private closeDeleteDialog() {
    if (!this.shadowRoot) return;
    const dialog = <OxyDialog>this.shadowRoot.getElementById('delete-dialog');
    dialog.close();
  }

  private confirmDeleteDialog() {
    this.closeDeleteDialog();
    this.dispatchEvent(new CustomEvent('delete', {detail: this.entry}));
  }

  private onSaveClick() {
    this.copyInputsToEntry();
    this.editing = false;
    this.dispatchEvent(new CustomEvent('save', {detail: this.entry}));
  }

  private onRevertClick() {
    this.copyEntryToInputs();
    this.editing = false;
  }

  private onSelectIcon() {
    if (!this.shadowRoot) return;
    const iconSelector =
        <FpDbEntryIcons>this.shadowRoot.getElementById('icon-selector');
    iconSelector.open();
  }

  private onIconSelected(event: CustomEvent<string>) {
    if (!event.detail) return;
    this.entryIcon = event.detail;
  }

  private onToggleShowPasswordClick() {
    this.showPassword = !this.showPassword;
  }

  private copyEntryToInputs() {
    this.copyBetweenEntryAndInputs(/*entryToInputs=*/true);
  }

  private copyInputsToEntry() {
    this.copyBetweenEntryAndInputs(/*entryToInputs=*/false);
  }

  private copyBetweenEntryAndInputs(entryToInputs: boolean) {
    if (!this.entry) return;
    if (!this.shadowRoot) return;
    const nameInput = <OxyInput>this.shadowRoot.getElementById('name');
    const urlInput = <OxyInput>this.shadowRoot.getElementById('url');
    const emailInput = <OxyInput>this.shadowRoot.getElementById('email');
    const loginInput = <OxyInput>this.shadowRoot.getElementById('login');
    const passwordInput = <OxyInput>this.shadowRoot.getElementById('password');
    const notesInput = <OxyTextarea>this.shadowRoot.getElementById('notes');

    if (entryToInputs) {
      this.entryIcon = this.entry.icon;
      nameInput.value = this.entry.name;
      urlInput.value = this.entry.url;
      emailInput.value = this.entry.email;
      loginInput.value = this.entry.login;
      passwordInput.value = this.entry.password;
      notesInput.value = this.entry.notes;
    } else {
      this.entry = {
        name: nameInput.value,
        icon: this.entryIcon,
        url: urlInput.value,
        email: emailInput.value,
        login: loginInput.value,
        aesIv: '',
        password: passwordInput.value,
        notes: notesInput.value,
      };
    }
  }
}
