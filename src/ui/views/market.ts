/**
 * Market board — the desk's primary surface.
 *
 * Dense table on desktop, cards below 860px. Filters are held in the URL
 * query so a filtered board is shareable and survives reload.
 */

import { h, render } from '../dom';
import { viewHead } from '../shell';
import { router } from '../../router';
import {
  counterpartyCell,
  directionTag,
  emptyState,
  errorBanner,
  limitsCell,
  loading,
  paymentList,
  spreadTag,
} from '../components';
import { formatRate, relativeTime, takerActionLabel } from '../format';
import { getAdapter } from '../../data';
import type {
  CryptoAsset,
  Direction,
  Offer,
  OfferFilter,
  OfferSort,
  PaymentMethod,
  Region,
  VerificationTier,
} from '../../data/types';

const CRYPTO: CryptoAsset[] = ['BTC', 'ETH', 'USDT', 'USDC'];
const REGIONS: Region[] = ['EU', 'US', 'UK', 'APAC', 'GLOBAL'];
const METHODS: PaymentMethod[] = [
  'SEPA_INSTANT', 'SEPA', 'FEDWIRE', 'ACH', 'SWIFT', 'FASTER_PAYMENTS',
];

const SORTS: Array<[OfferSort, string]> = [
  ['BEST_RATE', 'Best rate'],
  ['TIGHTEST_SPREAD', 'Tightest spread'],
  ['LARGEST_SIZE', 'Largest size'],
  ['MOST_TRUSTED', 'Most trusted'],
  ['NEWEST', 'Newest'],
];

/** Read filter state out of the URL. The URL is the single source of truth. */
function filterFromQuery(q: URLSearchParams): { filter: OfferFilter; sort: OfferSort } {
  const filter: OfferFilter = {};
  const direction = q.get('dir');
  if (direction === 'FIAT_TO_CRYPTO' || direction === 'CRYPTO_TO_FIAT') filter.direction = direction;

  const fiat = q.get('fiat');
  if (fiat === 'USD' || fiat === 'EUR') filter.fiat = fiat;

  const crypto = q.get('asset');
  if (crypto && CRYPTO.includes(crypto as CryptoAsset)) filter.crypto = crypto as CryptoAsset;

  const region = q.get('region');
  if (region && REGIONS.includes(region as Region)) filter.region = region as Region;

  const method = q.get('method');
  if (method && METHODS.includes(method as PaymentMethod)) filter.paymentMethods = [method as PaymentMethod];

  const verif = q.get('verif');
  if (verif === 'BASIC' || verif === 'ENHANCED' || verif === 'INSTITUTIONAL') {
    filter.minVerification = verif as VerificationTier;
  }

  const size = q.get('size');
  if (size && /^\d+$/.test(size)) filter.sizeMinor = size;

  const query = q.get('q');
  if (query) filter.query = query;

  const sortRaw = q.get('sort');
  const sort = SORTS.some(([s]) => s === sortRaw) ? (sortRaw as OfferSort) : 'BEST_RATE';

  return { filter, sort };
}

/** Write one filter key back to the URL, preserving the rest. */
function setQuery(key: string, value: string | null): void {
  const current = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
  if (value === null || value === '') current.delete(key);
  else current.set(key, value);
  const qs = current.toString();
  router.go(`/market${qs ? `?${qs}` : ''}`);
}

function labelledSelect(
  label: string,
  value: string,
  options: Array<[string, string]>,
  onChange: (v: string) => void,
): HTMLElement {
  const select = h('select', { class: 'select', on: { change: (e) => onChange((e.target as HTMLSelectElement).value) } });
  for (const [v, text] of options) {
    select.appendChild(h('option', { value: v, text, ...(v === value ? { } : {}) }));
  }
  select.value = value;
  return h('div', { class: 'field' }, h('label', { text: label }), select);
}

function filterBar(filter: OfferFilter, sort: OfferSort, resultCount: number): HTMLElement {
  const sizeInput = h('input', {
    class: 'input',
    type: 'text',
    placeholder: 'e.g. 50000',
    value: filter.sizeMinor ? (BigInt(filter.sizeMinor) / 100n).toString() : '',
    on: {
      change: (e) => {
        const raw = (e.target as HTMLInputElement).value.replace(/[^\d]/g, '');
        setQuery('size', raw ? `${raw}00` : null);
      },
    },
  });

  const search = h('input', {
    class: 'input',
    type: 'search',
    placeholder: 'Counterparty or asset',
    value: filter.query ?? '',
    on: {
      change: (e) => setQuery('q', (e.target as HTMLInputElement).value || null),
    },
  });

  const directionSeg = h(
    'div',
    { class: 'field field--seg' },
    h('label', { text: 'Direction' }),
    h(
      'div',
      { class: 'seg', role: 'group', aria: { label: 'Direction' } },
      ...(
        [
          [null, 'Both'],
          ['FIAT_TO_CRYPTO', 'Buy crypto'],
          ['CRYPTO_TO_FIAT', 'Sell crypto'],
        ] as Array<[Direction | null, string]>
      ).map(([value, label]) =>
        h('button', {
          class: 'seg__btn',
          type: 'button',
          text: label,
          aria: { pressed: String((filter.direction ?? null) === value) },
          on: { click: () => setQuery('dir', value) },
        }),
      ),
    ),
  );

  const hasFilters =
    Object.keys(filter).length > 0 || sort !== 'BEST_RATE';

  return h(
    'div',
    { class: 'filters' },
    directionSeg,
    labelledSelect('Fiat', filter.fiat ?? '', [['', 'Any'], ['USD', 'USD'], ['EUR', 'EUR']], (v) =>
      setQuery('fiat', v || null),
    ),
    labelledSelect(
      'Asset',
      filter.crypto ?? '',
      [['', 'Any'], ...CRYPTO.map((c) => [c, c] as [string, string])],
      (v) => setQuery('asset', v || null),
    ),
    labelledSelect(
      'Payment',
      filter.paymentMethods?.[0] ?? '',
      [['', 'Any'], ...METHODS.map((m) => [m, m.replace(/_/g, ' ')] as [string, string])],
      (v) => setQuery('method', v || null),
    ),
    labelledSelect(
      'Region',
      filter.region ?? '',
      [['', 'Any'], ...REGIONS.map((r) => [r, r] as [string, string])],
      (v) => setQuery('region', v || null),
    ),
    labelledSelect(
      'Min. verification',
      filter.minVerification ?? '',
      [['', 'Any'], ['BASIC', 'Basic'], ['ENHANCED', 'Enhanced'], ['INSTITUTIONAL', 'Institutional']],
      (v) => setQuery('verif', v || null),
    ),
    h('div', { class: 'field' }, h('label', { text: 'Size' }), sizeInput),
    h('div', { class: 'field field--grow' }, h('label', { text: 'Search' }), search),
    labelledSelect('Sort', sort, SORTS.map(([v, l]) => [v, l] as [string, string]), (v) =>
      setQuery('sort', v === 'BEST_RATE' ? null : v),
    ),
    hasFilters
      ? h(
          'div',
          { class: 'field filters__reset' },
          h('label', { text: ` ` }),
          h('button', {
            class: 'btn btn--ghost',
            type: 'button',
            text: `Clear (${resultCount})`,
            on: { click: () => router.go('/market') },
          }),
        )
      : null,
  );
}

function offerRow(offer: Offer): HTMLTableRowElement {
  const open = () => router.go(`/market/${offer.id}`);
  const row = h('tr', {
    tabIndex: 0,
    role: 'link',
    aria: { label: `${takerActionLabel(offer.direction)} ${offer.crypto} with ${offer.fiat}` },
    on: {
      click: open,
      keydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      },
    },
  });

  row.append(
    h('td', {}, directionTag(offer.direction, offer.fiat, offer.crypto)),
    h('td', { class: 'num' }, h('span', { class: 'rate', text: formatRate(offer.rateMinor, offer.fiat, offer.crypto) })),
    h('td', { class: 'num' }, spreadTag(offer.spreadBps)),
    h('td', { class: 'num' }, limitsCell(offer.minFiatMinor, offer.maxFiatMinor, offer.fiat)),
    h('td', {}, h('span', { class: 'cell-sub', text: paymentList(offer.paymentMethods) })),
    h('td', {}, h('span', { class: 'cell-sub', text: offer.region })),
    h('td', {}, counterpartyCell(offer.counterparty)),
    h(
      'td',
      { class: 'num' },
      h(
        'div',
        { class: 'cell-stack' },
        h('span', { text: `${offer.depositPercent}% dep.` }),
        h('span', { class: 'cell-sub', text: `${offer.timeLimitHours}h window` }),
      ),
    ),
    h('td', {}, h('span', { class: 'cell-sub', text: relativeTime(offer.createdAt) })),
  );
  return row;
}

function offerCard(offer: Offer): HTMLElement {
  const buying = offer.direction === 'FIAT_TO_CRYPTO';
  const card = h(
    'button',
    {
      class: 'offer-card',
      type: 'button',
      on: { click: () => router.go(`/market/${offer.id}`) },
    },
    h(
      'div',
      { class: 'offer-card__row offer-card__row--split' },
      directionTag(offer.direction, offer.fiat, offer.crypto),
      spreadTag(offer.spreadBps),
    ),
    h('div', { class: 'offer-card__rate num', text: formatRate(offer.rateMinor, offer.fiat, offer.crypto) }),
    h(
      'div',
      { class: 'offer-card__row' },
      limitsCell(offer.minFiatMinor, offer.maxFiatMinor, offer.fiat),
    ),
    h('div', { class: 'offer-card__row' }, counterpartyCell(offer.counterparty)),
    h(
      'div',
      { class: 'offer-card__row' },
      h('span', { class: 'cell-sub', text: `${paymentList(offer.paymentMethods)} · ${offer.region}` }),
    ),
  );
  card.style.borderLeftColor = buying ? 'var(--buy)' : 'var(--sell)';
  return card;
}

export async function marketView(host: HTMLElement, query: URLSearchParams): Promise<void> {
  const { filter, sort } = filterFromQuery(query);

  const head = viewHead(
    'Market board',
    'Live OTC offers. Select a row to review the counterparty and size a deal.',
  );
  const body = h('div', {});
  render(host, head, body);
  render(body, loading('Loading offers'));

  let offers: Offer[];
  try {
    offers = await getAdapter().listOffers(filter, sort);
  } catch (err) {
    render(
      body,
      filterBar(filter, sort, 0),
      errorBanner(
        err instanceof Error ? err.message : 'Could not load offers.',
        () => void marketView(host, query),
      ),
    );
    return;
  }

  const bar = filterBar(filter, sort, offers.length);

  if (!offers.length) {
    render(
      body,
      bar,
      emptyState(
        'No offers match these filters',
        'Widen the size band, clear the verification floor, or allow more payment methods.',
        h('button', { class: 'btn', type: 'button', text: 'Clear filters', on: { click: () => router.go('/market') } }),
      ),
    );
    return;
  }

  const table = h(
    'table',
    { class: 'board' },
    h(
      'thead',
      {},
      h(
        'tr',
        {},
        h('th', { text: 'Direction' }),
        h('th', { class: 'num', text: 'Rate' }),
        h('th', { class: 'num', text: 'Spread' }),
        h('th', { class: 'num', text: 'Limits' }),
        h('th', { text: 'Payment' }),
        h('th', { text: 'Region' }),
        h('th', { text: 'Counterparty' }),
        h('th', { class: 'num', text: 'Escrow' }),
        h('th', { text: 'Posted' }),
      ),
    ),
    h('tbody', {}, ...offers.map(offerRow)),
  );

  render(
    body,
    bar,
    h('p', {
      class: 'result-note',
      text: `${offers.length} offer${offers.length === 1 ? '' : 's'} · spreads shown against desk reference`,
    }),
    h('div', { class: 'table-wrap' }, table),
    h('div', { class: 'offer-cards' }, ...offers.map(offerCard)),
  );
}
