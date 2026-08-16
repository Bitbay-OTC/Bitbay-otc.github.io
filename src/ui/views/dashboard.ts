/**
 * Desk dashboard.
 *
 * Answers, in order: what needs me, what is in flight, what am I holding.
 * Anything that is not one of those three lives on another screen.
 */

import { h, icon, ICONS, render } from '../dom';
import { viewHead } from '../shell';
import { router } from '../../router';
import {
  directionTag,
  emptyState,
  errorBanner,
  loading,
  statusChip,
} from '../components';
import { formatAmount, formatFiat, formatTimeRemaining, isUrgent } from '../format';
import { awaitsYou, nextAction } from '../../data/status';
import { getAdapter } from '../../data';
import type { Balance, Deal, DeskSummary } from '../../data/types';

function stat(label: string, value: string, sub?: string, attention = false): HTMLElement {
  return h(
    'div',
    { class: `stat${attention ? ' stat--attention' : ''}` },
    h('p', { class: 'stat__k', text: label }),
    h('p', { class: 'stat__v', text: value }),
    sub ? h('p', { class: 'stat__sub', text: sub }) : null,
  );
}

function actionQueue(deals: Deal[]): HTMLElement {
  const queue = deals.filter(awaitsYou);

  if (!queue.length) {
    return h(
      'section',
      { class: 'card' },
      h(
        'div',
        { class: 'card__head' },
        icon(ICONS.check, { size: 15 }),
        h('span', { class: 'card__title', text: 'Your queue' }),
      ),
      h(
        'div',
        { class: 'card__body' },
        h('p', { class: 'cell-sub', text: 'Nothing is waiting on you. Every open settlement is with the counterparty.' }),
      ),
    );
  }

  return h(
    'section',
    { class: 'card' },
    h(
      'div',
      { class: 'card__head' },
      icon(ICONS.alert, { size: 15 }),
      h('span', { class: 'card__title', text: 'Your queue' }),
      h('span', { class: 'chip chip--attention chip--nodot', text: String(queue.length), style: { marginLeft: 'auto' } }),
    ),
    h(
      'div',
      { class: 'queue' },
      ...queue.map((deal) => {
        const action = nextAction(deal);
        const urgent = isUrgent(deal.expiresAt);
        return h(
          'button',
          { class: 'queue__item', type: 'button', on: { click: () => router.go(`/deals/${deal.id}`) } },
          statusChip(deal.status),
          h(
            'div',
            { class: 'queue__main' },
            h('p', { class: 'queue__title', text: action?.label ?? 'Review settlement' }),
            h('p', {
              class: 'queue__sub',
              text: `${formatFiat(deal.fiatMinor, deal.fiat)} · ${deal.counterparty.alias ?? 'Unnamed counterparty'}`,
            }),
          ),
          h('span', {
            class: 'cell-sub num',
            style: urgent ? { color: 'var(--st-danger)', fontWeight: '650' } : {},
            text: formatTimeRemaining(deal.expiresAt),
          }),
        );
      }),
    ),
  );
}

function inFlight(deals: Deal[]): HTMLElement {
  const active = deals.filter((d) => !awaitsYou(d));
  return h(
    'section',
    { class: 'card' },
    h('div', { class: 'card__head' }, h('span', { class: 'card__title', text: 'With counterparty' })),
    active.length
      ? h(
          'div',
          { class: 'queue' },
          ...active.slice(0, 6).map((deal) =>
            h(
              'button',
              { class: 'queue__item', type: 'button', on: { click: () => router.go(`/deals/${deal.id}`) } },
              statusChip(deal.status),
              h(
                'div',
                { class: 'queue__main' },
                h('p', { class: 'queue__title', text: formatFiat(deal.fiatMinor, deal.fiat) }),
                h('p', { class: 'queue__sub', text: deal.counterparty.alias ?? 'Unnamed counterparty' }),
              ),
              directionTag(deal.direction, deal.fiat, deal.crypto),
            ),
          ),
        )
      : h('div', { class: 'card__body' }, h('p', { class: 'cell-sub', text: 'No settlements in flight.' })),
  );
}

function balancesCard(balances: Balance[]): HTMLElement {
  const held = balances.filter((b) => b.availableMinor !== '0' || b.inEscrowMinor !== '0');
  return h(
    'section',
    { class: 'card' },
    h(
      'div',
      { class: 'card__head' },
      h('span', { class: 'card__title', text: 'Balances' }),
      h('button', {
        class: 'btn btn--ghost btn--sm',
        type: 'button',
        text: 'View all',
        style: { marginLeft: 'auto' },
        on: { click: () => router.go('/balances') },
      }),
    ),
    h(
      'div',
      {},
      ...held.map((b) =>
        h(
          'div',
          { class: 'bal-row' },
          h('span', { class: 'bal-row__asset', text: b.asset }),
          h(
            'div',
            { class: 'bal-row__amounts' },
            h('p', { class: 'bal-row__avail', text: formatAmount(b.availableMinor, b.asset) }),
            b.inEscrowMinor !== '0'
              ? h('p', { class: 'bal-row__escrow', text: `${formatAmount(b.inEscrowMinor, b.asset)} in escrow` })
              : null,
          ),
        ),
      ),
    ),
  );
}

export async function dashboardView(host: HTMLElement): Promise<void> {
  render(host, viewHead('Desk'), loading('Loading desk'));

  let summary: DeskSummary;
  let deals: Deal[];
  let balances: Balance[];
  try {
    [summary, deals, balances] = await Promise.all([
      getAdapter().getSummary(),
      getAdapter().listDeals(),
      getAdapter().listBalances(),
    ]);
  } catch (err) {
    render(
      host,
      viewHead('Desk'),
      errorBanner(
        err instanceof Error ? err.message : 'Could not load the desk.',
        () => void dashboardView(host),
      ),
    );
    return;
  }

  const active = deals.filter((d) => d.expiresAt !== null || !['COMPLETE', 'CANCELLED', 'EXPIRED'].includes(d.status));

  render(
    host,
    viewHead('Desk', 'Settlement overview and anything waiting on you.', [
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Browse market board',
        on: { click: () => router.go('/market') },
      }),
    ]),
    h(
      'div',
      { class: 'stat-row' },
      stat(
        'Awaiting you',
        String(summary.awaitingYou),
        summary.awaitingYou ? 'Action required' : 'Nothing pending',
        summary.awaitingYou > 0,
      ),
      stat('In flight', String(summary.activeDeals), 'Open settlements'),
      stat('Settled (30d)', String(summary.settledLast30d), 'Completed deals'),
      stat(
        'Volume (30d)',
        formatFiat(summary.volume30dMinor, summary.volumeCurrency),
        `Reported in ${summary.volumeCurrency}`,
      ),
      stat('Offers live', String(summary.openOffers), 'On the board'),
    ),
    active.length === 0 && summary.awaitingYou === 0
      ? emptyState(
          'No open settlements',
          'Accept an offer from the market board to open your first deal.',
          h('button', {
            class: 'btn btn--primary',
            type: 'button',
            text: 'Browse market board',
            on: { click: () => router.go('/market') },
          }),
        )
      : h(
          'div',
          { class: 'dash-grid' },
          h('div', { style: { display: 'grid', gap: '1rem' } }, actionQueue(deals), inFlight(active)),
          h('div', { style: { display: 'grid', gap: '1rem' } }, balancesCard(balances)),
        ),
  );
}

export async function balancesView(host: HTMLElement): Promise<void> {
  render(host, viewHead('Balances'), loading('Loading balances'));

  let balances: Balance[];
  try {
    balances = await getAdapter().listBalances();
  } catch (err) {
    render(host, viewHead('Balances'), errorBanner(err instanceof Error ? err.message : 'Could not load balances.'));
    return;
  }

  const section = (kind: 'FIAT' | 'CRYPTO', title: string): HTMLElement | null => {
    const rows = balances.filter((b) => b.kind === kind);
    if (!rows.length) return null;
    return h(
      'section',
      { class: 'card' },
      h('div', { class: 'card__head' }, h('span', { class: 'card__title', text: title })),
      h(
        'div',
        {},
        ...rows.map((b) =>
          h(
            'div',
            { class: 'bal-row' },
            h('span', { class: 'bal-row__asset', text: b.asset }),
            h(
              'div',
              { class: 'bal-row__amounts' },
              h('p', { class: 'bal-row__avail', text: formatAmount(b.availableMinor, b.asset) }),
              h('p', {
                class: 'bal-row__escrow',
                text: b.inEscrowMinor === '0' ? 'None in escrow' : `${formatAmount(b.inEscrowMinor, b.asset)} in escrow`,
              }),
            ),
          ),
        ),
      ),
    );
  };

  render(
    host,
    viewHead('Balances', 'Available funds and amounts locked in open escrows.'),
    h(
      'div',
      { style: { display: 'grid', gap: '1rem', maxWidth: '720px' } },
      section('FIAT', 'Fiat'),
      section('CRYPTO', 'Crypto'),
    ),
  );
}
