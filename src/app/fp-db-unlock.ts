import {LitElement, css, html} from 'lit';
import {customElement, property} from 'lit/decorators';

import {OxyInput} from 'oxygen-mdc/oxy-input'
import 'oxygen-mdc/oxy-input'

import {sharedStyles} from './fp-styles'
import {appConfig} from '../config/application';

@customElement('fp-db-unlock')
export class FpDbUnlock extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      :host {
        display: flex;
        flex-direction: column;
      }
      :host([disabled]) {
        opacity: 0.5;
      }
      div.label {
        margin: 4px 2px;
        color: var(--tertiary-text-color);
      }
      oxy-input {
        margin-bottom: 8px;
      }
      #error, #info, #fetching {
        font-size: 0.9em;
        margin: 8px 2px;
        color: var(--tertiary-text-color);
      }
      #error {
        color: var(--error-text-color);
      }
    `;
  }

  private passInput: OxyInput|undefined;
  private repeatInput: OxyInput|undefined;
  private visibilityChangedFn = () => { this.onVisibilityChanged(); }
  private lastDbFetchMs: number = Date.now();

  @property({type: Boolean}) createDb = false;
  @property({type: Boolean}) isFetching = false;
  @property({type: String}) errorMessage = '';
  @property({type: Boolean, reflect: true}) disabled = false;

  render() {
    return html`
      <div class="label">Unlock Password</div>
      <oxy-input
          id="pass"
          type="password"
          ?disabled=${this.disabled}
          @keydown=${this.onPassKeydown}>
      </oxy-input>

      <div ?hidden=${!this.createDb} class="label">Repeat</div>
      <oxy-input
          id="repeat"
          type="password"
          ?disabled=${this.disabled}
          ?hidden=${!this.createDb}
          @keydown=${this.onRepeatKeydown}>
      </oxy-input>

      <div id="info" ?hidden=${!this.createDb || !!this.errorMessage}>
        A new database will be created.
      </div>
      <div id="fetching" ?hidden=${!this.isFetching}>
        Fetching database...
      </div>
      <div id="error" ?hidden=${!this.errorMessage}>
        ${this.errorMessage}
      </div>
    `;
  }

  connectedCallback() {
    super.connectedCallback();
    document.addEventListener('visibilitychange', this.visibilityChangedFn);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('visibilitychange', this.visibilityChangedFn);
  }

  firstUpdated() {
    if (!this.shadowRoot) return;
    this.passInput = this.shadowRoot.getElementById('pass') as OxyInput;
    this.repeatInput = this.shadowRoot.getElementById('repeat') as OxyInput;

    setTimeout(() => {
      if (!this.passInput) return;
      this.passInput.focus();
    }, 0);
  }

  setErrorMessage(errorMessage: string) {
    this.errorMessage = errorMessage;
    this.disabled = false;
    setTimeout(() => {
      if (!this.passInput) return;
      this.passInput.focus();
      this.passInput.select();
    }, 0);
  }

  private onPassKeydown(event: KeyboardEvent) {
    if (event.keyCode != 13) return;

    this.errorMessage = '';
    if (this.createDb) {
      if (!this.repeatInput) return;
      this.repeatInput.focus();
      this.repeatInput.select();
      return;
    }

    if (this.isFetching) return;
    if (!this.passInput) return;
    this.errorMessage = '';
    this.disabled = true;
    const password = this.passInput.value;
    this.dispatchEvent(new CustomEvent('unlock', {detail: password}));
  }

  private onRepeatKeydown(event: KeyboardEvent) {
    if (event.keyCode != 13) return;
    if (!this.passInput || !this.repeatInput) return;
    if (this.passInput.value != this.repeatInput.value) {
      this.passInput.clear();
      this.repeatInput.clear();
      this.setErrorMessage('Passwords do not match');
      return;
    }
    if (this.isFetching) return;
    this.errorMessage = '';
    this.disabled = true;
    const password = this.passInput.value;
    this.dispatchEvent(new CustomEvent('create', {detail: password}));
  }

  private onVisibilityChanged() {
    const pageActivated = !document.hidden;
    const idleTimeMs = Date.now() - this.lastDbFetchMs;
    const needsRefetch = idleTimeMs > appConfig.refetchTimeoutMs;
    if (pageActivated && needsRefetch) {
      this.dispatchEvent(new CustomEvent('refetch'));
      this.lastDbFetchMs = Date.now();
    }
  }
}
