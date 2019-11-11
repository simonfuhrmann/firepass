import {LitElement, html, css} from 'lit-element';
import {customElement, property, query} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat';

import {Database, DatabaseError} from '../database/database';
import {DbModel, DbGroup, DbEntry} from '../database/db-types';
import {FpDbEntry} from './fp-db-entry';
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
      #buttons {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        background-color: rgba(0, 0, 0, 0.25);
      }
      #new-group-button {
        margin: 32px;
        background-color: var(--theme-color-ice1);
      }
      #buttons oxy-button {
        padding: 8px;
        border-radius: 0;
      }
      oxy-tab {
        padding: 8px;
        min-height: 48px;
        display: flex;
        align-items: center;
        flex-shrink: 0;
      }
      oxy-tab > oxy-icon {
        margin-right: 8px;
        flex-shrink: 0;
      }
      oxy-tab.group[open] {
        background-image: linear-gradient(to right, rgba(31, 175, 219, 0.2), transparent);
      }
      oxy-tab.group oxy-button {
        padding: 2px;
        margin: 0;
        color: var(--tertiary-text-color);
      }
      oxy-tab.entry[selected] {
        background-image: linear-gradient(to right, rgba(195, 7, 63, 0.2), transparent);
      }
      oxy-tab.entry oxy-icon {
        margin-left: 16px;
      }
      .entry-text {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      .entry-text .primary {
        color: var(--primary-text-color);
        font-weight: 500;
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
  @property({type: Object}) selectedGroup: DbGroup|null = null;
  @property({type: Object}) selectedEntry: DbEntry|null = null;
  @property({type: Object}) decryptedEntry: DbEntry|null = null;

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('database')) {
      this.updateModel();
    }
  }

  render() {
    if (!this.model) return html``;
    const groupSelected = !this.selectedEntry && !!this.selectedGroup;
    const groupEmpty = !!this.selectedGroup &&
        this.selectedGroup.entries.length === 0;
    return html`
      <div id="sidebar">
        <div id="buttons">
          <oxy-button>
            <oxy-icon icon="icons:create-new-folder"></oxy-icon>
          </oxy-button>
          <oxy-button
              ?disabled=${!groupSelected || !groupEmpty}
              @click=${() => this.onGroupDelete(this.selectedGroup)}>
            <oxy-icon icon="icons:delete"></oxy-icon>
          </oxy-button>
          <oxy-button ?disabled=${!groupSelected}>
            <oxy-icon icon="icons:create"></oxy-icon>
          </oxy-button>
        </div>

        <div id="items">
          ${repeat(this.model.groups,
              group => group.name,
              group => this.renderGroup(group))}
        </div>

        <oxy-button id="new-group-button" ?hidden=${!!this.model.groups.length}>
          <oxy-icon icon="icons:create-new-folder"></oxy-icon>
          New Group
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
          @delete=${this.onEntryDelete}
          @save=${this.onEntrySave}>
      </fp-db-entry>
    `;
  }

  private renderGroup(group: DbGroup) {
    const isSelected = group === this.selectedGroup;
    const iconName = isSelected ? 'icons:expand-more' : 'icons:chevron-right';
    return html`
      <oxy-tab
          class="group"
          orientation="vertical"
          ?open=${isSelected}
          @click=${(event: MouseEvent) => this.onGroupClick(event, group)}>
        <oxy-icon .icon=${iconName}></oxy-icon>
        <div class="entry-text">
          <div class="primary">${group.name}</div>
          <div class="secondary">${group.entries.length} entries</div>
        </div>
        <oxy-button
            @click=${(event: MouseEvent) => this.onEntryAdd(event, group)}>
          <oxy-icon icon="icons:add"></oxy-icon>
        </oxy-button>
      </oxy-tab>

      ${repeat(isSelected ? group.entries : [],
            entry => entry.name,
            entry => this.renderEntry(entry))}
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

  private onGroupClick(event: MouseEvent, group: DbGroup) {
    if (event.defaultPrevented) return;
    this.selectedGroup = group;
    this.selectEntry(null);
  }

  private onEntryClick(entry: DbEntry) {
    this.selectEntry(entry);
  }

  private onEntryAdd(event: MouseEvent, group: DbGroup) {
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
          this.selectedGroup = group;
          this.database.addEntry(group, encryptedEntry);
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
          if (!this.database || !this.selectedGroup || !this.selectedEntry) {
            const message = 'The database was invalidated';
            throw {code: 'db/unavailable', message};
          }
          this.database.updateEntry(
              this.selectedGroup, this.selectedEntry, encryptedEntry);
          this.database.sortGroupsAndEntries();
          this.updateModel();
          this.selectEntry(encryptedEntry);
        })
        .catch(error => this.databaseError = error);
  }

  private onEntryDelete(event: CustomEvent<DbEntry>) {
    if (!this.database || !this.selectedGroup || !this.selectedEntry) return;
    const entry = event.detail;
    this.selectEntry(null);
    this.database.deleteEntry(this.selectedGroup, entry);
    this.updateModel();
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

  private onGroupDelete(group: DbGroup|null) {
    if (!group) return;

    // Do not delete groups with entries!
    if (group.entries.length > 0) {
      console.error('Attempted to delete non-empty group');
      return;
    }
    if (!this.database) return;
    this.database.deleteGroup(group);
    this.selectedGroup = null;
    this.selectEntry(null);
    this.updateModel();
  }

  private startEditingEntry() {
    // Editing mode gets disabled in <fp-db-entry> after switching entries.
    // This timeout re-enables editing mode immediately afterwards.
    setTimeout(() => {
      const entryElement = this.entryElement;
      if (entryElement) entryElement.editing = true;
    }, 0);
  }

  private updateModel() {
    if (!this.database) return;
    this.model = this.database.getModel();
  }
}
