import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

// A simple button element with some default styles. The button can be
// customized using CSS variables:
//   --button-background-color
//   --button-text-color
// Further, if the 'raised' attribute is set, the button obtains a shadow.
// If the 'disabled' attribute is set, pointer events are ignored.
@customElement('oxy-button')
export class OxyButton extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        position: relative;
        font-weight: 500;
        background-color: var(--oxy-button-background-color, transparent);
        border-radius: 4px;
        outline: none;
        cursor: pointer;
        user-select: none;
      }
      :host::before {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        pointer-events: none;
        border-radius: inherit;
        content: "";
        opacity: 0;
        transition: opacity 25ms;
      }
      :host(:hover)::before {
        background-color: var(--oxy-button-hover-color,
                          var(--oxy-button-text-color, currentcolor));
        opacity: 0.1;
      }
      /* Use :focus-visible once supported. */
      :host(:focus)::before {
        background-color: var(--oxy-button-focus-color,
                          var(--oxy-button-text-color, currentcolor));
        opacity: 0.15;
      }
      :host(:active)::before {
        background-color: var(--oxy-button-active-color,
                          var(--oxy-button-text-color, currentcolor));
        opacity: 0.2;
      }
      :host([disabled]) {
        opacity: 0.5;
        pointer-events: none;
      }
      :host([raised]) {
        padding: 8px 16px;
        box-shadow: 0 3px 1px -2px rgba(0, 0, 0, 0.2),
                    0 2px 2px 0 rgba(0, 0, 0, 0.14),
                    0 1px 5px 0 rgba(0, 0, 0, 0.12);
      }`;
  }

  @property({type: Boolean, reflect: true}) raised = false;
  @property({type: Boolean, reflect: true}) disabled = false;

  firstUpdated() {
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'button');
    this.updateAriaDisabled();
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('disabled')) {
      this.updateAriaDisabled();
    }
  }

  render() {
    return html`<slot></slot>`;
  }

  private updateAriaDisabled() {
    if (this.disabled) {
      this.setAttribute('aria-disabled', 'true');
    } else {
      this.removeAttribute('aria-disabled');
    }
  }
}
