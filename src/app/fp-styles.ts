import {css} from 'lit-element';

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

    --theme-color-dark: #1a1a1a;
    --theme-color-gray: #4e4e50;
    --theme-color-accent1: #6f2232;
    --theme-color-accent2: #950740;
    --theme-color-accent3: #c3073f;

    --oxy-input-text-color: white;
    --oxy-input-background-color: rgba(0, 0, 0, 0.2);
    --oxy-input-background-color-focused: rgba(0, 0, 0, 0.3);
    --oxy-input-border-color: var(--separator-color);
    --oxy-input-border-color-focused: var(--theme-color-accent3);
    --oxy-input-box-shadow: 0 2px 7px black inset;
    --oxy-input-box-shadow-focused: var(--oxy-input-box-shadow),
                                    0 0 5px var(--theme-color-accent2);
  }`;