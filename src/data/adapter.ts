/**
 * The seam between the desk UI and wherever settlement actually lives.
 *
 * Every view in this app talks to a `DeskAdapter` and nothing else. Two
 * implementations exist:
 *
 *   fixtureAdapter — deterministic in-memory data, used for development,
 *                    design review and tests. No wallet, no network.
 *   chainAdapter   — the same interface over the BitBay double-deposit
 *                    escrow contract.
 *
 * Adding a real backend is therefore a matter of completing one file, not
 * touching the UI. Anything a view needs must be expressed here first —
 * if a screen wants a number the contract cannot produce, that is a signal
 * to change the model, not to fabricate it in a component.
 */

import type {
  Balance,
  ConnectionState,
  Deal,
  DeskSummary,
  Offer,
  OfferFilter,
  OfferSort,
} from './types';

/** Raised when an adapter cannot serve a request. Views render these. */
export class AdapterError extends Error {
  readonly code: 'NOT_CONNECTED' | 'NOT_SUPPORTED' | 'REJECTED' | 'NETWORK' | 'NOT_FOUND';

  constructor(code: AdapterError['code'], message: string) {
    super(message);
    this.name = 'AdapterError';
    this.code = code;
  }
}

export interface AcceptOfferInput {
  offerId: string;
  /** Size the taker wants to settle, fiat minor units. */
  fiatMinor: string;
  paymentMethod: string;
}

export interface CreateOfferInput {
  direction: Offer['direction'];
  fiat: Offer['fiat'];
  crypto: Offer['crypto'];
  rateMinor: string;
  minFiatMinor: string;
  maxFiatMinor: string;
  paymentMethods: Offer['paymentMethods'];
  region: Offer['region'];
  depositPercent: number;
  timeLimitHours: number;
}

export interface DeskAdapter {
  /** Current connection/identity state. Synchronous so the shell can render it. */
  getConnection(): ConnectionState;

  /** Subscribe to connection changes. Returns an unsubscribe function. */
  onConnectionChange(listener: (state: ConnectionState) => void): () => void;

  /** Prompt for a wallet / session. No-op for fixtures. */
  connect(): Promise<ConnectionState>;
  disconnect(): Promise<void>;

  // ---- reads -------------------------------------------------------------

  listOffers(filter: OfferFilter, sort: OfferSort): Promise<Offer[]>;
  getOffer(id: string): Promise<Offer>;

  /** Deals you are a party to. */
  listDeals(): Promise<Deal[]>;
  getDeal(id: string): Promise<Deal>;

  listBalances(): Promise<Balance[]>;
  getSummary(): Promise<DeskSummary>;

  // ---- writes ------------------------------------------------------------

  acceptOffer(input: AcceptOfferInput): Promise<Deal>;
  createOffer(input: CreateOfferInput): Promise<Offer>;

  /** Fiat sender asserts payment has left their account. */
  markPaymentSent(dealId: string): Promise<Deal>;
  /** Fiat receiver confirms funds landed; releases crypto from escrow. */
  confirmPaymentReceived(dealId: string): Promise<Deal>;
  /** Mutual cancellation request. */
  cancelDeal(dealId: string, reason: string): Promise<Deal>;
  raiseDispute(dealId: string, reason: string): Promise<Deal>;

  sendMessage(dealId: string, body: string): Promise<Deal>;
}
