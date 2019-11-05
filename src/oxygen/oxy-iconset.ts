import {svg, SVGTemplateResult} from 'lit-html';

export interface OxyIconMap {
  [key: string]: SVGTemplateResult;
}

// The global icon set registry.
let registry = new Map<string, OxyIconMap>();

// Returns the fallback icon.
function getFallbackIcon(): SVGTemplateResult {
  return svg`<path d="M0 0h1L24 23v1h-1L0 1Z M24 0v1L1 24h-1v-1L23 0Z"></path>`;
}

// Singleton API for registering and requesting icons.
export class OxyIconset {
  // Registers an icon set.
  static registerIconset(iconsetName: string, icons: OxyIconMap) {
    if (registry.has(iconsetName)) {
      throw `Iconset ${iconsetName} already registered`;
    }
    registry.set(iconsetName, icons);
  }

  // Returns the SVG template for the given icon name.
  static getIcon(iconsetName: string, iconName: string): SVGTemplateResult {
    const icons: OxyIconMap|undefined = registry.get(iconsetName);
    if (!icons) return getFallbackIcon();
    return icons[iconName] || getFallbackIcon();
  }

  // Returns all registered icon set names.
  static getIconsetNames(): string[] {
    let names: string[] = [];
    for (let name of registry.keys()) {
      names.push(name);
    }
    return names;
  }

  // Returns all icon names in an iconset.
  static getIconNames(iconsetName: string): string[] {
    let map = registry.get(iconsetName);
    return !!map ? Object.keys(map) : [];
  }
}
