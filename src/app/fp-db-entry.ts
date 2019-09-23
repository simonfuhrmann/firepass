import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';

import {DbEntry} from '../database/db-types';
import {sharedStyles} from './fp-styles'
import './fp-db-entry-icons';
import '../oxygen/oxy-button';
import '../oxygen/oxy-input';
import '../oxygen/oxy-textarea';

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
    `;
  }

  @property({type: Object}) entry: DbEntry|null = null;
  @property({type: Boolean}) editing: boolean = false;
  @property({type: Boolean}) showPassword: boolean = false;
  @property({type: Boolean}) selectIcon: boolean = false;

  render() {
    if (!this.entry) {
      return this.renderEmpty();
    }
    return html`${this.entry.name}`;
  }

  private renderEmpty() {
    return html`<div id="empty">Select an entry</div>`;
  }
}
