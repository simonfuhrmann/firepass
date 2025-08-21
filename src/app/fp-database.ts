import {LitElement, css, html, nothing} from 'lit';
import {customElement, query, state} from 'lit/decorators.js';

import {EventsController} from '../controllers/events-controller';
import {StateController, State} from '../controllers/state-controller';
import * as Actions from '../modules/state-actions';
import {DbView} from '../modules/state-types';
import {Database, DbState, DatabaseError} from '../database/database';
import {FpDbUnlock} from './fp-db-unlock';
import {devConfig} from '../config/development';
import {downloadText} from '../modules/download';
import {sharedStyles} from './fp-styles'
import './fp-app-toolbar';
import './fp-idle-timeout';
import './fp-db-change-crypto';
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
      #error,
      fp-db-unlock,
      fp-db-change-pass,
      fp-db-change-crypto {
        margin: 64px 32px 0 32px;
        width: 250px;
        align-self: center;
      }
      #error {
        align-self: center;
        text-align: center;
      }
      #error .code {
        color: var(--error-text-color);
      }
      #error .message {
        color: var(--tertiary-text-color);
        font-size: 0.8em;
        margin: 8px;
      }
      fp-db-view {
        flex-grow: 1;
      }
    `;
  }

  private readonly dbStateListener = this.onDbStateChanged.bind(this);
  private events = new EventsController(this);
  private database: Database = new Database();
  private autoUnlockAttempted = false;

  @query('fp-db-unlock') unlockElem: FpDbUnlock | undefined;
  @state() private dbView: DbView;
  @state() private dbState: DbState;
  @state() private errorCode: string = '';
  @state() private errorMessage: string = '';

  constructor() {
    super();
    const sc = new StateController(this, this.stateChanged.bind(this));
    this.dbView = sc.get().dbView;
    this.dbState = sc.get().dbState;
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
    this.dbView = newState.dbView;
    this.dbState = newState.dbState;
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.database.removeStateListener(this.dbStateListener);
  }

  render() {
    return html`
      <fp-app-toolbar></fp-app-toolbar>
      ${this.renderErrorOrDbView()}
    `;
  }

  private renderErrorOrDbView() {
    if (!!this.errorCode || !!this.errorMessage) {
      return this.renderDbError();
    }
    if (this.dbView === DbView.DATABASE_STATE) {
      return this.renderDbState();
    }
    if (this.dbView === DbView.CHANGE_PASSWORD) {
      return this.renderChangePass();
    }
    if (this.dbView === DbView.CHANGE_CRYPTO) {
      return this.renderChangeCrypto();
    }
    return nothing;
  }

  private renderDbError() {
    return html`
      <div id="error">
        <div class="code">${this.errorCode}</div>
        <div class="message">${this.errorMessage}</div>
      </div>
    `;
  }

  private renderDbState() {
    if (this.dbState === DbState.UNLOCKED) {
      return html`
        <fp-idle-timeout></fp-idle-timeout>
        <fp-db-view .database=${this.database}></fp-db-view>
      `;
    }
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

  private renderChangePass() {
    if (this.dbState !== DbState.LOCKED) return nothing;
    return html`
      <fp-db-change-pass @finish=${this.onChangeDatabaseFinished}>
      </fp-db-change-pass>
    `;
  }

  private renderChangeCrypto() {
    if (this.dbState !== DbState.LOCKED) return nothing;
    return html`
      <fp-db-change-crypto
          .cryptoParams=${this.database.getCryptoParams()}
          @finish=${this.onChangeDatabaseFinished}>
      </fp-db-change-crypto>
    `;
  }

  private downloadDatabase() {
    this.database.download()
      .then(() => this.checkUpdateSuggested())
      .catch(error => this.onDownloadError(error));
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

  // Called after changing password or upgrading database.
  private onChangeDatabaseFinished() {
    this.database.reset();
    Actions.setDbView(DbView.DATABASE_STATE);
    Actions.setDbState(DbState.FETCHING);
    Actions.setSidebarVisible(true);
    this.downloadDatabase();
  }

  private onCreateDb(event: CustomEvent<string>) {
    const password = event.detail;
    this.database.create(password)
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

  private checkUpdateSuggested() {
    Actions.setUpgradeDbSuggested(this.database.isUpgradeSuggested());
  }

  // Displays a permanent error, such as a database download error.
  private setError(error: DatabaseError) {
    this.errorCode = error.code;
    this.errorMessage = error.message;
  }
}
