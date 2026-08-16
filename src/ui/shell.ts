/**
 * Application shell: top bar, navigation rail, theme control.
 *
 * The shell owns nothing but chrome. It exposes `setActive` and
 * `setCounts` so the router can keep navigation in sync without the shell
 * knowing what a route means.
 */

import { h, icon, ICONS, render } from './dom';
import { href, router } from '../router';
import { shortAddress } from './format';
import type { ConnectionState } from '../data/types';

type ThemeChoice = 'light' | 'dark' | 'system';
const THEME_KEY = 'bitbay-otc.theme';

function readTheme(): ThemeChoice {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'system';
}

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', choice);
}

/** Effective theme, accounting for the system preference. */
function effectiveTheme(choice: ThemeChoice): 'light' | 'dark' {
  if (choice !== 'system') return choice;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

interface NavEntry {
  route: string;
  path: string;
  label: string;
  iconPath: string;
}

const NAV: NavEntry[] = [
  { route: 'dashboard', path: '/', label: 'Desk', iconPath: ICONS.dashboard },
  { route: 'market', path: '/market', label: 'Market board', iconPath: ICONS.board },
  { route: 'deals', path: '/deals', label: 'Settlements', iconPath: ICONS.deals },
  { route: 'history', path: '/history', label: 'History', iconPath: ICONS.history },
  { route: 'balances', path: '/balances', label: 'Balances', iconPath: ICONS.balances },
];

export class Shell {
  readonly outlet: HTMLElement;
  #navLinks = new Map<string, HTMLAnchorElement>();
  #connEl: HTMLElement;
  #themeBtn: HTMLButtonElement;
  #theme: ThemeChoice = readTheme();

  constructor(root: HTMLElement) {
    applyTheme(this.#theme);

    this.#connEl = h('span', { class: 'conn' });
    this.#themeBtn = h('button', {
      class: 'icon-btn',
      type: 'button',
      on: { click: () => this.#cycleTheme() },
    });
    this.#paintThemeButton();

    const navToggle = h(
      'button',
      {
        class: 'icon-btn',
        type: 'button',
        aria: { label: 'Toggle navigation', expanded: 'false' },
        on: { click: () => this.toggleNav() },
      },
      icon(ICONS.board, { size: 16 }),
    );
    navToggle.classList.add('nav-toggle');
    // Only meaningful below the rail breakpoint; CSS hides the rail there.
    navToggle.style.display = '';

    const topbar = h(
      'header',
      { class: 'topbar' },
      navToggle,
      h(
        'a',
        { class: 'brand', href: href('/'), aria: { label: 'BitBay OTC Desk' } },
        h('span', { class: 'brand__mark', text: 'B' }),
        h('span', { text: 'BitBay' }),
        h('span', { class: 'brand__tag', text: 'OTC Desk' }),
      ),
      h('span', { class: 'topbar__spacer' }),
      h('div', { class: 'topbar__actions' }, this.#connEl, this.#themeBtn),
    );

    const railGroup = h('nav', { class: 'rail__group', aria: { label: 'Desk sections' } });
    for (const entry of NAV) {
      const link = h(
        'a',
        { class: 'nav-item', href: href(entry.path) },
        icon(entry.iconPath, { size: 17 }),
        h('span', { text: entry.label }),
      );
      this.#navLinks.set(entry.route, link);
      railGroup.appendChild(link);
    }

    const rail = h(
      'aside',
      { class: 'rail' },
      railGroup,
      h(
        'div',
        { class: 'rail__foot' },
        h('p', { class: 'rail__note', id: 'adapter-note' }),
      ),
    );

    const scrim = h('button', {
      class: 'scrim',
      type: 'button',
      tabIndex: -1,
      aria: { label: 'Close navigation' },
      on: { click: () => this.closeNav() },
    });

    this.outlet = h('main', { class: 'main', id: 'desk-main' });

    render(
      root,
      h('a', { class: 'skip-link', href: '#desk-main', text: 'Skip to content' }),
      topbar,
      rail,
      scrim,
      this.outlet,
    );

    // Route changes always dismiss the mobile drawer.
    window.addEventListener('hashchange', () => this.closeNav());
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeNav();
    });
  }

  setActive(routeName: string): void {
    // Detail routes highlight their parent section.
    const parent =
      routeName === 'offer' ? 'market' : routeName === 'deal' ? 'deals' : routeName;
    for (const [name, link] of this.#navLinks) {
      if (name === parent) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    }
  }

  /** Badge counts on nav entries. Pass null to clear. */
  setCount(routeName: string, count: number | null, attention = false): void {
    const link = this.#navLinks.get(routeName);
    if (!link) return;
    link.querySelector('.nav-item__count')?.remove();
    if (count === null || count <= 0) return;
    link.appendChild(
      h('span', {
        class: `nav-item__count${attention ? ' nav-item__count--attention' : ''}`,
        text: String(count),
      }),
    );
  }

  setConnection(state: ConnectionState): void {
    const cls =
      state.error ? 'conn conn--warn' : state.connected ? 'conn conn--on' : 'conn';
    this.#connEl.className = cls;
    render(
      this.#connEl,
      h('span', { class: 'conn__dot' }),
      h('span', { text: state.error ? 'Not wired' : state.connected ? state.label : 'Disconnected' }),
      state.account
        ? h('span', { class: 'conn__addr', text: shortAddress(state.account), title: state.account })
        : null,
    );
    this.#connEl.title = state.error ?? `${state.kind} adapter`;

    const note = document.getElementById('adapter-note');
    if (note) {
      note.textContent =
        state.kind === 'FIXTURE'
          ? 'Fixture data — no wallet or network in use.'
          : `Escrow contract · ${state.label}`;
    }
  }

  toggleNav(): void {
    const root = document.documentElement;
    const open = root.getAttribute('data-nav') === 'open';
    if (open) root.removeAttribute('data-nav');
    else root.setAttribute('data-nav', 'open');
  }

  closeNav(): void {
    document.documentElement.removeAttribute('data-nav');
  }

  #cycleTheme(): void {
    // system -> light -> dark -> system
    this.#theme = this.#theme === 'system' ? 'light' : this.#theme === 'light' ? 'dark' : 'system';
    if (this.#theme === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, this.#theme);
    applyTheme(this.#theme);
    this.#paintThemeButton();
  }

  #paintThemeButton(): void {
    const effective = effectiveTheme(this.#theme);
    render(this.#themeBtn, icon(effective === 'dark' ? ICONS.sun : ICONS.moon, { size: 15 }));
    const label =
      this.#theme === 'system'
        ? 'Theme: following system. Activate for light.'
        : this.#theme === 'light'
          ? 'Theme: light. Activate for dark.'
          : 'Theme: dark. Activate to follow system.';
    this.#themeBtn.setAttribute('aria-label', label);
    this.#themeBtn.title = label;
  }
}

/** Standard view header. */
export function viewHead(
  title: string,
  subtitle?: string,
  actions?: HTMLElement[],
): HTMLElement {
  return h(
    'div',
    { class: 'view-head' },
    h(
      'div',
      {},
      h('h1', { class: 'view-head__title', text: title }),
      subtitle ? h('p', { class: 'view-head__sub', text: subtitle }) : null,
    ),
    actions?.length ? h('div', { class: 'view-head__actions' }, ...actions) : null,
  );
}

export { router };
