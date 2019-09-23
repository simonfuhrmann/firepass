import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

@customElement('oxy-tab')
export class OxyTab extends LitElement {
  static get styles() {
    return css`
      :host {
        position: relative;
        display: block;
        box-sizing: border-box;
        font-weight: 500;
        cursor: pointer;
        outline: none;
        overflow: hidden;
        min-width: 64px;
        user-select: none;
        opacity: 0.7;
      }
      :host(:hover),
      :host([selected]) {
        opacity: 1.0;
      }
      :host([orientation="horizontal"]) {
        padding: 8px 16px;
      }
      :host([orientation="vertical"]) {
        padding: 8px 16px;
      }
      :host::before {
        display: block;
        content: "";
        position: absolute;
        background-color: var(--oxy-tab-indicator-color, #333);
        transition: var(--oxy-tab-animation-duration, 100ms) all;
        transition-timing-function: cubic-bezier(.15, .35, .5, 1.5);
      }
      :host([orientation="horizontal"])::before {
        bottom: 0;
        left: 50%;
        height: 3px;
        width: 0%;
        border-radius: 3px 3px 0 0;
        box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.0);
      }
      :host([orientation="horizontal"][selected])::before {
        box-shadow: 0 -1px 2px rgba(0, 0, 0, 0.5);
        width: 50%;
        left: 25%;
      }
      :host([orientation="vertical"])::before {
        left: 0;
        bottom: 50%;
        width: 3px;
        height: 0%;
        border-radius: 0 3px 3px 0;
        box-shadow: -1px 0 2px rgba(0, 0, 0, 0.0);
      }
      :host([orientation="vertical"][selected])::before {
        box-shadow: 1px 0 2px rgba(0, 0, 0, 0.5);
        height: 70%;
        bottom: 15%;
      }
    `;
  }

  @property({type: String, reflect: true}) orientation = 'horizontal';
  @property({type: Boolean, reflect: true}) selected = false;

  constructor() {
    super();
    this.setAttribute('role', 'tab');
  }

  render() {
    return html`<slot></slot>`;
  }
}
