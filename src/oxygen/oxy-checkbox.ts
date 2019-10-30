import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

@customElement('oxy-checkbox')
export class OxyCheckbox extends LitElement {
  static get styles() {
    return css`
      :host {
        display: flex;
        align-items: center;
        user-select: none;
        outline: 0;
      }
      :host([disabled]) {
        pointer-events: none;
        opacity: 0.5;
      }

      :host #checkbox {
        flex-shrink: 0;
        position: relative;
        width: 1.2em;
        height: 1.2em;
        border-radius: 4px;
        margin: 4px;
        box-sizing: border-box;
        background: var(--oxy-checkbox-unchecked-background, #aaa);
        border: var(--oxy-checkbox-unchecked-border, 2px solid #999);
      }
      :host([checked]) #checkbox,
      :host([indeterminate]) #checkbox {
        border: none;
        background: var(--oxy-checkbox-checked-background, #28f);
      }
      :host(:active) #checkbox {
        transform: scale(1.1);
        transition: transform 50ms;
      }
      :host #checkbox::after {
        position: absolute;
        content: "";
      }
      :host([checked]) #checkbox::after {
        top: 10%;
        left: 32%;
        width: 0.3em;
        height: 0.6em;
        border: 0 solid var(--oxy-checkbox-check-color, white);
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
      :host([indeterminate]) #checkbox::after {
        top: 45%;
        left: 20%;
        right: 20%;
        width: auto;
        height: 10%;
        background: var(--oxy-checkbox-check-color, white);
      }
      :host #label {
        margin: 4px 8px;
        flex-grow: 1;
      }
    `;
  }

  firstUpdated() {
    this.setAttribute('role', 'checkbox');
    this.setAttribute('tabindex', '0');
    this.addEventListener('click', () => this.onClick());
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('disabled')) {
      if (this.disabled) {
        this.setAttribute('aria-disabled', 'true');
      } else {
        this.removeAttribute('aria-disabled');
      }
    }
    if (changedProps.has('checked')) {
      this.setAttribute('aria-checked', this.checked ? 'true' : 'false');
      this.dispatchEvent(new CustomEvent('change', {detail: this.checked}));
    }
  }

  @property({type: Boolean, reflect: true}) checked: boolean = false;
  @property({type: Boolean, reflect: true}) indeterminate: boolean = false;
  @property({type: Boolean, reflect: true}) disabled: boolean = false;

  render() {
    return html`
      <div id="checkbox"></div>
      <div id="label">
        <slot></slot>
      </div>
    `;
  }
  private onClick() {
    if (this.disabled) return;
    if (this.indeterminate) {
      this.indeterminate = false;
      this.checked = false;
      return;
    }
    this.checked = !this.checked;
  }
}
