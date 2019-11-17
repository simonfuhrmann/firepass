import {LitElement, html, css} from 'lit-element';
import {customElement, property, query} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat';

import {Database, DatabaseError} from '../database/database';
import {DbModel, DbEntry} from '../database/db-types';
import {FpDbEntry} from './fp-db-entry';
import {devConfig} from '../config/development';
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-icon';
import '../oxygen/oxy-tab';
import './fp-db-entry';

@customElement('fp-db-view')
export class FpDbView extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: row;
      }
      #sidebar {
        display: flex;
        flex-direction: column;
        border-right: 1px solid var(--separator-color);
        width: 256px;
      }
      #items {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow-y: auto;
      }
      #items::-webkit-scrollbar {
        width: var(--oxy-scrollbar-width);
      }
      #items::-webkit-scrollbar-thumb {
        box-shadow: var(--oxy-scrollbar-thumb-box-shadow);
        border: var(--oxy-scrollbar-thumb-border);
        border-radius: var(--oxy-scrollbar-thumb-border-radius);
      }
      #items::-webkit-scrollbar-thumb:hover {
        box-shadow: var(--oxy-scrollbar-thumb-hover-box-shadow);
      }
      #new-entry-button {
        margin: 16px;
        background-color: var(--theme-color-ice1);
      }
      oxy-tab {
        padding: 8px 8px 8px 16px;
        min-height: 48px;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      oxy-tab > oxy-icon {
        margin-right: 8px;
        flex-shrink: 0;
      }
      oxy-tab[selected] {
        background-image: linear-gradient(to right, rgba(195, 7, 63, 0.2), transparent);
      }
      .entry-text {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      .entry-text .primary {
        color: var(--primary-text-color);
        font-weight: 500;
        font-size: 0.9em;
      }
      .entry-text .secondary {
        color: var(--tertiary-text-color);
        font-size: 0.8em;
      }

      #empty, #error, #entry {
        flex-grow: 1;
      }
      #empty {
        font-size: 1.2em;
        color: var(--separator-color);
        text-align: center;
        margin: 128px 32px;
      }
      #error {
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

      [hidden] {
        display: none !important;
      }
    `;
  }

  @query('#entry') private entryElement: FpDbEntry|undefined;

  @property({type: Object}) database: Database|null = null;
  @property({type: Object}) databaseError: DatabaseError|null = null;
  @property({type: Object}) model: DbModel|null = null;
  @property({type: Object}) selectedEntry: DbEntry|null = null;
  @property({type: Object}) decryptedEntry: DbEntry|null = null;

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('database')) {
      this.updateModel();
    }
  }

  render() {
    if (!this.model) return html``;
    return html`
      <div id="sidebar">
        <div id="items">
          ${repeat(this.model.entries,
              entry => entry.name,
              entry => this.renderEntry(entry))}
        </div>

        <oxy-button id="new-entry-button" raised @click=${this.onEntryAdd}>
          New Entry
        </oxy-button>
      </div>

      ${this.renderDatabaseError()}
      ${this.renderNoEntrySelected()}
      ${this.renderEntryView()}
    `;
  }

  private renderDatabaseError() {
    if (!this.databaseError) return;
    return html`
      <div id="error">
        <div class="code">${this.databaseError.code}</div>
        <div class="message">${this.databaseError.message}</div>
      </div>
    `;
  }

  private renderNoEntrySelected() {
    if (!!this.databaseError || this.decryptedEntry) return;
    return html`<div id="empty">Select an entry</div>`;
  }

  private renderEntryView() {
    if (!!this.databaseError || !this.decryptedEntry) return;
    return html`
      <fp-db-entry
          id="entry"
          .entry=${this.decryptedEntry}
          @delete=${() => this.onEntryDelete(this.selectedEntry)}
          @save=${this.onEntrySave}>
      </fp-db-entry>
    `;
  }

  private renderEntry(entry: DbEntry) {
    const isSelected = entry === this.selectedEntry;
    return html`
      <oxy-tab
          class="entry"
          orientation="vertical"
          ?selected=${isSelected}
          @click=${() => this.onEntryClick(entry)}>
        <oxy-icon .icon=${entry.icon}></oxy-icon>
        <div class="entry-text">
          <div class="primary">${entry.name}</div>
          <div class="secondary">${entry.login || entry.email}</div>
        </div>
      </oxy-list-item>
    `;
  }

  private onEntryClick(entry: DbEntry) {
    this.selectEntry(entry);
  }

  private onEntryAdd(event: MouseEvent) {
    // Prevent clicks on the group the "Add" button is a child of.
    event.preventDefault();

    if (!this.database) return;

    const entry: DbEntry = {
      name: 'Unnamed',
      icon: 'editor:insert-drive-file',
      url: '',
      email: '',
      login: '',
      aesIv: '',
      password: '',
      notes: '',
    };

    this.database.encryptEntry(entry)
        .then((encryptedEntry) => {
          if (!this.database) {
            const message = 'The database was invalidated';
            throw {code: 'db/unavailable', message};
          }
          this.database.addEntry(encryptedEntry);
          this.updateModel();
          this.selectEntry(encryptedEntry);
          this.startEditingEntry();
        })
        .catch(error => this.databaseError = error);
  }

  private onEntrySave(event: CustomEvent<DbEntry>) {
    if (!this.database) return;
    const newEntry = event.detail;
    this.database.encryptEntry(newEntry)
        .then(encryptedEntry => {
          if (!this.database || !this.selectedEntry) {
            const message = 'The database was invalidated';
            throw {code: 'db/unavailable', message};
          }
          this.database.updateEntry(this.selectedEntry, encryptedEntry);
          this.database.sortEntries();
          this.updateModel();
          this.selectEntry(encryptedEntry);
          this.uploadDatabase();
        })
        .catch(error => this.databaseError = error);
  }

  private onEntryDelete(entry: DbEntry|null) {
    if (!this.database || !entry) return;
    this.selectEntry(null);
    this.database.deleteEntry(entry);
    this.updateModel();
    this.uploadDatabase();
  }

  private selectEntry(entry: DbEntry|null) {
    // Clear previous errors.
    this.databaseError = null;

    // Clear selection if argument is null.
    if (!entry || !this.database) {
      this.selectedEntry = null;
      this.decryptedEntry = null;
      return;
    }

    // Decrypt selected entry.
    this.database.decryptEntry(entry)
        .then(decryptedEntry => {
          this.selectedEntry = entry;
          this.decryptedEntry = decryptedEntry;
        })
        .catch(error => this.databaseError = error);
  }

  private startEditingEntry() {
    // Editing mode gets disabled in <fp-db-entry> after switching entries.
    // This timeout re-enables editing mode immediately afterwards.
    setTimeout(() => {
      const entryElement = this.entryElement;
      if (entryElement) entryElement.editing = true;
    }, 0);
  }

  private uploadDatabase() {
    if (!this.database) return;
    if (devConfig.skipUpload) {
      console.warn('Skipping database upload (dev setting)');
      return;
    }
    this.database.upload()
        .catch((error) => this.databaseError = error);
  }

  private updateModel() {
    if (!this.database) return;
    this.model = this.database.getModel();
  }
}
