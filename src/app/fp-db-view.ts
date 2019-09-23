import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';
import {repeat} from 'lit-html/directives/repeat';

import {Database} from '../database/database';
import {DbGroup, DbEntry} from '../database/db-types';
import {sharedStyles} from './fp-styles'
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
      #items {
        width: 256px;
        border-right: 1px solid var(--separator-color);
      }
      oxy-tab {
        padding: 8px;
        min-height: 48px;
        display: flex;
        align-items: center;
      }
      oxy-tab oxy-icon {
        margin-right: 8px;
      }
      oxy-tab.group[open] {
        background-image: linear-gradient(to right, rgba(31, 175, 219, 0.2), transparent);
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
      fp-db-entry {
        flex-grow: 1;
      }
    `;
  }

  @property({type: Object}) database: Database|null = null;
  @property({type: Object}) selectedEntry: DbEntry|null = null;
  @property({type: Object}) selectedGroup: DbGroup|null = null;

  render() {
    if (!this.database) return;
    const model = this.database.getModel();

    return html`
      <div id="items" role="listbox">
        ${repeat(model.groups,
            group => group.name,
            group => this.renderGroup(group))}
      </div>
      <fp-db-entry .entry=${this.selectedEntry}></fp-db-entry>
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
          @click=${() => this.onGroupClick(group)}>
        <oxy-icon .icon=${iconName}></oxy-icon>
        <div class="entry-text">
          <div class="primary">${group.name}</div>
          <div class="secondary">${group.entries.length} entries</div>
        </div>
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
          <div class="secondary">${entry.login}</div>
        </div>
      </oxy-list-item>
    `;
  }

  private onGroupClick(group: DbGroup) {
    console.log('group clicked', group);
    if (group == this.selectedGroup) {
      this.selectedGroup = null;
      this.selectedEntry = null;
      return;
    }
    this.selectedGroup = group;
    this.selectedEntry = null;
  }

  private onEntryClick(entry: DbEntry) {
    console.log('entry clicked', entry);
    this.selectedEntry = entry;
  }
}
