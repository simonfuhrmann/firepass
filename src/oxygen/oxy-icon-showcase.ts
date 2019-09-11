import {LitElement, html, css} from 'lit-element';
import {customElement} from 'lit-element';

import {OxyIconset} from './oxy-iconset';
import './oxy-icon';
import './oxy-icons-av';
import './oxy-icons-base';
import './oxy-icons-communication';
import './oxy-icons-device';
import './oxy-icons-editor';
import './oxy-icons-hardware';
import './oxy-icons-image';
import './oxy-icons-maps';
import './oxy-icons-notification';
import './oxy-icons-places';
import './oxy-icons-social';

@customElement('oxy-icon-showcase')
export class OxyIcon extends LitElement {
  static get styles() {
    return css`
      :host {
        padding: 32px;
      }
      .icon {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        font-size: 0.7em;
        padding: 8px;
        width: 8em;
        text-align: center;
      }
      oxy-icon {
        padding: 8px;
      }
    `;
  }

  render() {
    const iconsetNames = OxyIconset.getIconsetNames();
    return html`${iconsetNames.map(name => this.renderIconset(name))}`;
  }

  private renderIconset(iconsetName: string) {
    const iconNames = OxyIconset.getIconNames(iconsetName);
    return html`
      <h1>${iconsetName}</h1>
      ${iconNames.map(name => this.renderIcon(iconsetName, name))}
    `;
  }

  private renderIcon(iconsetName: string, name: string) {
    const iconName = iconsetName + ":" + name;
    return html`
      <div class="icon">
        <oxy-icon icon="${iconName}"></oxy-icon>
        <span>${name}</span>
      </div>
    `;
  }
}
