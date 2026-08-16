/**
 * Offer detail drawer — the quote → counterparty → size → accept step.
 *
 * The drawer is a modal: focus is trapped, Escape dismisses, and the
 * underlying board stays mounted so dismissal returns the operator to
 * exactly where they were.
 */

import { h, icon, ICONS, render } from '../dom';
import { router } from '../../router';
import {
  directionTag,
  errorBanner,
  loading,
  paymentList,
  spreadTag,
  summaryRow,
  trustCard,
} from '../components';
import {
  compareMinor,
  fiatToCrypto,
  formatAmount,
  formatFiat,
  formatRate,
  percentOf,
  PAYMENT_LABEL,
  takerActionLabel,
} from '../format';
import { getAdapter } from '../../data';
import type { Offer, PaymentMethod } from '../../data/types';

let activeDrawer: HTMLElement | null = null;
let lastFocused: Element | null = null;

export function closeDrawer(navigateBack = true): void {
  if (!activeDrawer) return;
  activeDrawer.remove();
  activeDrawer = null;
  document.body.style.removeProperty('overflow');
  if (lastFocused instanceof HTMLElement) lastFocused.focus();
  if (navigateBack) router.go('/market');
}

function trapFocus(panel: HTMLElement, e: KeyboardEvent): void {
  if (e.key !== 'Tab') return;
  const focusable = panel.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  );
  if (!focusable.length) return;
  const first = focusable[0]!;
  const last = focusable[focusable.length - 1]!;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

/**
 * Parse an operator-typed fiat figure ("50,000" / "50000.50") into minor
 * units. Returns null when the input is not a clean amount — the caller
 * decides how to report that, rather than silently coercing to zero.
 */
function parseFiatInput(raw: string): string | null {
  const cleaned = raw.replace(/[\s,]/g, '');
  if (!cleaned) return null;
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ''] = cleaned.split('.');
  return `${whole}${fraction.padEnd(2, '0')}`;
}

export async function openOfferDrawer(offerId: string): Promise<void> {
  lastFocused = document.activeElement;

  const panel = h('div', { class: 'drawer__panel', role: 'dialog', aria: { modal: 'true', label: 'Offer detail' } });
  const overlay = h(
    'div',
    {
      class: 'drawer',
      on: {
        click: (e) => { if (e.target === overlay) closeDrawer(); },
        keydown: (e) => {
          if (e.key === 'Escape') { e.preventDefault(); closeDrawer(); }
          else trapFocus(panel, e);
        },
      },
    },
    panel,
  );

  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';
  activeDrawer = overlay;

  render(panel, loading('Loading offer'));

  let offer: Offer;
  try {
    offer = await getAdapter().getOffer(offerId);
  } catch (err) {
    render(
      panel,
      h(
        'div',
        { class: 'drawer__head' },
        h('span', { class: 'drawer__title', text: 'Offer' }),
        h('button', { class: 'icon-btn', type: 'button', aria: { label: 'Close' }, on: { click: () => closeDrawer() } }, icon(ICONS.close, { size: 15 })),
      ),
      h('div', { class: 'drawer__body' }, errorBanner(err instanceof Error ? err.message : 'Offer unavailable.')),
    );
    return;
  }

  paintOffer(panel, offer);
  panel.querySelector<HTMLElement>('input, button')?.focus();
}

function paintOffer(panel: HTMLElement, offer: Offer): void {
  const method: PaymentMethod = offer.paymentMethods[0]!;
  let selectedMethod = method;
  let sizeMinor = offer.minFiatMinor;

  const errorSlot = h('div', {});
  const summarySlot = h('div', { class: 'summary-rows' });
  const actionSlot = h('div', {});

  const sizeInput = h('input', {
    class: 'input',
    type: 'text',
    value: formatAmount(offer.minFiatMinor, offer.fiat),
    aria: { describedby: 'size-hint' },
    on: {
      input: (e) => {
        const parsed = parseFiatInput((e.target as HTMLInputElement).value);
        if (parsed !== null) sizeMinor = parsed;
        repaint(parsed);
      },
    },
  });

  const methodSelect = h('select', {
    class: 'select',
    on: {
      change: (e) => {
        selectedMethod = (e.target as HTMLSelectElement).value as PaymentMethod;
      },
    },
  });
  for (const m of offer.paymentMethods) {
    methodSelect.appendChild(h('option', { value: m, text: PAYMENT_LABEL[m] }));
  }

  function repaint(parsed: string | null): void {
    render(errorSlot);

    if (parsed === null) {
      render(errorSlot, h('p', { class: 'field__error', text: 'Enter an amount, for example 50000 or 50000.00.' }));
      render(summarySlot);
      setActionEnabled(false);
      return;
    }

    const belowMin = compareMinor(parsed, offer.minFiatMinor) < 0;
    const aboveMax = compareMinor(parsed, offer.maxFiatMinor) > 0;

    if (belowMin || aboveMax) {
      render(
        errorSlot,
        h('p', {
          class: 'field__error',
          text: belowMin
            ? `Below the minimum of ${formatFiat(offer.minFiatMinor, offer.fiat)}.`
            : `Above the maximum of ${formatFiat(offer.maxFiatMinor, offer.fiat)}.`,
        }),
      );
      setActionEnabled(false);
      return;
    }

    const cryptoMinor = fiatToCrypto(parsed, offer.rateMinor, offer.crypto);
    const deposit = percentOf(cryptoMinor, offer.depositPercent);
    const buying = offer.direction === 'FIAT_TO_CRYPTO';

    render(
      summarySlot,
      summaryRow('Rate', formatRate(offer.rateMinor, offer.fiat, offer.crypto)),
      summaryRow('Spread', spreadTag(offer.spreadBps)),
      summaryRow(buying ? 'You pay' : 'You receive', formatFiat(parsed, offer.fiat)),
      summaryRow(
        buying ? 'You receive' : 'You deliver',
        `${formatAmount(cryptoMinor, offer.crypto)} ${offer.crypto}`,
        { total: true },
      ),
      summaryRow(
        'Your escrow deposit',
        `${formatAmount(deposit, offer.crypto)} ${offer.crypto} (${offer.depositPercent}%)`,
      ),
      summaryRow('Settlement window', `${offer.timeLimitHours} hours from acceptance`),
    );
    setActionEnabled(true);
  }

  let acceptBtn: HTMLButtonElement;

  function setActionEnabled(enabled: boolean): void {
    if (acceptBtn) acceptBtn.disabled = !enabled;
  }

  acceptBtn = h('button', {
    class: 'btn btn--primary btn--block',
    type: 'button',
    text: `${takerActionLabel(offer.direction)} — create deal`,
    on: {
      click: async () => {
        acceptBtn.disabled = true;
        render(actionSlot, loading('Creating deal'));
        try {
          const deal = await getAdapter().acceptOffer({
            offerId: offer.id,
            fiatMinor: sizeMinor,
            paymentMethod: selectedMethod,
          });
          closeDrawer(false);
          router.go(`/deals/${deal.id}`);
        } catch (err) {
          render(
            actionSlot,
            errorBanner(err instanceof Error ? err.message : 'Could not create the deal.'),
          );
          acceptBtn.disabled = false;
          actionSlot.appendChild(acceptBtn);
        }
      },
    },
  });

  render(
    panel,
    h(
      'div',
      { class: 'drawer__head' },
      h('span', { class: 'drawer__title', text: 'Offer detail' }),
      h('span', { style: { marginLeft: 'auto' } }),
      h(
        'button',
        { class: 'icon-btn', type: 'button', aria: { label: 'Close' }, on: { click: () => closeDrawer() } },
        icon(ICONS.close, { size: 15 }),
      ),
    ),
    h(
      'div',
      { class: 'drawer__body' },
      h(
        'section',
        { class: 'card' },
        h(
          'div',
          { class: 'card__body' },
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: '.6rem', flexWrap: 'wrap' } },
            directionTag(offer.direction, offer.fiat, offer.crypto),
            spreadTag(offer.spreadBps),
            h('span', { class: 'cell-sub', text: offer.region }),
          ),
          h('p', {
            class: 'deal-hero__amount num',
            style: { marginTop: '.5rem' },
            text: formatRate(offer.rateMinor, offer.fiat, offer.crypto),
          }),
          h('p', {
            class: 'cell-sub',
            text: `Limits ${formatFiat(offer.minFiatMinor, offer.fiat)} – ${formatFiat(offer.maxFiatMinor, offer.fiat)} · ${paymentList(offer.paymentMethods)}`,
          }),
        ),
      ),
      trustCard(offer.counterparty),
      h(
        'section',
        { class: 'card' },
        h('div', { class: 'card__head' }, h('span', { class: 'card__title', text: 'Size this deal' })),
        h(
          'div',
          { class: 'card__body' },
          h(
            'div',
            { style: { display: 'flex', gap: '.6rem', flexWrap: 'wrap' } },
            h(
              'div',
              { class: 'field', style: { flex: '1 1 180px' } },
              h('label', { text: `Amount (${offer.fiat})` }),
              sizeInput,
              h('span', {
                class: 'field__hint',
                id: 'size-hint',
                text: `Between ${formatFiat(offer.minFiatMinor, offer.fiat)} and ${formatFiat(offer.maxFiatMinor, offer.fiat)}`,
              }),
            ),
            h(
              'div',
              { class: 'field', style: { flex: '1 1 160px' } },
              h('label', { text: 'Payment method' }),
              methodSelect,
            ),
          ),
          errorSlot,
          h('div', { style: { marginTop: '.875rem' } }, summarySlot),
        ),
      ),
      h('div', {}, actionSlot, acceptBtn),
    ),
  );

  repaint(offer.minFiatMinor);
}
