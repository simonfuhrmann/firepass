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
        z-index: 3;

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

  private timeoutId: number = -1;

  @property({type: Boolean, reflect: true}) opened = false;
  @property({type: String}) message = '';

  render() {
    return html`
      <div id="container">
        <div id="message" ?hidden=${!this.message}>${this.message}</div>
        <slot></slot>
      </div>
    `;
  }

  /** Opens the toast for 2 seconds. */
  openShort(message: string = '') {
    this.open(2000, message);
  }

  /** Opens the toast for 3.5 seconds. */
  openNormal(message: string = '') {
    this.open(3500, message);
  }

  /** Opens the toast for 6 seconds. */
  openLong(message: string = '') {
    this.open(6000, message);
  }

  /** Opens the toast, and auto-closes the toast if duration is set > 0. */
  open(durationMs: number, message: string) {
    this.message = message;
    this.opened = true;
    this.setTimeout(durationMs);
  }

  /** Closes the toast. */
  close() {
    this.opened = false;
    this.setTimeout(0);
  }

  private setTimeout(durationMs: number) {
    if (this.timeoutId >= 0) {
      window.clearTimeout(this.timeoutId);
    }
    if (durationMs > 0) {
      this.timeoutId = window.setTimeout(() => {
        this.timeoutId = -1;
        this.close();
      }, durationMs);
    }
  }
}
