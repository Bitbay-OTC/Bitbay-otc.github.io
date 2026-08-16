/**
 * Minimal DOM construction helpers.
 *
 * No framework, no virtual DOM. Views build real elements and hand them
 * back; the router swaps them wholesale. `h` sets properties rather than
 * attributes where it can, so event handlers and `.value` behave normally.
 *
 * Text content is assigned via textContent, never innerHTML, so nothing a
 * counterparty types can become markup.
 */

type Child = Node | string | number | null | undefined | false;

export interface ElementProps {
  class?: string;
  id?: string;
  text?: string | number;
  html?: never; // deliberately unavailable — build nodes instead
  title?: string;
  href?: string;
  type?: string;
  value?: string;
  placeholder?: string;
  disabled?: boolean;
  checked?: boolean;
  hidden?: boolean;
  tabIndex?: number;
  role?: string;
  dataset?: Record<string, string>;
  style?: Partial<CSSStyleDeclaration>;
  aria?: Record<string, string | null>;
  on?: Partial<{
    [K in keyof HTMLElementEventMap]: (ev: HTMLElementEventMap[K]) => void;
  }>;
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: ElementProps = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);

  if (props.class) el.className = props.class;
  if (props.id) el.id = props.id;
  if (props.text !== undefined) el.textContent = String(props.text);
  if (props.title) el.title = props.title;
  if (props.role) el.setAttribute('role', props.role);
  if (props.tabIndex !== undefined) el.tabIndex = props.tabIndex;
  if (props.hidden) el.hidden = true;

  if (props.href && el instanceof HTMLAnchorElement) el.href = props.href;
  if (props.type && 'type' in el) (el as HTMLInputElement).type = props.type;
  if (props.value !== undefined && 'value' in el) (el as HTMLInputElement).value = props.value;
  if (props.placeholder && 'placeholder' in el) {
    (el as HTMLInputElement).placeholder = props.placeholder;
  }
  if (props.disabled !== undefined && 'disabled' in el) {
    (el as HTMLButtonElement).disabled = props.disabled;
  }
  if (props.checked !== undefined && 'checked' in el) {
    (el as HTMLInputElement).checked = props.checked;
  }

  if (props.dataset) for (const [k, v] of Object.entries(props.dataset)) el.dataset[k] = v;
  if (props.style) Object.assign(el.style, props.style);
  if (props.aria) {
    for (const [k, v] of Object.entries(props.aria)) {
      if (v === null) el.removeAttribute(`aria-${k}`);
      else el.setAttribute(`aria-${k}`, v);
    }
  }
  if (props.on) {
    for (const [name, handler] of Object.entries(props.on)) {
      el.addEventListener(name, handler as EventListener);
    }
  }

  append(el, children);
  return el;
}

export function append(parent: Node, children: Child[]): void {
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    parent.appendChild(typeof child === 'object' ? child : document.createTextNode(String(child)));
  }
}

export function fragment(...children: Child[]): DocumentFragment {
  const f = document.createDocumentFragment();
  append(f, children);
  return f;
}

/** Replace an element's contents in one operation. */
export function render(host: Element, ...children: Child[]): void {
  host.replaceChildren();
  append(host, children);
}

/** Inline SVG icon from a path spec. Icons are decorative unless labelled. */
export function icon(path: string, opts: { size?: number; label?: string } = {}): SVGSVGElement {
  const size = opts.size ?? 16;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', String(size));
  svg.setAttribute('height', String(size));
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.75');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.classList.add('icon');
  if (opts.label) {
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', opts.label);
  } else {
    svg.setAttribute('aria-hidden', 'true');
  }
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}

export const ICONS = {
  dashboard: 'M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z',
  board: 'M3 6h18M3 12h18M3 18h18',
  deals: 'M4 6h16v12H4zM4 10h16M9 6v12',
  history: 'M12 8v5l3 2M3 12a9 9 0 1 0 3-6.7M3 4v4h4',
  balances: 'M3 7h18v11H3zM3 7l3-3h12l3 3M8 13h8',
  message: 'M21 12a8 8 0 0 1-11.6 7.1L3 21l1.9-6.4A8 8 0 1 1 21 12Z',
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  check: 'M4 12.5 9 17.5 20 6.5',
  alert: 'M12 8v5M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z',
  search: 'M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm10 2-4.35-4.35',
  close: 'M18 6 6 18M6 6l12 12',
  filter: 'M3 5h18l-7 8v6l-4 2v-8L3 5Z',
  sun: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  wallet: 'M3 7h15a3 3 0 0 1 3 3v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Zm0 0 2.5-3H17M17 13h.01',
} as const;
