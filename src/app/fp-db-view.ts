import {LitElement, html, css} from 'lit-element';
import {customElement, property, query} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat';

import * as Actions from '../modules/state-actions';
import {Database, DatabaseError} from '../database/database';
import {DbModel, DbEntry} from '../database/db-types';
import {OxyInput} from '../oxygen/oxy-input';
import {OxyToast} from '../oxygen/oxy-toast';
import {FpDbEntry} from './fp-db-entry';
import {State} from '../modules/state-types';
import {StateMixin} from '../mixins/state-mixin';
import {EventsMixin} from '../mixins/events-mixin';
import {devConfig} from '../config/development';
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-button';
import '../oxygen/oxy-icon';
import '../oxygen/oxy-input';
import '../oxygen/oxy-tab';
import '../oxygen/oxy-toast';
import './fp-db-entry';

@customElement('fp-db-view')
export class FpDbView extends StateMixin(EventsMixin(LitElement)) {
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
      #actions {
        display: flex;
        flex-shrink: 0;
        align-items: center;
        border-bottom: 1px solid var(--separator-color);
      }
      #actions oxy-input {
        flex-grow: 1;
        margin: 0;
        --oxy-input-text-padding: 8px;
        --oxy-input-border-width: 0;
        --oxy-input-border-radius: 0;
        --oxy-input-box-shadow: none;
        --oxy-input-box-shadow-focused: none;
        --oxy-input-background-color: transparent;
        --oxy-input-background-color-focused: transparent;
      }
      #actions oxy-input oxy-icon {
        color: var(--disabled-text-color);
        cursor: pointer;
        margin-left: 8px;
      }
      #actions oxy-input oxy-icon[active] {
        color: var(--primary-text-color);
      }
      #actions oxy-button {
        padding: 8px;
        border-radius: 0;
      }
      #items {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
        overflow-y: auto;
      }
      #items p {
        align-self: center;
        color: var(--disabled-text-color);
        font-size: 0.9em;
        margin: 32px;
      }
      oxy-tab {
        padding: 8px 8px 8px 12px;
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
      oxy-tab .entry-text {
        display: flex;
        flex-direction: column;
        flex-grow: 1;
      }
      oxy-tab .entry-text .primary {
        color: var(--primary-text-color);
        font-weight: 500;
        font-size: 0.9em;
      }
      oxy-tab .entry-text .secondary {
        color: var(--tertiary-text-color);
        font-size: 0.8em;
      }
      oxy-tab oxy-button {
        color: var(--tertiary-text-color);
        padding: 4px;
      }

      #empty, #error, #entry {
        flex-grow: 1;
      }
      #empty {
        font-size: 1.2em;
        color: var(--disabled-text-color);
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

      @media screen and (max-width: 700px) {
        #sidebar {
          display: none;
        }
        :host([sidebar]) #sidebar {
          display: flex;
          flex-grow: 1;
        }
        :host([sidebar]) #entry,
        :host([sidebar]) #empty {
          display: none;
        }
        oxy-tab .entry-text .primary {
          font-size: 1.0em;
        }
        oxy-tab .entry-text .secondary {
          color: var(--tertiary-text-color);
          font-size: 0.9em;
        }
      }
    `;
  }

  @query('#entry') private entryElement: FpDbEntry|undefined;
  @query('#filter') private filterInput: OxyInput|undefined;
  @query('#toast') private toastElement: OxyToast|undefined;

  @property({type: Object}) database: Database|null = null;
  @property({type: Object}) databaseError: DatabaseError|null = null;
  @property({type: Object}) model: DbModel|null = null;
  @property({type: Array}) filteredEntries: DbEntry[]|null = null;
  @property({type: Object}) selectedEntry: DbEntry|null = null;
  @property({type: Object}) decryptedEntry: DbEntry|null = null;
  @property({type: Boolean, reflect: true}) sidebar: boolean = true;

  connectedCallback() {
    super.connectedCallback();
    this.addListener(this.HISTORY_POPSTATE, (event) => {
      const popstate = event as PopStateEvent;
      Actions.setSidebarVisible(!popstate.state.showEntry);
    });
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('database')) {
      this.updateModel();
    }
  }

  stateChanged(newState: State, _oldState: State|null) {
    this.sidebar = newState.sidebarVisible;
  }

  render() {
    // Display filtered entries, or all entries from the model.
    const entries = !!this.filteredEntries
        ? this.filteredEntries
        : (this.model ? this.model.entries : []);

    return html`
      <div id="sidebar">
        <div id="actions">
          <oxy-input
              id="filter"
              clearonescape autofocus
              @keydown=${this.onFilterKeydown}
              @change=${this.onFilterChange}>
            <oxy-icon
                slot="before"
                icon="icons:search"
                ?active=${!!this.filteredEntries}
                @click=${this.onFilterClear}>
            </oxy-icon>
          </oxy-input>
          <oxy-button title="New entry" @click=${this.onEntryAdd}>
            <oxy-icon icon="icons:add"></oxy-icon>
          </oxy-button>
        </div>
        <div id="items" class="scrollable">
          ${repeat(entries,
              entry => entry.name,
              entry => this.renderEntry(entry))}
          ${this.renderNoItems()}
        </div>
      </div>

      ${this.renderDatabaseError()}
      ${this.renderNoEntrySelected()}
      ${this.renderEntryView()}

      <oxy-toast id="toast"></oxy-toast>
    `;
  }

  private renderNoItems() {
    if (!this.model) {
      return html`<p>No model selected</p>`;
    }
    if (!!this.filteredEntries && this.filteredEntries.length === 0) {
      return html`<p>No entries match the filter</p>`;
    }
    if (!this.filteredEntries && this.model.entries.length === 0) {
      return html`<p>No entries, create one!</p>`;
    }
    return html``;
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
    const copyHandler = (event: MouseEvent) => {
      event.stopPropagation();
      this.copyEntryPassword(entry);
    };
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
        <oxy-button @click=${copyHandler}>
          <oxy-icon icon="icons:content-copy"></oxy-icon>
        </oxy-button>
      </oxy-list-item>
    `;
  }

  private onEntryClick(entry: DbEntry) {
    this.selectEntry(entry);
  }

  private onEntryAdd(event: MouseEvent) {
    // Prevent clicks on the group the "Add" button is a child of.
    event.preventDefault();
    // Reset any previous filter.
    this.onFilterClear();

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
        .catch(error => this.setDatabaseError(error));
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
        .catch(error => this.setDatabaseError(error));
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
          // Hide sidebar on mobile.
          Actions.setSidebarVisible(false);
          // Push history state so that the back button can be used.
          // Ignore if the top of the stack is already the same state.
          if (!window.history.state.showEntry) {
            window.history.pushState({showEntry: true}, 'Entry');
          }
        })
        .catch(error => this.setDatabaseError(error));
  }

  private onFilterClear() {
    if (!this.filterInput) return;
    this.filterInput.clear();
  }

  private onFilterChange(event: CustomEvent<string>) {
    if (!this.model) return;
    const filter = event.detail.toLowerCase();
    if (filter.length < 3) {
      this.filteredEntries = null;
      return;
    }
    this.filteredEntries = this.model.entries.filter(entry => {
      return entry.name.toLowerCase().search(filter) >= 0 ||
          entry.url.toLowerCase().search(filter) >= 0 ||
          entry.email.toLowerCase().search(filter) >= 0 ||
          entry.login.toLowerCase().search(filter) >= 0;
    });
  }

  private onFilterKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter') return;
    if (!this.filteredEntries || this.filteredEntries.length === 0) return;
    const firstEntry = this.filteredEntries[0];
    this.selectEntry(firstEntry);
    this.onFilterClear();
    this.copyEntryPassword(firstEntry);
  }

  private copyEntryPassword(entry: DbEntry) {
    if (!this.database) return;
    this.database.decryptEntry(entry)
        .then(decryptedEntry => {
          navigator.clipboard.writeText(decryptedEntry.password)
              .then(() => this.showToast('Password copied to clipboard'))
              .catch(() => this.showToast('Failed to copy to clipboard'));
        })
        .catch(error => this.setDatabaseError(error));
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
        .catch((error) => this.setDatabaseError(error));
  }

  private setDatabaseError(error: DatabaseError) {
    Actions.setSidebarVisible(false);
    this.databaseError = error
  }

  private updateModel() {
    if (!this.database) return;
    this.model = this.database.getModel();
  }

  private showToast(text: string) {
    if (!this.toastElement) return;
    this.toastElement.openNormal(text);
  }
}
