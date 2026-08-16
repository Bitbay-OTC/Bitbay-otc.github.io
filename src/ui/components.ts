/**
 * Shared presentational components.
 *
 * Everything here is a pure function returning a detached element. No
 * component reads global state or the adapter — views pass data down.
 */

import { h, icon, ICONS } from './dom';
import {
  directionLabel,
  formatAmount,
  formatDateTime,
  formatFiat,
  formatPercent,
  formatResponseTime,
  formatSpread,
  shortAddress,
  takerActionLabel,
  PAYMENT_LABEL,
  VERIFICATION_LABEL,
} from './format';
import { STATUS_META } from '../data/status';
import type {
  Counterparty,
  CryptoAsset,
  DealStatus,
  Direction,
  FiatCurrency,
  PaymentMethod,
  RiskFlag,
} from '../data/types';

// ---- status ---------------------------------------------------------------

export function statusChip(status: DealStatus): HTMLElement {
  const meta = STATUS_META[status];
  return h('span', {
    class: `chip chip--${meta.band}`,
    text: meta.label,
    title: meta.description,
  });
}

// ---- direction ------------------------------------------------------------

export function directionTag(
  direction: Direction,
  fiat: FiatCurrency,
  crypto: CryptoAsset,
): HTMLElement {
  // From the taker's perspective: FIAT_TO_CRYPTO means they buy crypto.
  const buying = direction === 'FIAT_TO_CRYPTO';
  return h('span', {
    class: `dir dir--${buying ? 'buy' : 'sell'}`,
    text: directionLabel(direction, fiat, crypto),
    title: `${takerActionLabel(direction)} — ${directionLabel(direction, fiat, crypto)}`,
  });
}

// ---- spread ---------------------------------------------------------------

/**
 * A spread is shown signed and coloured by whether it favours the taker.
 * Negative spread (below mid) is good when buying; the sign alone is not
 * enough, so the title spells the meaning out.
 */
export function spreadTag(bps: number): HTMLElement {
  const magnitude = Math.abs(bps);
  const cls = magnitude <= 8 ? 'spread--tight' : magnitude >= 20 ? 'spread--wide' : 'spread--flat';
  return h('span', {
    class: `spread ${cls}`,
    text: formatSpread(bps),
    title:
      bps === 0
        ? 'At desk reference'
        : `${formatSpread(bps)} ${bps > 0 ? 'above' : 'below'} desk reference`,
  });
}

// ---- trust ----------------------------------------------------------------

export function verificationBadge(cp: Counterparty): HTMLElement {
  return h('span', {
    class: `verif verif--${cp.verification}`,
    text: VERIFICATION_LABEL[cp.verification],
  });
}

const RISK_LABEL: Record<RiskFlag, string> = {
  NEW_COUNTERPARTY: 'New counterparty',
  LOW_COMPLETION_RATE: 'Low completion rate',
  SLOW_RESPONSE: 'Slow response',
  DISPUTE_HISTORY: 'Dispute history',
  LIMIT_MISMATCH: 'Limit mismatch',
};

export function riskFlags(flags: RiskFlag[]): HTMLElement | null {
  if (!flags.length) return null;
  return h(
    'div',
    { class: 'trust__flags' },
    ...flags.map((f) => h('span', { class: 'risk' }, icon(ICONS.alert, { size: 12 }), RISK_LABEL[f])),
  );
}

function meter(rate: number): HTMLElement {
  const cls = rate >= 0.97 ? '' : rate >= 0.9 ? ' meter__fill--warn' : ' meter__fill--bad';
  return h(
    'div',
    { class: 'meter' },
    h('div', { class: `meter__fill${cls}`, style: { width: `${Math.round(rate * 100)}%` } }),
  );
}

/**
 * Counterparty trust card. Every figure here is real adapter data — when a
 * value is unavailable the card says so rather than showing a placeholder
 * number.
 */
export function trustCard(cp: Counterparty): HTMLElement {
  return h(
    'section',
    { class: 'card' },
    h(
      'div',
      { class: 'card__head' },
      icon(ICONS.shield, { size: 15 }),
      h('span', { class: 'card__title', text: 'Counterparty' }),
    ),
    h(
      'div',
      { class: 'card__body' },
      h(
        'div',
        { class: 'trust__head' },
        h('span', { class: 'trust__alias', text: cp.alias ?? 'Unnamed counterparty' }),
        verificationBadge(cp),
      ),
      h('div', { class: 'trust__addr', text: cp.address, title: cp.address }),
      h(
        'div',
        { class: 'trust__grid' },
        h(
          'div',
          { class: 'kv' },
          h('span', { class: 'kv__k', text: 'Settlements' }),
          h('span', { class: 'kv__v num', text: cp.tradeCount.toLocaleString() }),
        ),
        h(
          'div',
          { class: 'kv' },
          h('span', { class: 'kv__k', text: 'Completion' }),
          h('span', { class: 'kv__v num', text: formatPercent(cp.completionRate) }),
          meter(cp.completionRate),
        ),
        h(
          'div',
          { class: 'kv' },
          h('span', { class: 'kv__k', text: 'Median response' }),
          h('span', {
            class: 'kv__v num',
            text: formatResponseTime(cp.medianResponseMinutes),
          }),
        ),
        h(
          'div',
          { class: 'kv' },
          h('span', { class: 'kv__k', text: 'Member since' }),
          h('span', { class: 'kv__v', text: new Date(cp.memberSince).getFullYear().toString() }),
        ),
      ),
      riskFlags(cp.riskFlags),
    ),
  );
}

/** Compact counterparty cell for table rows. */
export function counterpartyCell(cp: Counterparty): HTMLElement {
  return h(
    'div',
    { class: 'cell-stack' },
    h(
      'div',
      { style: { display: 'flex', alignItems: 'center', gap: '.4rem' } },
      h('span', { style: { fontWeight: '600' }, text: cp.alias ?? shortAddress(cp.address) }),
      verificationBadge(cp),
    ),
    h('span', {
      class: 'cell-sub num',
      text: `${cp.tradeCount.toLocaleString()} settled · ${formatPercent(cp.completionRate)}`,
    }),
  );
}

// ---- misc -----------------------------------------------------------------

export function paymentList(methods: PaymentMethod[]): string {
  return methods.map((m) => PAYMENT_LABEL[m]).join(', ');
}

export function limitsCell(min: string, max: string, fiat: FiatCurrency): HTMLElement {
  return h('span', {
    class: 'limits num',
    text: `${formatFiat(min, fiat)} – ${formatFiat(max, fiat)}`,
  });
}

export function keyValue(k: string, v: string | Node, opts: { large?: boolean } = {}): HTMLElement {
  return h(
    'div',
    { class: 'kv' },
    h('span', { class: 'kv__k', text: k }),
    typeof v === 'string'
      ? h('span', { class: `kv__v${opts.large ? ' kv__v--lg' : ''} num`, text: v })
      : h('span', { class: `kv__v${opts.large ? ' kv__v--lg' : ''}` }, v),
  );
}

export function summaryRow(k: string, v: string | Node, opts: { total?: boolean } = {}): HTMLElement {
  return h(
    'div',
    { class: `summary-row${opts.total ? ' summary-row--total' : ''}` },
    h('span', { class: 'summary-row__k', text: k }),
    typeof v === 'string' ? h('span', { class: 'summary-row__v num', text: v }) : h('span', { class: 'summary-row__v' }, v),
  );
}

export function emptyState(title: string, body: string, action?: HTMLElement): HTMLElement {
  return h(
    'div',
    { class: 'empty' },
    h('p', { class: 'empty__title', text: title }),
    h('p', { class: 'empty__body', text: body }),
    action ? h('div', { style: { marginTop: '1rem' } }, action) : null,
  );
}

export function loading(label = 'Loading'): HTMLElement {
  return h(
    'div',
    { class: 'loading', role: 'status' },
    h('span', { class: 'spinner' }),
    h('span', { text: label }),
  );
}

export function errorBanner(message: string, retry?: () => void): HTMLElement {
  return h(
    'div',
    { class: 'error-banner', role: 'alert' },
    icon(ICONS.alert, { size: 16 }),
    h('div', { style: { flex: '1' } }, h('p', { text: message })),
    retry ? h('button', { class: 'btn btn--sm', text: 'Retry', on: { click: retry } }) : null,
  );
}

/** Amount + asset, stacked with its label. Used across deal views. */
export function money(
  label: string,
  minor: string,
  asset: string,
  opts: { large?: boolean } = {},
): HTMLElement {
  return keyValue(label, `${formatAmount(minor, asset)} ${asset}`, opts);
}

export function timestamp(iso: string): HTMLElement {
  return h('time', { text: formatDateTime(iso), title: iso });
}
