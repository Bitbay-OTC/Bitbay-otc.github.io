/**
 * Hash routing.
 *
 * Hash-based rather than history-based so the app deploys to GitHub Pages
 * (or any static host) without server rewrite rules — a deep link like
 * /#/deals/dl-5001 resolves client-side on first load.
 */

export interface Route {
  name: string;
  params: Record<string, string>;
  query: URLSearchParams;
}

export type RouteHandler = (route: Route) => void;

interface Pattern {
  name: string;
  /** Path segments; ':x' captures into params.x */
  segments: string[];
}

const PATTERNS: Pattern[] = [
  { name: 'dashboard', segments: [] },
  { name: 'market', segments: ['market'] },
  { name: 'offer', segments: ['market', ':offerId'] },
  { name: 'deals', segments: ['deals'] },
  { name: 'deal', segments: ['deals', ':dealId'] },
  { name: 'history', segments: ['history'] },
  { name: 'balances', segments: ['balances'] },
];

function parseHash(hash: string): Route {
  const raw = hash.replace(/^#/, '') || '/';
  const [pathPart, queryPart = ''] = raw.split('?');
  const segments = pathPart.split('/').filter(Boolean);
  const query = new URLSearchParams(queryPart);

  for (const pattern of PATTERNS) {
    if (pattern.segments.length !== segments.length) continue;
    const params: Record<string, string> = {};
    let matched = true;
    for (let i = 0; i < pattern.segments.length; i++) {
      const p = pattern.segments[i]!;
      const s = segments[i]!;
      if (p.startsWith(':')) params[p.slice(1)] = decodeURIComponent(s);
      else if (p !== s) { matched = false; break; }
    }
    if (matched) return { name: pattern.name, params, query };
  }

  return { name: 'notFound', params: {}, query };
}

export class Router {
  #handler: RouteHandler | null = null;
  #current: Route | null = null;

  start(handler: RouteHandler): void {
    this.#handler = handler;
    window.addEventListener('hashchange', () => this.#dispatch());
    this.#dispatch();
  }

  get current(): Route | null {
    return this.#current;
  }

  #dispatch(): void {
    this.#current = parseHash(window.location.hash);
    this.#handler?.(this.#current);
  }

  /** Programmatic navigation. */
  go(path: string): void {
    const next = path.startsWith('#') ? path : `#${path}`;
    if (window.location.hash === next) this.#dispatch();
    else window.location.hash = next;
  }
}

export const router = new Router();

/** Build an href for a route path. Always use this rather than raw strings. */
export function href(path: string): string {
  return `#${path}`;
}
