/**
 * Settlements list and history.
 *
 * Both are the same rendering with different filters: active settlements
 * lead with whose move it is, history leads with the outcome.
 */

import { h, render } from '../dom';
import { viewHead } from '../shell';
import { router } from '../../router';
import {
  counterpartyCell,
  directionTag,
  emptyState,
  errorBanner,
  loading,
  statusChip,
} from '../components';
import { formatAmount, formatFiat, formatTimeRemaining, isUrgent, relativeTime } from '../format';
import { nextAction, STATUS_META } from '../../data/status';
import { getAdapter } from '../../data';
import type { Deal } from '../../data/types';

function dealRow(deal: Deal): HTMLTableRowElement {
  const open = () => router.go(`/deals/${deal.id}`);
  const action = nextAction(deal);
  const urgent = isUrgent(deal.expiresAt);

  const row = h('tr', {
    tabIndex: 0,
    role: 'link',
    on: {
      click: open,
      keydown: (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); }
      },
    },
  });

  row.append(
    h('td', {}, statusChip(deal.status)),
    h('td', {}, directionTag(deal.direction, deal.fiat, deal.crypto)),
    h(
      'td',
      { class: 'num' },
      h(
        'div',
        { class: 'cell-stack' },
        h('span', { style: { fontWeight: '600' }, text: formatFiat(deal.fiatMinor, deal.fiat) }),
        h('span', { class: 'cell-sub', text: `${formatAmount(deal.cryptoMinor, deal.crypto)} ${deal.crypto}` }),
      ),
    ),
    h('td', {}, counterpartyCell(deal.counterparty)),
    h(
      'td',
      {},
      action
        ? h('span', {
            style: { fontWeight: action.owner === 'you' ? '650' : '400', color: action.owner === 'you' ? 'var(--st-attention)' : 'var(--ink-3)' },
            text: action.owner === 'you' ? action.label : action.label,
          })
        : h('span', { class: 'cell-sub', text: STATUS_META[deal.status].description }),
    ),
    h(
      'td',
      { class: 'num' },
      deal.expiresAt
        ? h('span', {
            style: urgent ? { color: 'var(--st-danger)', fontWeight: '650' } : {},
            text: formatTimeRemaining(deal.expiresAt),
          })
        : h('span', { class: 'cell-sub', text: relativeTime(deal.openedAt) }),
    ),
  );
  return row;
}

function dealTable(deals: Deal[]): HTMLElement {
  return h(
    'div',
    { class: 'table-wrap' },
    h(
      'table',
      { class: 'board' },
      h(
        'thead',
        {},
        h(
          'tr',
          {},
          h('th', { text: 'Status' }),
          h('th', { text: 'Direction' }),
          h('th', { class: 'num', text: 'Notional' }),
          h('th', { text: 'Counterparty' }),
          h('th', { text: 'Next action' }),
          h('th', { class: 'num', text: 'Deadline' }),
        ),
      ),
      h('tbody', {}, ...deals.map(dealRow)),
    ),
  );
}

/** Cards for narrow viewports. */
function dealCards(deals: Deal[]): HTMLElement {
  return h(
    'div',
    { class: 'offer-cards' },
    ...deals.map((deal) => {
      const action = nextAction(deal);
      const card = h(
        'button',
        { class: 'offer-card', type: 'button', on: { click: () => router.go(`/deals/${deal.id}`) } },
        h(
          'div',
          { class: 'offer-card__row offer-card__row--split' },
          statusChip(deal.status),
          directionTag(deal.direction, deal.fiat, deal.crypto),
        ),
        h('div', { class: 'offer-card__rate num', text: formatFiat(deal.fiatMinor, deal.fiat) }),
        h('div', { class: 'offer-card__row' }, counterpartyCell(deal.counterparty)),
        action
          ? h('div', { class: 'offer-card__row' }, h('span', {
              class: 'cell-sub',
              style: action.owner === 'you' ? { color: 'var(--st-attention)', fontWeight: '650' } : {},
              text: action.label,
            }))
          : null,
      );
      const band = STATUS_META[deal.status].band;
      card.style.borderLeftColor = `var(--st-${band})`;
      return card;
    }),
  );
}

async function renderDeals(
  host: HTMLElement,
  opts: { title: string; subtitle: string; keep: (d: Deal) => boolean; emptyTitle: string; emptyBody: string },
): Promise<void> {
  const head = viewHead(opts.title, opts.subtitle);
  const body = h('div', {});
  render(host, head, body);
  render(body, loading('Loading settlements'));

  let deals: Deal[];
  try {
    deals = (await getAdapter().listDeals()).filter(opts.keep);
  } catch (err) {
    render(body, errorBanner(err instanceof Error ? err.message : 'Could not load settlements.'));
    return;
  }

  if (!deals.length) {
    render(
      body,
      emptyState(
        opts.emptyTitle,
        opts.emptyBody,
        h('button', { class: 'btn btn--primary', type: 'button', text: 'Browse the market board', on: { click: () => router.go('/market') } }),
      ),
    );
    return;
  }

  render(body, dealTable(deals), dealCards(deals));
}

export function dealsView(host: HTMLElement): Promise<void> {
  return renderDeals(host, {
    title: 'Settlements',
    subtitle: 'Deals in flight. Rows needing your action are listed first.',
    keep: (d) => !STATUS_META[d.status].terminal,
    emptyTitle: 'No settlements in flight',
    emptyBody: 'Accepted offers appear here until both sides have signed off.',
  });
}

export function historyView(host: HTMLElement): Promise<void> {
  return renderDeals(host, {
    title: 'History',
    subtitle: 'Completed, cancelled and expired settlements.',
    keep: (d) => STATUS_META[d.status].terminal,
    emptyTitle: 'No settlement history yet',
    emptyBody: 'Completed and cancelled deals are archived here with their full audit trail.',
  });
}
