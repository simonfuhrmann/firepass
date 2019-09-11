import {LitElement, html, css} from 'lit-element';
import {customElement, property} from 'lit-element';

import {OxyInput} from '../oxygen/oxy-input'
import {sharedStyles} from './fp-styles'
import '../oxygen/oxy-input'

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
      [hidden] {
        display: none !important;
      }
    `;
  }

  private pass_: OxyInput|null = null;
  private repeat_ : OxyInput|null = null;

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

  firstUpdated() {
    if (!this.shadowRoot) return;
    this.pass_ = <OxyInput>this.shadowRoot.getElementById('pass');
    this.repeat_ = <OxyInput>this.shadowRoot.getElementById('repeat');

    setTimeout(() => {
      if (!this.pass_) return;
      this.pass_.focus();
    }, 0);
  }

  setErrorMessage(errorMessage: string) {
    this.errorMessage = errorMessage;
    this.disabled = false;
    setTimeout(() => {
      if (!this.pass_) return;
      this.pass_.focus();
      this.pass_.select();
    }, 0);
  }

  private onPassKeydown(event: KeyboardEvent) {
    if (event.keyCode != 13) return;

    this.errorMessage = '';
    if (this.createDb) {
      if (!this.repeat_) return;
      this.repeat_.focus();
      this.repeat_.select();
      return;
    }

    if (this.isFetching) return;
    if (!this.pass_) return;
    this.errorMessage = '';
    this.disabled = true;
    this.dispatchEvent(new CustomEvent('unlock', {detail: this.pass_.value}));
  }

  private onRepeatKeydown(event: KeyboardEvent) {
    if (event.keyCode != 13) return;
    if (!this.pass_ || !this.repeat_) return;
    if (this.pass_.value != this.repeat_.value) {
      this.pass_.clear();
      this.repeat_.clear();
      this.setErrorMessage('Passwords do not match');
      return;
    }
    if (this.isFetching) return;
    this.errorMessage = '';
    this.disabled = true;
    this.dispatchEvent(new CustomEvent('create', {detail: this.pass_.value}));
  }
}