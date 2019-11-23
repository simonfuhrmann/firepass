import {LitElement, html, css} from 'lit-element';
import {property, customElement, query} from 'lit-element';

// A simple dialog custom element.
//
// - Attribute 'backdrop': Makes a modal dialg (prevent clicks on background).
// - Attribute 'noescape': Disables ESC key or click on backdrop to close.
// - Call open() or close() to open/close the dialog.
// - Events 'open' and 'close' are fired on open/close.
//
// Focus trapping is currently not implemented. Which means that focus can
// leave the dialog, and focus is not reset after the dialog is closed.
@customElement('oxy-dialog')
export class OxyDialog extends LitElement {
    static get styles() {
    return css`
      :host {
        display: none;
      }
      :host([opened]) {
        display: block;
      }
      #backdrop {
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        bottom: 0;
        background: var(--oxy-dialog-backdrop-background, rgba(0, 0, 0, 0.3));
        z-index: 10;
      }
      #layout {
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 11;
        pointer-events: none;
      }
      #dialog {
        background: var(--oxy-dialog-background, white);
        color: var(--oxy-dialog-text-color, black);
        min-width: var(--oxy-dialog-min-width, 200px);
        max-width: var(--oxy-dialog-max-width, 500px);
        flex-shrink: 0;
        box-shadow: var(--oxy-dialog-box-shadow, 0 8px 64px rgba(0, 0, 0, 0.5));
        border-radius: 4px;
        pointer-events: auto;
      }
      h2 {
        font-size: 1.2em;
        line-height: 2em;
        margin: 0;
        padding: 16px 16px 8px 16px;
      }
      slot[name="buttons"] {
        display: flex;
        flex-direction: row;
        justify-content: flex-end;
        padding: 16px 8px 8px 8px;
      }
      [hidden] {
        display: none !important;
      }
    `;
  }

  private readonly keyListener = this.onKeydown.bind(this);

  @query('#backdrop') backdropElem: HTMLElement|undefined;
  @query('#dialog') dialogElem: HTMLElement|undefined;
  @property({type: Boolean, reflect: true}) opened = false;
  @property({type: String}) heading: string = '';
  @property({type: Boolean}) backdrop = false;
  @property({type: Boolean}) noescape = false;
  @property({type: Boolean}) showBackdrop = false;

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('opened')) {
      if (this.opened) {
        this.afterOpen();
      } else {
        this.afterClose();
      }
    }
  }

  render() {
    return html`
      <div
          id="backdrop"
          ?hidden=${!this.showBackdrop}
          @click=${this.onBackdropClick}>
      </div>

      <div id="layout">
        <div id="dialog">
          ${this.heading ? html`<h2>${this.heading}</h2>` : html``}
          <slot></slot>
          <slot name="buttons"></slot>
        </div>
      </div>
    `;
  }

  open() {
    this.opened = true;
  }

  close() {
    this.opened = false;
  }

  private afterOpen() {
    this.showBackdrop = this.backdrop;
    this.addKeyListener();
    this.saveAndMoveFocus();
    this.dispatchEvent(new CustomEvent('opened'));
  }

  private afterClose() {
    this.showBackdrop = false;
    this.removeKeyListener();
    this.restoreFocus();
    this.dispatchEvent(new CustomEvent('closed'));
  }

  private addKeyListener() {
    document.body.addEventListener('keydown', this.keyListener);
  }

  private removeKeyListener() {
    document.body.removeEventListener('keydown', this.keyListener);
  }

  private onBackdropClick() {
    if (!this.noescape) {
      this.close();
    }
  }

  private onKeydown(event: KeyboardEvent) {
    switch(event.key) {
      case 'Escape':
        event.preventDefault();
        this.onEscapePress();
        break;
      case 'Tab':
        event.preventDefault();
        this.onTabPress();
        break;
    }
  }

  private onEscapePress() {
    if (!this.noescape) {
      this.close();
    }
  }

  // FIXME: Saving focus not implemented, document.activeElement does not
  // work across shadow DOMs.
  private saveAndMoveFocus() {
  }

  // FIXME: Restoring focus not implemented, see saveAndMoveFocus().
  private restoreFocus() {
  }

  // FIXME: Focus trap not implemented. There are two difficulties:
  // 1. A simple query selector does not work with shadow DOM
  // 2. The only real child of this shadow DOM is a slot.
  private onTabPress() {
  }
}
