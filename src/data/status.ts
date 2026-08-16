/**
 * Settlement status presentation.
 *
 * One place decides what a status is called, what colour band it carries,
 * and — the question that actually matters on a desk — whose move it is.
 */

import type { Deal, DealStatus, StatusBand, VerificationTier } from './types';

/** Ordering for verification tiers, used for "minimum verification" filters. */
export const VERIFICATION_RANK: Record<VerificationTier, number> = {
  NONE: 0,
  BASIC: 1,
  ENHANCED: 2,
  INSTITUTIONAL: 3,
};

export interface StatusMeta {
  label: string;
  band: StatusBand;
  /** One-line explanation of what the state means. */
  description: string;
  /** True when this is a terminal state. */
  terminal: boolean;
}

export const STATUS_META: Record<DealStatus, StatusMeta> = {
  OPEN: {
    label: 'Open',
    band: 'open',
    description: 'Live on the board. No counterparty has committed yet.',
    terminal: false,
  },
  ACCEPTED: {
    label: 'Accepted',
    band: 'active',
    description: 'Both sides committed. Escrow deposits posted.',
    terminal: false,
  },
  AWAITING_PAYMENT: {
    label: 'Awaiting payment',
    band: 'attention',
    description: 'Escrow is funded. The fiat sender must send payment.',
    terminal: false,
  },
  PAYMENT_SENT: {
    label: 'Payment sent',
    band: 'attention',
    description: 'Sender marked the transfer as sent. Receiver must confirm.',
    terminal: false,
  },
  CRYPTO_RELEASED: {
    label: 'Crypto released',
    band: 'active',
    description: 'Fiat confirmed. Crypto released from escrow.',
    terminal: false,
  },
  COMPLETE: {
    label: 'Settlement complete',
    band: 'settled',
    description: 'Both sides signed off. Deposits returned.',
    terminal: true,
  },
  CANCELLED: {
    label: 'Cancelled',
    band: 'closed',
    description: 'Cancelled by agreement. Deposits returned.',
    terminal: true,
  },
  DISPUTED: {
    label: 'Disputed',
    band: 'danger',
    description: 'A party raised a dispute. Funds remain locked in escrow.',
    terminal: false,
  },
  EXPIRED: {
    label: 'Expired',
    band: 'closed',
    description: 'The settlement window elapsed without resolution.',
    terminal: true,
  },
};

/**
 * Whose move it is, and what that move is called.
 *
 * `null` means nothing is expected from either party right now.
 */
export interface NextAction {
  owner: 'you' | 'counterparty';
  label: string;
  /** Action id the deal view maps to a button, when it is yours. */
  action?: 'MARK_PAID' | 'CONFIRM_RECEIVED' | 'REVIEW_DISPUTE';
}

/** Which side sends fiat on this deal. */
function youSendFiat(deal: Deal): boolean {
  // FIAT_TO_CRYPTO: the taker pays fiat. CRYPTO_TO_FIAT: the maker pays fiat.
  return deal.direction === 'FIAT_TO_CRYPTO'
    ? deal.yourSide === 'TAKER'
    : deal.yourSide === 'MAKER';
}

export function nextAction(deal: Deal): NextAction | null {
  switch (deal.status) {
    case 'AWAITING_PAYMENT':
      return youSendFiat(deal)
        ? { owner: 'you', label: 'Send payment and mark as paid', action: 'MARK_PAID' }
        : { owner: 'counterparty', label: 'Awaiting their payment' };

    case 'PAYMENT_SENT':
      return youSendFiat(deal)
        ? { owner: 'counterparty', label: 'Awaiting their confirmation' }
        : { owner: 'you', label: 'Confirm funds received', action: 'CONFIRM_RECEIVED' };

    case 'DISPUTED':
      return { owner: 'you', label: 'Review dispute', action: 'REVIEW_DISPUTE' };

    case 'ACCEPTED':
      return { owner: 'counterparty', label: 'Escrow funding in progress' };

    case 'CRYPTO_RELEASED':
      return { owner: 'counterparty', label: 'Awaiting final sign-off' };

    default:
      return null;
  }
}

/** Deals where the operator owes the next move. Drives the dashboard queue. */
export function awaitsYou(deal: Deal): boolean {
  return nextAction(deal)?.owner === 'you';
}

/** Canonical ordering for the settlement timeline rail. */
export const SETTLEMENT_STEPS: DealStatus[] = [
  'ACCEPTED',
  'AWAITING_PAYMENT',
  'PAYMENT_SENT',
  'CRYPTO_RELEASED',
  'COMPLETE',
];

/**
 * Position of a deal along the happy path, for the progress rail.
 * Terminal-but-unhappy states return -1: they are drawn as a break, not
 * as progress.
 */
export function settlementProgress(status: DealStatus): number {
  if (status === 'CANCELLED' || status === 'EXPIRED' || status === 'DISPUTED') return -1;
  const i = SETTLEMENT_STEPS.indexOf(status);
  return i === -1 ? 0 : i;
}
