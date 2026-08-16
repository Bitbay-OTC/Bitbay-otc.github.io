/**
 * Deterministic fixture data.
 *
 * Values are chosen to exercise the interface honestly: a range of spreads
 * (including negative), size bands that overlap and gap, unverified and
 * institutional counterparties, risk flags, and at least one deal in every
 * settlement state — including the unhappy ones.
 *
 * Timestamps are generated relative to load so the desk never looks stale,
 * but the ordering between them is fixed.
 */

import { fiatToCrypto, percentOf } from './money';
import type {
  Balance,
  Counterparty,
  CryptoAsset,
  Deal,
  DealStatus,
  FiatCurrency,
  Offer,
  PaymentMethod,
  TimelineEvent,
} from './types';

const HOUR = 3600_000;
const DAY = 24 * HOUR;

const base = Date.now();
const at = (offsetMs: number): string => new Date(base + offsetMs).toISOString();

// ---- counterparties -------------------------------------------------------

export const COUNTERPARTIES: Counterparty[] = [
  {
    id: 'cp-northwind',
    address: '0x8F2a4C1b9E7d3A5f6C0B8e2D4a7F1c9B3E5d7A02',
    alias: 'Northwind Capital',
    verification: 'INSTITUTIONAL',
    tradeCount: 1284,
    completionRate: 0.998,
    medianResponseMinutes: 4,
    memberSince: '2021-03-11',
    regions: ['EU', 'UK'],
    riskFlags: [],
  },
  {
    id: 'cp-halden',
    address: '0x41C7e5B2a8D6f0913E4c7A5b2D8f6091C3e5A7b4',
    alias: 'Halden Desk',
    verification: 'ENHANCED',
    tradeCount: 412,
    completionRate: 0.985,
    medianResponseMinutes: 11,
    memberSince: '2022-08-02',
    regions: ['EU'],
    riskFlags: [],
  },
  {
    id: 'cp-meridian',
    address: '0x9dA3f7C1b5E8027a4C6b9E1d3F5a7C09B2e4D6f8',
    alias: 'Meridian OTC',
    verification: 'INSTITUTIONAL',
    tradeCount: 2371,
    completionRate: 0.999,
    medianResponseMinutes: 2,
    memberSince: '2020-11-19',
    regions: ['US', 'GLOBAL'],
    riskFlags: [],
  },
  {
    id: 'cp-brightbay',
    address: '0x2b7E9c4A1f6D8035B7e0C2a4F6d8091E3b5C7a9D',
    alias: 'Brightbay Trading',
    verification: 'BASIC',
    tradeCount: 37,
    completionRate: 0.892,
    medianResponseMinutes: 96,
    memberSince: '2025-09-14',
    regions: ['APAC'],
    riskFlags: ['LOW_COMPLETION_RATE', 'SLOW_RESPONSE'],
  },
  {
    id: 'cp-anon',
    address: '0x7Ec2A9b4D1f60385C2a7E9b4D1f60385C2a7E9b4',
    alias: null,
    verification: 'NONE',
    tradeCount: 3,
    completionRate: 0.667,
    medianResponseMinutes: null,
    memberSince: '2026-07-28',
    regions: ['GLOBAL'],
    riskFlags: ['NEW_COUNTERPARTY', 'LOW_COMPLETION_RATE'],
  },
  {
    id: 'cp-lantern',
    address: '0x5A1c8E3b7D2f9046A8c1E3b7D2f9046A8c1E3b7D',
    alias: 'Lantern Markets',
    verification: 'ENHANCED',
    tradeCount: 688,
    completionRate: 0.972,
    medianResponseMinutes: 19,
    memberSince: '2023-01-30',
    regions: ['US', 'EU'],
    riskFlags: ['DISPUTE_HISTORY'],
  },
];

const cp = (id: string): Counterparty => {
  const found = COUNTERPARTIES.find((c) => c.id === id);
  if (!found) throw new Error(`fixture: unknown counterparty ${id}`);
  return found;
};

// ---- offers ---------------------------------------------------------------

export const OFFERS: Offer[] = [
  {
    id: 'of-1001',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'USD',
    crypto: 'BTC',
    rateMinor: '6421050',
    referenceRateMinor: '6418000',
    spreadBps: 5,
    minFiatMinor: '2500000',
    maxFiatMinor: '75000000',
    paymentMethods: ['FEDWIRE', 'SWIFT'],
    region: 'US',
    counterparty: cp('cp-meridian'),
    depositPercent: 10,
    timeLimitHours: 24,
    createdAt: at(-2 * HOUR),
  },
  {
    id: 'of-1002',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'EUR',
    crypto: 'BTC',
    rateMinor: '5904200',
    referenceRateMinor: '5912000',
    spreadBps: -13,
    minFiatMinor: '1000000',
    maxFiatMinor: '40000000',
    paymentMethods: ['SEPA_INSTANT', 'SEPA'],
    region: 'EU',
    counterparty: cp('cp-northwind'),
    depositPercent: 10,
    timeLimitHours: 12,
    createdAt: at(-5 * HOUR),
  },
  {
    id: 'of-1003',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'EUR',
    crypto: 'USDC',
    rateMinor: '9210',
    referenceRateMinor: '9198',
    spreadBps: 13,
    minFiatMinor: '500000',
    maxFiatMinor: '25000000',
    paymentMethods: ['SEPA_INSTANT'],
    region: 'EU',
    counterparty: cp('cp-halden'),
    depositPercent: 5,
    timeLimitHours: 6,
    createdAt: at(-40 * 60_000),
  },
  {
    id: 'of-1004',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'USD',
    crypto: 'USDT',
    rateMinor: '9994',
    referenceRateMinor: '10000',
    spreadBps: -6,
    minFiatMinor: '10000000',
    maxFiatMinor: '250000000',
    paymentMethods: ['FEDWIRE', 'ACH'],
    region: 'US',
    counterparty: cp('cp-meridian'),
    depositPercent: 5,
    timeLimitHours: 24,
    createdAt: at(-8 * HOUR),
  },
  {
    id: 'of-1005',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'USD',
    crypto: 'ETH',
    rateMinor: '312480',
    referenceRateMinor: '311900',
    spreadBps: 19,
    minFiatMinor: '500000',
    maxFiatMinor: '12000000',
    paymentMethods: ['ACH', 'FEDWIRE'],
    region: 'US',
    counterparty: cp('cp-lantern'),
    depositPercent: 15,
    timeLimitHours: 48,
    createdAt: at(-26 * HOUR),
  },
  {
    id: 'of-1006',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'EUR',
    crypto: 'ETH',
    rateMinor: '287340',
    referenceRateMinor: '288100',
    spreadBps: -26,
    minFiatMinor: '200000',
    maxFiatMinor: '5000000',
    paymentMethods: ['SEPA'],
    region: 'EU',
    counterparty: cp('cp-brightbay'),
    depositPercent: 20,
    timeLimitHours: 72,
    createdAt: at(-3 * DAY),
  },
  {
    id: 'of-1007',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'EUR',
    crypto: 'BTC',
    rateMinor: '5921800',
    referenceRateMinor: '5912000',
    spreadBps: 17,
    minFiatMinor: '100000',
    maxFiatMinor: '2000000',
    paymentMethods: ['SEPA'],
    region: 'GLOBAL',
    counterparty: cp('cp-anon'),
    depositPercent: 25,
    timeLimitHours: 72,
    createdAt: at(-15 * 60_000),
  },
  {
    id: 'of-1008',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'USD',
    crypto: 'USDC',
    rateMinor: '9998',
    referenceRateMinor: '10000',
    spreadBps: -2,
    minFiatMinor: '5000000',
    maxFiatMinor: '100000000',
    paymentMethods: ['FEDWIRE', 'SWIFT', 'ACH'],
    region: 'GLOBAL',
    counterparty: cp('cp-northwind'),
    depositPercent: 5,
    timeLimitHours: 18,
    createdAt: at(-70 * 60_000),
  },
  {
    id: 'of-1009',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'EUR',
    crypto: 'USDT',
    rateMinor: '9215',
    referenceRateMinor: '9198',
    spreadBps: 18,
    minFiatMinor: '2000000',
    maxFiatMinor: '60000000',
    paymentMethods: ['SEPA_INSTANT', 'SWIFT'],
    region: 'EU',
    counterparty: cp('cp-halden'),
    depositPercent: 10,
    timeLimitHours: 24,
    createdAt: at(-11 * HOUR),
  },
  {
    id: 'of-1010',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'USD',
    crypto: 'BTC',
    rateMinor: '6408900',
    referenceRateMinor: '6418000',
    spreadBps: -14,
    minFiatMinor: '20000000',
    maxFiatMinor: '500000000',
    paymentMethods: ['FEDWIRE'],
    region: 'US',
    counterparty: cp('cp-lantern'),
    depositPercent: 10,
    timeLimitHours: 24,
    createdAt: at(-90 * 60_000),
  },
];

// ---- deals ----------------------------------------------------------------

function timeline(steps: Array<[DealStatus, number, TimelineEvent['actor'], string, string?]>): TimelineEvent[] {
  return steps.map(([status, offset, actor, label, detail]) => ({
    at: at(offset),
    status,
    label,
    actor,
    ...(detail ? { detail } : {}),
  }));
}

/**
 * Build a deal from its economic terms.
 *
 * The crypto leg and both escrow deposits are *derived* from the fiat
 * notional, the rate and the deposit percentage — never written by hand.
 * Hand-written amounts drift from their own rate, which is exactly the
 * kind of error a settlement screen must not contain.
 */
interface DealSpec {
  id: string;
  offerId: string;
  direction: Deal['direction'];
  fiat: FiatCurrency;
  crypto: CryptoAsset;
  /** Fiat notional, minor units. */
  fiatMinor: string;
  /** Fiat minor per whole crypto unit. Matches the source offer. */
  rateMinor: string;
  /** Escrow deposit each side posts, as a percentage of the crypto leg. */
  depositPercent: number;
  status: Deal['status'];
  counterparty: Counterparty;
  paymentMethod: PaymentMethod;
  yourSide: Deal['yourSide'];
  openedAt: string;
  expiresAt: string | null;
  timeline: TimelineEvent[];
  messages: Deal['messages'];
  disputeReason?: string;
}

function makeDeal(spec: DealSpec): Deal {
  const cryptoMinor = fiatToCrypto(spec.fiatMinor, spec.rateMinor, spec.crypto);
  const deposit = percentOf(cryptoMinor, spec.depositPercent);
  const { depositPercent: _drop, ...rest } = spec;
  return {
    ...rest,
    cryptoMinor,
    escrow: { yourDepositMinor: deposit, counterpartyDepositMinor: deposit },
  };
}

export const DEALS: Deal[] = [
  makeDeal({
    id: 'dl-5001',
    offerId: 'of-1002',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'EUR',
    crypto: 'BTC',
    fiatMinor: '2500000',
    rateMinor: '5904200',
    depositPercent: 10,
    status: 'AWAITING_PAYMENT',
    counterparty: cp('cp-northwind'),
    paymentMethod: 'SEPA_INSTANT',
    yourSide: 'MAKER',
    openedAt: at(-3 * HOUR),
    expiresAt: at(2.5 * HOUR),
    timeline: timeline([
      ['ACCEPTED', -3 * HOUR, 'counterparty', 'Offer accepted', 'Size €25,000.00 at €59,042.00 / BTC'],
      ['ACCEPTED', -3 * HOUR + 60_000, 'you', 'Escrow deposit posted'],
      ['ACCEPTED', -3 * HOUR + 180_000, 'counterparty', 'Escrow deposit posted'],
      ['AWAITING_PAYMENT', -3 * HOUR + 200_000, 'system', 'Escrow funded — awaiting fiat payment'],
    ]),
    messages: [
      { at: at(-2.9 * HOUR), from: 'counterparty', body: 'Confirmed. Sending from our Rabobank account, reference NW-4471.' },
      { at: at(-2.8 * HOUR), from: 'you', body: 'Understood. Will confirm on receipt.' },
    ],
  }),
  makeDeal({
    id: 'dl-5002',
    offerId: 'of-1001',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'USD',
    crypto: 'BTC',
    fiatMinor: '15000000',
    rateMinor: '6421050',
    depositPercent: 10,
    status: 'PAYMENT_SENT',
    counterparty: cp('cp-meridian'),
    paymentMethod: 'FEDWIRE',
    yourSide: 'MAKER',
    openedAt: at(-6 * HOUR),
    expiresAt: at(1.2 * HOUR),
    timeline: timeline([
      ['ACCEPTED', -6 * HOUR, 'counterparty', 'Offer accepted', 'Size $150,000.00 at $64,210.50 / BTC'],
      ['ACCEPTED', -6 * HOUR + 120_000, 'system', 'Both deposits posted'],
      ['AWAITING_PAYMENT', -5.9 * HOUR, 'system', 'Escrow funded — awaiting fiat payment'],
      ['PAYMENT_SENT', -40 * 60_000, 'counterparty', 'Payment marked as sent', 'Fedwire IMAD 20260816MMQFMP0K000412'],
    ]),
    messages: [
      { at: at(-41 * 60_000), from: 'counterparty', body: 'Wire released. IMAD 20260816MMQFMP0K000412.' },
    ],
  }),
  makeDeal({
    id: 'dl-5003',
    offerId: 'of-1008',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'USD',
    crypto: 'USDC',
    fiatMinor: '5000000',
    rateMinor: '9998',
    depositPercent: 5,
    status: 'ACCEPTED',
    counterparty: cp('cp-northwind'),
    paymentMethod: 'FEDWIRE',
    yourSide: 'TAKER',
    openedAt: at(-25 * 60_000),
    expiresAt: at(17.5 * HOUR),
    timeline: timeline([
      ['ACCEPTED', -25 * 60_000, 'you', 'Offer accepted', 'Size $50,000.00 at $0.9998 / USDC'],
      ['ACCEPTED', -22 * 60_000, 'you', 'Escrow deposit posted'],
    ]),
    messages: [],
  }),
  makeDeal({
    id: 'dl-5004',
    offerId: 'of-1005',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'USD',
    crypto: 'ETH',
    fiatMinor: '800000',
    rateMinor: '312480',
    depositPercent: 15,
    status: 'DISPUTED',
    counterparty: cp('cp-lantern'),
    paymentMethod: 'ACH',
    yourSide: 'MAKER',
    openedAt: at(-4 * DAY),
    expiresAt: at(-6 * HOUR),
    disputeReason: 'Counterparty asserts the ACH transfer was returned by the originating bank. Awaiting the return advice.',
    timeline: timeline([
      ['ACCEPTED', -4 * DAY, 'counterparty', 'Offer accepted'],
      ['AWAITING_PAYMENT', -4 * DAY + HOUR, 'system', 'Escrow funded — awaiting fiat payment'],
      ['PAYMENT_SENT', -3 * DAY, 'counterparty', 'Payment marked as sent', 'ACH trace 021000021456789'],
      ['DISPUTED', -2 * DAY, 'you', 'Dispute raised', 'Funds not credited after 48 hours'],
    ]),
    messages: [
      { at: at(-2.5 * DAY), from: 'you', body: 'Nothing credited yet. Can you share the trace confirmation?' },
      { at: at(-2 * DAY), from: 'counterparty', body: 'Our bank shows it as returned. Requesting the return advice now.' },
    ],
  }),
  makeDeal({
    id: 'dl-5005',
    offerId: 'of-1004',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'USD',
    crypto: 'USDT',
    fiatMinor: '25000000',
    rateMinor: '9994',
    depositPercent: 5,
    status: 'COMPLETE',
    counterparty: cp('cp-meridian'),
    paymentMethod: 'FEDWIRE',
    yourSide: 'TAKER',
    openedAt: at(-2 * DAY),
    expiresAt: null,
    timeline: timeline([
      ['ACCEPTED', -2 * DAY, 'you', 'Offer accepted'],
      ['AWAITING_PAYMENT', -2 * DAY + 10 * 60_000, 'system', 'Escrow funded — awaiting fiat payment'],
      ['PAYMENT_SENT', -2 * DAY + 45 * 60_000, 'counterparty', 'Payment marked as sent'],
      ['CRYPTO_RELEASED', -2 * DAY + 70 * 60_000, 'you', 'Funds confirmed — crypto released'],
      ['COMPLETE', -2 * DAY + 75 * 60_000, 'system', 'Settlement complete — deposits returned'],
    ]),
    messages: [],
  }),
  makeDeal({
    id: 'dl-5006',
    offerId: 'of-1003',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'EUR',
    crypto: 'USDC',
    fiatMinor: '1200000',
    rateMinor: '9210',
    depositPercent: 5,
    status: 'COMPLETE',
    counterparty: cp('cp-halden'),
    paymentMethod: 'SEPA_INSTANT',
    yourSide: 'MAKER',
    openedAt: at(-6 * DAY),
    expiresAt: null,
    timeline: timeline([
      ['ACCEPTED', -6 * DAY, 'counterparty', 'Offer accepted'],
      ['AWAITING_PAYMENT', -6 * DAY + 5 * 60_000, 'system', 'Escrow funded — awaiting fiat payment'],
      ['PAYMENT_SENT', -6 * DAY + 9 * 60_000, 'counterparty', 'Payment marked as sent'],
      ['CRYPTO_RELEASED', -6 * DAY + 14 * 60_000, 'you', 'Funds confirmed — crypto released'],
      ['COMPLETE', -6 * DAY + 15 * 60_000, 'system', 'Settlement complete — deposits returned'],
    ]),
    messages: [],
  }),
  makeDeal({
    id: 'dl-5007',
    offerId: 'of-1006',
    direction: 'CRYPTO_TO_FIAT',
    fiat: 'EUR',
    crypto: 'ETH',
    fiatMinor: '400000',
    rateMinor: '287340',
    depositPercent: 20,
    status: 'CANCELLED',
    counterparty: cp('cp-brightbay'),
    paymentMethod: 'SEPA',
    yourSide: 'TAKER',
    openedAt: at(-9 * DAY),
    expiresAt: null,
    timeline: timeline([
      ['ACCEPTED', -9 * DAY, 'you', 'Offer accepted'],
      ['AWAITING_PAYMENT', -9 * DAY + 20 * 60_000, 'system', 'Escrow funded — awaiting fiat payment'],
      ['CANCELLED', -9 * DAY + 3 * HOUR, 'counterparty', 'Cancelled by agreement', 'Counterparty could not meet the settlement window'],
    ]),
    messages: [
      { at: at(-9 * DAY + 2.5 * HOUR), from: 'counterparty', body: 'Apologies, our banking window closed. Can we cancel and re-open tomorrow?' },
    ],
  }),
  makeDeal({
    id: 'dl-5008',
    offerId: 'of-1007',
    direction: 'FIAT_TO_CRYPTO',
    fiat: 'EUR',
    crypto: 'BTC',
    fiatMinor: '150000',
    rateMinor: '5921800',
    depositPercent: 25,
    status: 'EXPIRED',
    counterparty: cp('cp-anon'),
    paymentMethod: 'SEPA',
    yourSide: 'MAKER',
    openedAt: at(-14 * DAY),
    expiresAt: null,
    timeline: timeline([
      ['ACCEPTED', -14 * DAY, 'counterparty', 'Offer accepted'],
      ['AWAITING_PAYMENT', -14 * DAY + 30 * 60_000, 'system', 'Escrow funded — awaiting fiat payment'],
      ['EXPIRED', -11 * DAY, 'system', 'Settlement window elapsed', 'No payment recorded within 72 hours'],
    ]),
    messages: [],
  }),
];

// ---- balances -------------------------------------------------------------

/**
 * Escrow holdings are summed from the deals that are actually open, so the
 * balances screen can never disagree with the settlements screen.
 */
const OPEN_STATUSES: DealStatus[] = [
  'ACCEPTED', 'AWAITING_PAYMENT', 'PAYMENT_SENT', 'CRYPTO_RELEASED', 'DISPUTED',
];

function escrowFor(asset: string): string {
  return DEALS.filter((d) => d.crypto === asset && OPEN_STATUSES.includes(d.status))
    .reduce((sum, d) => sum + BigInt(d.escrow.yourDepositMinor), 0n)
    .toString();
}

export const BALANCES: Balance[] = [
  { asset: 'USD', kind: 'FIAT', availableMinor: '48250000', inEscrowMinor: '0' },
  { asset: 'EUR', kind: 'FIAT', availableMinor: '21400000', inEscrowMinor: '0' },
  { asset: 'BTC', kind: 'CRYPTO', availableMinor: '184920000', inEscrowMinor: escrowFor('BTC') },
  { asset: 'ETH', kind: 'CRYPTO', availableMinor: '4210000000', inEscrowMinor: escrowFor('ETH') },
  { asset: 'USDC', kind: 'CRYPTO', availableMinor: '312400000000', inEscrowMinor: escrowFor('USDC') },
  { asset: 'USDT', kind: 'CRYPTO', availableMinor: '88000000000', inEscrowMinor: escrowFor('USDT') },
];
