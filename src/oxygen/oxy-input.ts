import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

import './oxy-icon';

// A simple input element with various opportunities for styling. Most notably,
// an icon can be specified which focuses the input when clicked.
@customElement('oxy-input')
export class OxyInput extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        margin: 2px 0;
      }
      #container {
        display: flex;
        flex-shrink: 0;
        background-color: var(--oxy-input-background-color, white);
        border: var(--oxy-input-border-width, 1px) solid
                var(--oxy-input-border-color, #ddd);
        border-radius: var(--oxy-input-border-radius, 2px);
        padding: var(--oxy-input-text-padding, 6px);
        box-shadow: var(--oxy-input-box-shadow, 0 0 0 white);
        transition: all 25ms;
      }
      :host([focused]) #container {
        background-color: var(--oxy-input-background-color-focused, white);
        border: var(--oxy-input-border-width, 1px) solid
                var(--oxy-input-border-color-focused, #ccc);
        box-shadow: var(--oxy-input-box-shadow-focused, 0 0 0 white);
      }
      input {
        flex-grow: 1;
        color: var(--oxy-input-text-color, black);
        font: inherit;
        padding: 0;
        margin: 0;
        border: none;
        box-shadow: none;
        outline: none;
        background: transparent;
        text-align: inherit;
      }
      input::placeholder {
        color: var(--oxy-input-placeholder-color);
      }
      oxy-icon {
        color: var(--oxy-input-icon-color, inherit);
        width: var(--oxy-input-icon-size, 20px);
        height: var(--oxy-input-icon-size, 20px);
        margin-right: 8px;
        cursor: pointer;
      }
      :host([focused]) oxy-icon {
        cursor: initial;
      }
      [hidden] {
        display: none !important;
      }
    `;
  }

  private input: HTMLInputElement|null = null;

  @property({type: String}) value = '';
  @property({type: String}) type = 'text';
  @property({type: String}) maxlength = '';
  @property({type: String}) placeholder = '';
  @property({type: Boolean}) readonly = false;
  @property({type: Boolean}) disabled = false;
  @property({type: Boolean, reflect: true}) focused = false;
  @property({type: Boolean}) selectOnFocus = false;
  @property({type: String}) icon = '';

  render() {
    return html`
      <div id="container">
        <oxy-icon
            .icon=${this.icon}
            ?hidden=${!this.icon}
            role="button"
            @click=${this.focus}>
        </oxy-icon>
        <input
            id="input"
            .type=${this.type}
            .value=${this.value}
            ?disabled=${this.disabled}
            ?readonly=${this.readonly}
            maxlength="${this.maxlength}"
            placeholder="${this.placeholder}"
            spellcheck="false"
            @input=${this.onValueChanged}
            @focus=${this.onFocus}
            @blur=${this.onBlur}>
      </div>
    `;
  }

  firstUpdated() {
    if (!this.shadowRoot) return;
    this.input = <HTMLInputElement>this.shadowRoot.getElementById('input');
  }

  focus() {
    if (!this.input) return;
    this.input.focus();
  }

  select() {
    if (!this.input) return;
    this.input.setSelectionRange(0, this.input.value.length);
  }

  deselect() {
    if (!this.input) return;
    this.input.setSelectionRange(0, 0);
  }

  clear() {
    this.value = '';
  }

  copyToClipboard() {
    if (this.type === 'password') {
      this.copyPasswordToClipboard();
      return;
    }
    this.focus();
    this.select();
    document.execCommand('copy');
    this.deselect();
  }

  private copyPasswordToClipboard() {
    this.type = 'text';
    this.requestUpdate('type')
        .then(() => {
          this.copyToClipboard();
          this.type = 'password';
        });
  }

  private onValueChanged() {
    if (!this.input) return;
    this.value = this.input.value;
    this.dispatchEvent(new CustomEvent('change', {detail: this.value}));
  }

  private onFocus() {
    this.focused = true;
    if (this.selectOnFocus) {
      this.select();
    }
  }

  private onBlur() {
    this.focused = false;
  }
}
