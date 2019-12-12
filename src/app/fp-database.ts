import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';

import * as Actions from '../modules/state-actions';
import {Database, DbState, DatabaseError} from '../database/database';
import {EventsMixin} from '../mixins/events-mixin';
import {FpDbUnlock} from './fp-db-unlock';
import {devConfig} from '../config/development';
import {downloadText} from '../modules/download';
import {sharedStyles} from './fp-styles'
import './fp-app-toolbar';
import './fp-idle-timeout';
import './fp-db-unlock';
import './fp-db-view';

@customElement('fp-database')
export class FpDatabase extends EventsMixin(LitElement) {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;  /* To enable scrolling of items. */
      }
      #unlock {
        align-self: center;
        margin: calc(128px - 49px) 32px 128px 32px;
        width: 250px;
      }
      #error {
        align-self: center;
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
      fp-db-view,
      fp-db-unlock,
      #error  {
        flex-grow: 1;
      }
    `;
  }

  private readonly stateListener = this.onStateChanged.bind(this);
  private database: Database = new Database();
  private autoUnlockFailed = false;

  @property({type: Number}) dbState: DbState = DbState.INITIAL;
  @property({type: String}) errorCode: string = '';
  @property({type: String}) errorMessage: string = '';

  connectedCallback() {
    super.connectedCallback();
    this.addListener(this.DB_LOCK,
        this.onLockDb.bind(this) as EventListener);
    this.addListener(this.DB_EXPORT,
        this.onExportDb.bind(this) as EventListener);
  }

  firstUpdated() {
    this.database.addStateListener(this.stateListener);
    this.database.download(/*setState=*/true)
        .catch(error => this.onDownloadError(error));
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.database.removeStateListener(this.stateListener);
  }

  render() {
    return html`
      <fp-app-toolbar
          .dbUnlocked=${this.dbState === DbState.UNLOCKED}>
      </fp-app-toolbar>
      ${!!this.errorCode || !!this.errorMessage
          ? this.renderDbError()
          : this.renderDbState()}
    `;
  }

  private renderDbState() {
    return html`
      ${this.dbState === DbState.UNLOCKED
          ? this.renderDbView()
          : this.renderDbUnlock()}
    `;
  }

  private renderDbError() {
    return html`
      <div id="error">
        <div class="code">${this.errorCode}</div>
        <div class="message">${this.errorMessage}</div>
      </div>
    `;
  }

  private renderDbUnlock() {
    return html`
      <fp-db-unlock
          id="unlock"
          ?isFetching=${this.dbState === DbState.FETCHING}
          ?createDb=${this.dbState === DbState.MISSING}
          @create=${this.onCreateDb}
          @unlock=${this.onUnlockDb}>
      </fp-db-unlock>
    `;
  }

  private renderDbView() {
    return html`
      <fp-idle-timeout></fp-idle-timeout>
      <fp-db-view .database=${this.database}></fp-db-view>
    `;
  }

  private onStateChanged(state: DbState) {
    this.dbState = state;

    // Development feature: Auto-unlock.
    if (!!devConfig.unlockPassword && !this.autoUnlockFailed &&
        state === DbState.LOCKED) {
      this.autoUnlockFailed = true;
      const detail = {detail: devConfig.unlockPassword};
      this.onUnlockDb(new CustomEvent('unlock', detail));
    }
  }

  private onCreateDb(event: CustomEvent<string>) {
    if (this.dbState !== DbState.MISSING) return;
    this.database.create(event.detail)
        .catch(error => this.onUnlockFailure(error));
  }

  private onUnlockDb(event: CustomEvent<string>) {
    if (this.dbState !== DbState.LOCKED) return;
    Actions.setSidebarVisible(true);
    this.database.unlock(event.detail)
        .catch(error => this.onUnlockFailure(error));
  }

  private onLockDb() {
    this.database.lock();
  }

  private onExportDb() {
    const doc = this.database.getDocument();
    const json = JSON.stringify(doc);
    const date = new Date();
    const dateArray = [date.getFullYear(), date.getMonth() + 1, date.getDate()];
    const timeArray = [date.getHours(), date.getMinutes(), date.getSeconds()];
    const dateStr = dateArray.map(s => s.toString().padStart(2, '0')).join('');
    const timeStr = timeArray.map(s => s.toString().padStart(2, '0')).join('');
    const filename = `firepass_export-${dateStr}_${timeStr}.json`;
    downloadText(json, filename);
  }

  private onDownloadError(error: DatabaseError) {
    this.setError(error);
  }

  private onUnlockFailure(error: DatabaseError) {
    if (!this.shadowRoot) return;
    const dbUnlock = <FpDbUnlock>this.shadowRoot.getElementById('unlock');
    dbUnlock.setErrorMessage(error.code);
  }

  // Displays a permanent error, such as a database download error.
  private setError(error: DatabaseError) {
    this.errorCode = error.code;
    this.errorMessage = error.message;
  }
}
