import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';

import {Database} from '../database/database';

@customElement('fp-db-view')
export class FpDbView extends LitElement {
  static get styles() {
    return css`
    `;
  }

  @property({type: Object}) database: Database|null = null;

  render() {
    const dbString = this.database
        ? JSON.stringify(this.database.getModel())
        : 'No database';
    return html`
      <code>${dbString}</code>
    `;
  }
}
