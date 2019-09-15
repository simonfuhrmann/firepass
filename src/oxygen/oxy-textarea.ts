import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

@customElement('oxy-textarea')
export class OxyTextarea extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        flex-direction: column;
        flex-shrink: 0;
      }
      #container {
        display: flex;
        flex-grow: 1;
        flex-shrink: 0;
        align-items: stretch;
        background-color: var(--oxy-textarea-background-color, white);
        border: var(--oxy-textarea-border-width, 1px) solid
                var(--oxy-textarea-border-color, #ddd);
        border-radius: var(--oxy-textarea-border-radius, 2px);
        box-shadow: var(--oxy-textarea-box-shadow, 0 0 0 white);
        transition: all 50ms;
      }
      :host([focused]) #container {
        background-color: var(--oxy-textarea-background-color-focused, white);
        border: var(--oxy-textarea-border-width, 1px) solid
                var(--oxy-textarea-border-color-focused, #ddd);
        box-shadow: var(--oxy-textarea-box-shadow-focused, 0 0 0 white);
      }
      textarea {
        flex-grow: 1;
        flex-shrink: 0;
        padding: var(--oxy-textarea-text-padding, 6px);
        color: var(--oxy-textarea-text-color, black);
        font: inherit;
        margin: 0;
        border: none;
        box-shadow: none;
        box-sizing: border-box;
        outline: none;
        background: transparent;
        width: 100%;
        resize: var(--oxy-textarea-resize, none);
      }
      textarea::-webkit-scrollbar {
        width: var(--oxy-scrollbar-width, 12px);
      }
      textarea::-webkit-scrollbar-track {
        background: var(--oxy-scrollbar-track-color, #eee);
        border-radius: var(--oxy-scrollbar-track-border-radius, 0);
      }
      textarea::-webkit-scrollbar-thumb {
        background: var(--oxy-scrollbar-thumb-color, #888);
        border: 1px solid var(--oxy-scrollbar-track-color, #eee);
        border-radius: var(--oxy-scrollbar-thumb-border-radius, 0);
      }
      textarea::-webkit-scrollbar-thumb:hover {
        background: var(--oxy-scrollbar-thumb-hover-color, #555);
      }
    `;
  }

  private textarea_: HTMLInputElement|null = null;

  @property({type: String}) value = '';
  @property({type: String}) placeholder = '';
  @property({type: Boolean}) readonly = false;
  @property({type: Boolean}) disabled = false;
  @property({type: Boolean, reflect: true}) focused = false;
  @property({type: Boolean}) selectOnFocus = false;

  render() {
    return html`
      <div id="container">
      <textarea
          id="area"
          .value=${this.value}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          placeholder="${this.placeholder}"
          @input=${this.onValueChanged}
          @focus=${this.onFocus}
          @blur=${this.onBlur}></textarea></div>
    `;
  }

  firstUpdated() {
    if (!this.shadowRoot) return;
    this.textarea_ = <HTMLInputElement>this.shadowRoot.getElementById('area');
  }

  focus() {
    if (!this.textarea_) return;
    this.textarea_.focus();
  }

  select() {
    if (!this.textarea_) return;
    this.textarea_.setSelectionRange(0, this.textarea_.value.length);
  }

  private onValueChanged() {
    if (!this.textarea_) return;
    this.value = this.textarea_.value;
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
