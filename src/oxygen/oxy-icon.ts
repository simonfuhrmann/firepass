import {LitElement, html, css} from 'lit-element';
import {property, customElement} from 'lit-element';

import {OxyIconset} from './oxy-iconset';

// A simple element to display an icon. Icons have to be registered using icon
// sets first. An icon is specified using the set and icon name, e.g.:
//   <oxy-icon icon="image:photo"></oxy-icon>
// To ensure the icon set is loaded, it must be imported in the client.
@customElement('oxy-icon')
export class OxyIcon extends LitElement {
  static get styles() {
    return css`
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        fill: currentcolor;
        stroke: none;
        stroke-width: 0;
        width: 24px;
        height: 24px;
      }
      svg {
        display: block;
        width: 100%;
        height: 100%
      }
    `;
  }

  @property({type: String}) icon = '';

  render() {
    const parts = this.icon.split(':');
    const iconsetName = parts[0] || '';
    const iconName = parts[1] || '';
    const groupSpec = OxyIconset.getIcon(iconsetName, iconName);
    return html`
      <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          preserveAspectRatio="xMidYMid meet">
        <g>${groupSpec}</g>
      </svg>`;
  }
}
