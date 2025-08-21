import {LitElement, css, html} from 'lit';
import {property, customElement} from 'lit/decorators.js';

import 'oxygen-mdc/oxy-button';
import 'oxygen-mdc/oxy-dialog';
import 'oxygen-mdc/oxy-icon';
import 'oxygen-mdc/oxy-icons-all';

import {sharedStyles} from './fp-styles';
import './fp-icons-logos';

@customElement('fp-db-entry-icons')
export class FpDbEntryIcons extends LitElement {
  static get styles() {
    return css`
      ${sharedStyles}
      oxy-dialog {
        --oxy-dialog-min-width: 60%;
        --oxy-dialog-max-width: 80%;
        --oxy-dialog-max-height: 100%;
      }
      #container {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        max-height: 50vh;
        overflow-y: auto;
        margin: 0 16px;
      }
      #container oxy-button {
        margin: 6px;
        padding: 6px;
        background-color: rgba(0, 0, 0, 0.25);
        --oxy-button-hover-color: var(--theme-color-ice3);
        --oxy-button-active-color: var(--theme-color-ice3);
      }
    `;
  }

  private readonly icons: string[] = [
    'logos:amazon',
    'logos:apple',
    'logos:google',
    'logos:facebook',
    'logos:instagram',
    'logos:twitter',
    'logos:whatsapp',
    'logos:skype',
    'logos:slack',
    'logos:windows',
    'logos:xbox',
    'logos:dropbox',
    'logos:github',
    'logos:steam',
    'logos:battlenet',
    'logos:uplay',
    'logos:paypal',
    'logos:visa',
    'logos:mastercard',
    'logos:amex',
    'logos:linkedin',
    'icons:account-box',
    'icons:account-circle',
    'icons:alarm',
    'icons:android',
    'icons:assessment',
    'icons:attachment',
    'icons:book',
    'icons:bug-report',
    'icons:build',
    'icons:cloud-queue',
    'icons:code',
    'icons:delete',
    'icons:euro-symbol',
    'editor:attach-money',
    'editor:insert-drive-file',
    'icons:explore',
    'icons:extension',
    'icons:face',
    'icons:favorite',
    'icons:fingerprint',
    'icons:flight-takeoff',
    'icons:folder-open',
    'icons:home',
    'icons:inbox',
    'icons:language',
    'icons:lightbulb-outline',
    'icons:link',
    'icons:payment',
    'icons:room',
    'icons:settings',
    'icons:star-border',
    'icons:supervisor-account',
    'av:games',
    'av:movie',
    'communication:business',
    'communication:chat-bubble',
    'communication:message',
    'communication:email',
    'communication:mail-outline',
    'communication:phone',
    'communication:vpn-key',
    'device:sd-storage',
    'device:wifi-lock',
    'hardware:desktop-mac',
    'hardware:desktop-windows',
    'hardware:laptop',
    'hardware:security',
    'image:camera',
    'image:camera-alt',
    'image:music-note',
    'maps:directions-bike',
    'maps:directions-bus',
    'maps:directions-car',
    'maps:local-airport',
    'maps:local-bar',
    'maps:local-cafe',
    'maps:local-gas-station',
    'maps:local-grocery-store',
    'maps:local-hospital',
    'maps:local-hotel',
    'maps:local-shipping',
    'maps:restaurant',
    'social:public',
    'social:school',
    'social:whatshot',
  ];

  @property({type: Boolean, reflect: true}) opened = false;

  open() {
    this.opened = true;
  }

  close() {
    this.opened = false;
  }

  override render() {
    return html`
      <oxy-dialog
          backdrop
          heading="Select icon"
          ?opened=${this.opened}
          @close=${this.onClose}>
        <div id="container" class="scrollable">
          ${this.icons.map(icon => this.renderIcon(icon))}
        </div>
        <div slot="buttons">
          <oxy-button text @click=${this.close}>Cancel</oxy-button>
        </div>
      </oxy-dialog>
    `;
  }

  private renderIcon(icon: string) {
    return html`
      <oxy-button @click=${() => this.onSelected(icon)}>
        <oxy-icon icon=${icon}></oxy-icon>
      </oxy-button>
    `;
  }

  private onSelected(icon: string) {
    this.close();
    this.dispatchEvent(new CustomEvent('changed', {detail: icon}));
  }

  private onClose() {
    this.close();
    this.dispatchEvent(new CustomEvent('changed', {detail: ''}));
  }
}
