import {css} from 'lit';

export const sharedStyles = css`
  :host {
    --primary-text-color: #eee;
    --secondary-text-color: #ccc;
    --tertiary-text-color: #aaa;
    --disabled-text-color: #666;
    --error-text-color: #f14;
    --success-text-color: #00b31d;
    --separator-color: #333;
    --separator-color-faint: #222;
    --separator-color-clear: #444;

    --theme-color-dark: #1a1a1a;
    --theme-color-gray: #4e4e50;
    --theme-color-fire1: #6f2232;
    --theme-color-fire2: #950740;
    --theme-color-fire3: #c3073f;
    --theme-color-ice1: #0b3f4f;
    --theme-color-ice2: #14728f;
    --theme-color-ice3: #1fafdb;

    --oxy-input-text-color: white;
    --oxy-input-background-color: rgba(0, 0, 0, 0.2);
    --oxy-input-background-color-focused: rgba(0, 0, 0, 0.3);
    --oxy-input-border-color: var(--separator-color);
    --oxy-input-border-color-focused: var(--theme-color-fire3);
    --oxy-input-box-shadow: 0 2px 7px black inset;
    --oxy-input-box-shadow-focused:
        var(--oxy-input-box-shadow), 0 0 5px var(--theme-color-fire2);

    --oxy-tab-indicator-color: var(--theme-color-fire3);
    --oxy-tab-animation-duration: 200ms;
    --oxy-tabs-border-color: var(--separator-color);

    --oxy-textarea-text-color: white;
    --oxy-textarea-background-color: rgba(0, 0, 0, 0.2);
    --oxy-textarea-background-color-focused: rgba(0, 0, 0, 0.3);
    --oxy-textarea-border-color: var(--separator-color);
    --oxy-textarea-border-color-focused: var(--theme-color-fire3);
    --oxy-textarea-box-shadow: 0 2px 7px black inset;
    --oxy-textarea-box-shadow-focused:
        var(--oxy-input-box-shadow), 0 0 5px var(--theme-color-fire2);

    --oxy-checkbox-unchecked-background: var(--separator-color);
    --oxy-checkbox-unchecked-border: 2px solid var(--disabled-text-color);
    --oxy-checkbox-checked-background: var(--theme-color-fire3);
    --oxy-checkbox-check-color: var(--primary-text-color);

    --oxy-slider-track-color: var(--theme-color-ice2);
    --oxy-slider-track-active-color: var(--theme-color-ice2);
    --oxy-slider-thumb-color: var(--theme-color-ice3);
    --oxy-slider-thumb-active-color: var(--theme-color-ice3);

    --oxy-dialog-background: #333;
    --oxy-dialog-text-color: var(--primary-text-color);
    --oxy-dialog-min-width: 300px;

    --oxy-scrollbar-width: 12px;
    --oxy-scrollbar-track-color: transparent;
    --oxy-scrollbar-track-border-radius: 0;
    --oxy-scrollbar-thumb-color: transparent;
    --oxy-scrollbar-thumb-border: 1px solid transparent;
    --oxy-scrollbar-thumb-border-radius: 3px;
    --oxy-scrollbar-thumb-box-shadow:
        inset 0 0 0 var(--oxy-scrollbar-width) var(--disabled-text-color);
    --oxy-scrollbar-thumb-hover-color: transparent;
    --oxy-scrollbar-thumb-hover-box-shadow:
        inset 0 0 0 var(--oxy-scrollbar-width) var(--tertiary-text-color);
  }

  .scrollable::-webkit-scrollbar {
    width: var(--oxy-scrollbar-width);
  }
  .scrollable::-webkit-scrollbar-track {
    background: var(--oxy-scrollbar-track-color);
    border-radius: var(--oxy-scrollbar-track-border-radius);
  }
  .scrollable::-webkit-scrollbar-thumb {
    background: var(--oxy-scrollbar-thumb-color);
    border: var(--oxy-scrollbar-thumb-border);
    border-radius: var(--oxy-scrollbar-thumb-border-radius);
    box-shadow: var(--oxy-scrollbar-thumb-box-shadow);
  }
  .scrollable::-webkit-scrollbar-thumb:hover {
    background: var(--oxy-scrollbar-thumb-hover-color);
    box-shadow: var(--oxy-scrollbar-thumb-hover-box-shadow);
  }

  [hidden] {
    display: none !important;
  }
`;
