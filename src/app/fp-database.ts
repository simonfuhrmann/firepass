import {LitElement, css, html, nothing} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';

import {EventsController} from '../controllers/events-controller';
import {StateController, State} from '../controllers/state-controller';
import * as Actions from '../modules/state-actions';
import {Database, DbState, DatabaseError} from '../database/database';
import {FpDbUnlock} from './fp-db-unlock';
import {devConfig} from '../config/development';
import {downloadText} from '../modules/download';
import {sharedStyles} from './fp-styles'
import './fp-app-toolbar';
import './fp-idle-timeout';
import './fp-db-change-pass';
import './fp-db-unlock';
import './fp-db-view';

@customElement('fp-database')
export class FpDatabase extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
        min-height: 0;  /* To enable scrolling of items. */
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
      fp-db-unlock {
        align-self: center;
        margin: calc(128px - 49px) 32px 128px 32px;
        width: 250px;
      }
      fp-db-view,
      fp-db-unlock,
      fp-db-change-pass,
      #error  {
        flex-grow: 1;
      }
    `;
  }

  private readonly dbStateListener = this.onDbStateChanged.bind(this);
  private events = new EventsController(this);
  private database: Database = new Database();
  private autoUnlockAttempted = false;

  @query('fp-db-unlock') unlockElem: FpDbUnlock | undefined;
  @state() private dbState: DbState = DbState.INITIAL;
  @state() private changePassword: boolean = false;
  @state() private errorCode: string = '';
  @state() private errorMessage: string = '';

  constructor() {
    super();
    new StateController(this, this.stateChanged.bind(this));
  }

  connectedCallback() {
    super.connectedCallback();
    this.events.addListener(EventsController.DB_LOCK,
      this.onLockDb.bind(this) as EventListener);
    this.events.addListener(EventsController.DB_EXPORT,
      this.onExportDb.bind(this) as EventListener);
    this.database.addStateListener(this.dbStateListener);
    this.downloadDatabase();
  }

  stateChanged(newState: State) {
    this.dbState = newState.dbState;
    this.changePassword = newState.changePassword;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.database.removeStateListener(this.dbStateListener);
  }

  render() {
    const hasError = !!this.errorCode || !!this.errorMessage;
    return html`
      <fp-app-toolbar></fp-app-toolbar>
      ${hasError ? this.renderDbError() : this.renderDbState()}
    `;
  }

  private renderDbState() {
    return html`
      ${this.renderDbUnlock()}
      ${this.renderChangePass()}
      ${this.renderDbView()}
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
    if (this.dbState === DbState.UNLOCKED) return nothing;
    if (this.changePassword) return nothing;
    return html`
      <fp-db-unlock
          ?isFetching=${this.dbState === DbState.FETCHING}
          ?createDb=${this.dbState === DbState.MISSING}
          @create=${this.onCreateDb}
          @unlock=${this.onUnlockDb}
          @refetch=${this.downloadDatabase}>
      </fp-db-unlock>
    `;
  }

  private renderDbView() {
    if (this.dbState !== DbState.UNLOCKED) return nothing;
    return html`
      <fp-idle-timeout></fp-idle-timeout>
      <fp-db-view .database=${this.database}></fp-db-view>
    `;
  }

  private renderChangePass() {
    if (this.dbState === DbState.UNLOCKED) return nothing;
    if (!this.changePassword) return nothing;
    return html`
      <fp-db-change-pass
          @finish=${this.onDbChangePassFinished}>
      </fp-db-change-pass>
    `;
  }

  private downloadDatabase() {
    this.database.download().catch(error => this.onDownloadError(error));
  }

  private onDbStateChanged(state: DbState) {
    Actions.setDbState(state);

    // Development feature: Auto-unlock.
    if (!!devConfig.unlockPassword && !this.autoUnlockAttempted &&
      state === DbState.LOCKED) {
      this.autoUnlockAttempted = true;
      const detail = {detail: devConfig.unlockPassword};
      this.onUnlockDb(new CustomEvent('unlock', detail));
    }
  }

  private onDbChangePassFinished() {
    this.database.reset();
    Actions.setChangePassword(false);
    Actions.setDbState(DbState.FETCHING);
    Actions.setSidebarVisible(true);
    this.downloadDatabase();
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
    const unlockElem = this.unlockElem;
    if (!unlockElem) return;
    unlockElem.setErrorMessage(error.code);
  }

  // Displays a permanent error, such as a database download error.
  private setError(error: DatabaseError) {
    this.errorCode = error.code;
    this.errorMessage = error.message;
  }
}
