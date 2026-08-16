/**
 * Deal detail — the settlement panel.
 *
 * Layout priority, top to bottom: what this deal is, whose move it is,
 * what has happened, and the counterparty record. Actions live in the
 * next-action banner so the operator never hunts for the button.
 */

import { h, icon, ICONS, render } from '../dom';
import { viewHead } from '../shell';
import { router } from '../../router';
import {
  directionTag,
  errorBanner,
  loading,
  statusChip,
  summaryRow,
  timestamp,
  trustCard,
} from '../components';
import {
  formatAmount,
  formatDateTime,
  formatFiat,
  formatRate,
  formatTimeRemaining,
  isUrgent,
  relativeTime,
  PAYMENT_LABEL,
} from '../format';
import {
  nextAction,
  SETTLEMENT_STEPS,
  settlementProgress,
  STATUS_META,
} from '../../data/status';
import { getAdapter } from '../../data';
import type { Deal, DealStatus, TimelineEvent } from '../../data/types';

/** Repaint the whole view from a fresh deal object. */
type Repaint = (deal: Deal) => void;

function heroCard(deal: Deal): HTMLElement {
  const buying = deal.direction === 'FIAT_TO_CRYPTO';
  const youPayFiat =
    (deal.direction === 'FIAT_TO_CRYPTO' && deal.yourSide === 'TAKER') ||
    (deal.direction === 'CRYPTO_TO_FIAT' && deal.yourSide === 'MAKER');

  const fiatLeg = h(
    'div',
    { class: 'deal-hero__leg' },
    h('span', { class: 'kv__k', text: youPayFiat ? 'You send' : 'You receive' }),
    h('span', { class: 'deal-hero__amount num', text: formatFiat(deal.fiatMinor, deal.fiat) }),
  );
  const cryptoLeg = h(
    'div',
    { class: 'deal-hero__leg' },
    h('span', { class: 'kv__k', text: youPayFiat ? 'You receive' : 'You deliver' }),
    h('span', {
      class: 'deal-hero__amount num',
      text: `${formatAmount(deal.cryptoMinor, deal.crypto)} ${deal.crypto}`,
    }),
  );

  return h(
    'div',
    { class: 'deal-hero' },
    youPayFiat ? fiatLeg : cryptoLeg,
    h('span', { class: 'deal-hero__arrow' }, icon(ICONS.arrowRight, { size: 20 })),
    youPayFiat ? cryptoLeg : fiatLeg,
    h(
      'div',
      { style: { marginLeft: 'auto', display: 'flex', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' } },
      statusChip(deal.status),
      directionTag(deal.direction, deal.fiat, deal.crypto),
      buying ? null : null,
    ),
  );
}

function actionBanner(deal: Deal, repaint: Repaint): HTMLElement | null {
  const action = nextAction(deal);
  if (!action) {
    const meta = STATUS_META[deal.status];
    return h(
      'div',
      { class: 'next-action next-action--theirs' },
      icon(meta.band === 'settled' ? ICONS.check : ICONS.alert, { size: 16 }),
      h('span', { class: 'next-action__text', text: meta.description }),
    );
  }

  const run = async (fn: () => Promise<Deal>, slot: HTMLElement): Promise<void> => {
    render(slot, loading('Submitting'));
    try {
      repaint(await fn());
    } catch (err) {
      render(slot, errorBanner(err instanceof Error ? err.message : 'Action failed.'));
    }
  };

  const slot = h('div', { class: 'next-action__actions' });
  const adapter = getAdapter();

  if (action.owner === 'counterparty') {
    return h(
      'div',
      { class: 'next-action next-action--theirs' },
      icon(ICONS.alert, { size: 16 }),
      h('span', { class: 'next-action__text', text: action.label }),
      h('span', {
        class: 'cell-sub',
        style: { marginLeft: 'auto' },
        text: deal.expiresAt ? formatTimeRemaining(deal.expiresAt) : '',
      }),
    );
  }

  const buttons: HTMLElement[] = [];

  if (action.action === 'MARK_PAID') {
    buttons.push(
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Mark payment sent',
        on: { click: () => void run(() => adapter.markPaymentSent(deal.id), slot) },
      }),
    );
  }

  if (action.action === 'CONFIRM_RECEIVED') {
    buttons.push(
      h('button', {
        class: 'btn btn--primary',
        type: 'button',
        text: 'Confirm funds received',
        on: {
          click: () => {
            // Releasing escrow is irreversible; require an explicit confirm.
            const ok = window.confirm(
              `Confirm that ${formatFiat(deal.fiatMinor, deal.fiat)} has landed in your account.\n\n` +
                'This releases the crypto from escrow and cannot be undone.',
            );
            if (ok) void run(() => adapter.confirmPaymentReceived(deal.id), slot);
          },
        },
      }),
    );
  }

  if (!STATUS_META[deal.status].terminal && deal.status !== 'DISPUTED') {
    buttons.push(
      h('button', {
        class: 'btn',
        type: 'button',
        text: 'Raise dispute',
        on: {
          click: () => {
            const reason = window.prompt('Describe the issue for the dispute record:');
            if (reason) void run(() => adapter.raiseDispute(deal.id, reason), slot);
          },
        },
      }),
    );
  }

  render(slot, ...buttons);

  const urgent = isUrgent(deal.expiresAt);
  return h(
    'div',
    { class: `next-action${deal.status === 'DISPUTED' ? ' next-action--danger' : ''}` },
    icon(ICONS.alert, { size: 16 }),
    h(
      'div',
      {},
      h('p', { class: 'next-action__text', text: action.label }),
      deal.expiresAt
        ? h('p', {
            class: 'cell-sub',
            style: urgent ? { color: 'var(--st-danger)', fontWeight: '650' } : {},
            text: `${formatTimeRemaining(deal.expiresAt)} · window closes ${formatDateTime(deal.expiresAt)}`,
          })
        : null,
    ),
    slot,
  );
}

/**
 * Settlement rail. Renders the canonical happy path, marking each step
 * done / current / pending, and appends any off-path event (dispute,
 * cancellation, expiry) as a break in the rail.
 */
function settlementRail(deal: Deal): HTMLElement {
  const progress = settlementProgress(deal.status);
  const reached = new Map<DealStatus, TimelineEvent>();
  for (const event of deal.timeline) {
    if (!reached.has(event.status)) reached.set(event.status, event);
  }

  const steps = SETTLEMENT_STEPS.map((status, index) => {
    const event = reached.get(status);
    const state =
      progress === -1
        ? event
          ? 'done'
          : 'pending'
        : index < progress
          ? 'done'
          : index === progress
            ? 'current'
            : 'pending';

    return h(
      'div',
      { class: `step step--${state}` },
      h('div', { class: 'step__gutter' }, h('span', { class: 'step__dot' }), h('span', { class: 'step__line' })),
      h(
        'div',
        { class: 'step__body' },
        h('p', { class: 'step__label', text: STATUS_META[status].label }),
        event
          ? h('p', { class: 'step__meta' }, timestamp(event.at), h('span', { text: ` · ${event.actor === 'system' ? 'system' : event.actor === 'you' ? 'you' : 'counterparty'}` }))
          : h('p', { class: 'step__meta', text: 'Pending' }),
        event?.detail ? h('p', { class: 'step__detail', text: event.detail }) : null,
      ),
    );
  });

  // Off-path terminal states are appended as an explicit break.
  if (progress === -1) {
    const event = deal.timeline[deal.timeline.length - 1];
    steps.push(
      h(
        'div',
        { class: 'step step--broken' },
        h('div', { class: 'step__gutter' }, h('span', { class: 'step__dot' }), h('span', { class: 'step__line' })),
        h(
          'div',
          { class: 'step__body' },
          h('p', { class: 'step__label', text: STATUS_META[deal.status].label }),
          event ? h('p', { class: 'step__meta' }, timestamp(event.at)) : null,
          h('p', { class: 'step__detail', text: deal.disputeReason ?? event?.detail ?? STATUS_META[deal.status].description }),
        ),
      ),
    );
  }

  return h(
    'section',
    { class: 'card' },
    h('div', { class: 'card__head' }, h('span', { class: 'card__title', text: 'Settlement' })),
    h('div', { class: 'card__body' }, h('div', { class: 'steps' }, ...steps)),
  );
}

function termsCard(deal: Deal): HTMLElement {
  return h(
    'section',
    { class: 'card' },
    h('div', { class: 'card__head' }, h('span', { class: 'card__title', text: 'Terms' })),
    h(
      'div',
      { class: 'card__body' },
      h(
        'div',
        { class: 'summary-rows' },
        summaryRow('Deal reference', h('span', { class: 'mono', text: deal.id })),
        summaryRow('Rate', formatRate(deal.rateMinor, deal.fiat, deal.crypto)),
        summaryRow('Payment method', PAYMENT_LABEL[deal.paymentMethod]),
        summaryRow('Your side', deal.yourSide === 'MAKER' ? 'Maker' : 'Taker'),
        summaryRow(
          'Your escrow deposit',
          `${formatAmount(deal.escrow.yourDepositMinor, deal.crypto)} ${deal.crypto}`,
        ),
        summaryRow(
          'Counterparty deposit',
          `${formatAmount(deal.escrow.counterpartyDepositMinor, deal.crypto)} ${deal.crypto}`,
        ),
        summaryRow('Opened', formatDateTime(deal.openedAt)),
        summaryRow('Deadline', deal.expiresAt ? formatDateTime(deal.expiresAt) : 'Closed'),
      ),
    ),
  );
}

function messagesCard(deal: Deal, repaint: Repaint): HTMLElement {
  const thread = h(
    'div',
    { class: 'thread' },
    ...(deal.messages.length
      ? deal.messages.map((m) =>
          h(
            'div',
            { class: `msg msg--${m.from === 'you' ? 'you' : 'them'}` },
            h('p', { text: m.body }),
            h('p', { class: 'msg__meta', text: relativeTime(m.at) }),
          ),
        )
      : [h('p', { class: 'cell-sub', style: { padding: '.5rem' }, text: 'No messages on this deal yet.' })]),
  );

  const input = h('input', {
    class: 'input',
    type: 'text',
    placeholder: 'Message your counterparty',
    aria: { label: 'Message your counterparty' },
  });

  const send = async (): Promise<void> => {
    const body = input.value.trim();
    if (!body) return;
    input.value = '';
    try {
      repaint(await getAdapter().sendMessage(deal.id, body));
    } catch {
      input.value = body;
    }
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); void send(); }
  });

  return h(
    'section',
    { class: 'card' },
    h(
      'div',
      { class: 'card__head' },
      icon(ICONS.message, { size: 15 }),
      h('span', { class: 'card__title', text: 'Messages' }),
    ),
    h(
      'div',
      { class: 'card__body' },
      thread,
      h(
        'div',
        { class: 'composer' },
        input,
        h('button', { class: 'btn btn--primary', type: 'button', text: 'Send', on: { click: () => void send() } }),
      ),
    ),
  );
}

export async function dealView(host: HTMLElement, dealId: string): Promise<void> {
  render(host, loading('Loading deal'));

  let deal: Deal;
  try {
    deal = await getAdapter().getDeal(dealId);
  } catch (err) {
    render(
      host,
      viewHead('Settlement'),
      errorBanner(err instanceof Error ? err.message : 'Deal not found.', () => void dealView(host, dealId)),
    );
    return;
  }

  const paint: Repaint = (next) => {
    render(
      host,
      viewHead(
        `Settlement ${next.id}`,
        `${STATUS_META[next.status].description}`,
        [
          h('button', {
            class: 'btn',
            type: 'button',
            text: 'Back to settlements',
            on: { click: () => router.go('/deals') },
          }),
        ],
      ),
      heroCard(next),
      h('div', { style: { height: '1rem' } }),
      actionBanner(next, paint),
      h('div', { style: { height: '1rem' } }),
      h(
        'div',
        { class: 'deal-grid' },
        h('div', { style: { display: 'grid', gap: '1rem' } }, settlementRail(next), messagesCard(next, paint)),
        h('div', { style: { display: 'grid', gap: '1rem' } }, termsCard(next), trustCard(next.counterparty)),
      ),
    );
  };

  paint(deal);
}
