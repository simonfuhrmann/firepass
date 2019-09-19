import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

// A simple dialog custom element.
//
// - Attribute 'backdrop': Makes a modal dialg (prevent clicks on background).
// - Attribute 'noescape': Disables ESC key or click on backdrop to close.
// - Call open() or close() to open/close the dialog.
// - Events 'open' and 'close' are fired on open/close.
//
// Focus trapping is currently not implemented. Which means that focus can
// leave the dialog, and focus is not reset after the dialog is closed.
// This component does not provide styles. Style the dialog using CSS on the
// host element, such as min-width, or background directives.
@customElement('oxy-dialog')
export class OxyDialog extends LitElement {
  static get styles() {
    return css`
      :host {
        z-index: 3;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%,-50%);
        outline: none;
      }
      :host(:not([opened])) {
        display: none;
      }
    `;
  }

  private static KEY_TAB = 9;
  private static KEY_ESC = 27;

  private backdropElem: HTMLElement|null = null;
  private keyListener = (event: KeyboardEvent) => this.onKeydown(event);

  @property({type: Boolean, reflect: true}) opened = false;
  @property({type: Boolean}) backdrop = false;
  @property({type: Boolean}) noescape = false;

  render() {
    return html`
      <slot></slot>
    `;
  }

  open() {
    this.opened = true;
  }

  close() {
    this.opened = false;
  }

  updated(changedProps: Map<string, any>) {
    if (changedProps.has('opened')) {
      if (this.opened) {
        this.onOpen();
      } else {
        this.onClose();
      }
    }
  }

  private onOpen() {
    if (this.backdrop) {
      this.addBackdropToBody();
    }
    if (!this.noescape) {
      this.addKeyListener();
    }
    this.saveAndMoveFocus();
    this.focus();
    this.dispatchEvent(new CustomEvent('open'));
  }

  private onClose() {
    this.removeBackdropFromBody();
    this.removeKeyListener();
    this.restoreFocus();
    this.dispatchEvent(new CustomEvent('close'));
  }

  private addBackdropToBody() {
    if (!this.backdropElem) {
      const elem = document.createElement('div');
      elem.id = 'oxy-dialog-backdrop';
      elem.style.position = 'fixed';
      elem.style.left = '0';
      elem.style.right = '0';
      elem.style.top = '0';
      elem.style.bottom = '0';
      elem.style.background = 'rgba(0, 0, 0, 0.5)';
      elem.style.zIndex = '2';
      elem.addEventListener('click', () => this.onBackdropClick());
      this.backdropElem = elem;
    }
    document.body.appendChild(this.backdropElem);
  }

  private removeBackdropFromBody() {
    if (!this.backdropElem) return;
    document.body.removeChild(this.backdropElem);
  }

  private addKeyListener() {
    document.body.addEventListener('keydown', this.keyListener);
  }

  private removeKeyListener() {
    document.body.removeEventListener('keydown', this.keyListener);
  }

  private onKeydown(event: KeyboardEvent) {
    switch(event.keyCode) {
      case OxyDialog.KEY_ESC:
        event.preventDefault();
        this.onEscapePress();
        break;
      case OxyDialog.KEY_TAB:
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

  private onBackdropClick() {
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
