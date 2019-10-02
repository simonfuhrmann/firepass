import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

@customElement('oxy-toast')
export class OxyToast extends LitElement {
  static get styles() {
    return css`
      :host {
        position: fixed;
        bottom: 16px;
        left: 16px;
        z-index: 2;

        opacity: 0;
        transform: translateY(100px);
        transition: transform 200ms, opacity 200ms;
      }
      :host([opened]) {
        opacity: 1;
        transform: translateY(0);
      }
      #container {
        display: flex;
        flex-direction: row;
        align-items: center;
        min-height: 40px;
        box-sizing: border-box;
        padding: 8px 16px;
        background: var(--oxy-toast-background, #090909);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
      }
    `;
  }

  @property({type: Boolean, reflect: true}) opened = false;

  render() {
    return html`
      <div id="container">
        <slot></slot>
      </div>
    `;
  }

  /** Opens a toast for 2 seconds. */
  openShort() {
    this.open(2000);
  }

  /** Opens a toast for 3.5 seconds. */
  openNormal() {
    this.open(3500);
  }

  /** Opens a toast for 6 seconds. */
  openLong() {
    this.open(6000);
  }

  open(durationMs: number) {
    this.opened = true;
    setTimeout(() => this.close(), durationMs);
  }

  close() {
    this.opened = false;
  }
}
