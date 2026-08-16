/**
 * Fixture implementation of `DeskAdapter`.
 *
 * Holds mutable copies of the fixture data so writes behave like a real
 * backend within a session: accepting an offer produces a deal that then
 * appears in the deals list and advances through settlement.
 *
 * A small artificial latency is applied so loading and pending states are
 * exercised during development rather than only in production.
 */

import { AdapterError } from './adapter';
import type { AcceptOfferInput, CreateOfferInput, DeskAdapter } from './adapter';
import { BALANCES, DEALS, OFFERS } from './fixtures';
import { awaitsYou, STATUS_META, VERIFICATION_RANK } from './status';
import { compareMinor, fiatToCrypto, percentOf } from './money';
import type {
  Balance,
  ConnectionState,
  Deal,
  DealStatus,
  DeskSummary,
  Offer,
  OfferFilter,
  OfferSort,
  TimelineEvent,
} from './types';

const LATENCY_MS = 220;

const delay = <T>(value: T, ms = LATENCY_MS): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

const clone = <T>(value: T): T => structuredClone(value);

export class FixtureAdapter implements DeskAdapter {
  #offers: Offer[] = clone(OFFERS);
  #deals: Deal[] = clone(DEALS);
  #balances: Balance[] = clone(BALANCES);
  #nextId = 6000;

  #connection: ConnectionState = {
    kind: 'FIXTURE',
    connected: true,
    account: '0x3F9a7C2e5B8d1046F3a9C7e2B5d81046F3a9C7e2',
    label: 'Fixture data',
  };

  #listeners = new Set<(state: ConnectionState) => void>();

  getConnection(): ConnectionState {
    return this.#connection;
  }

  onConnectionChange(listener: (state: ConnectionState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #emit(): void {
    for (const listener of this.#listeners) listener(this.#connection);
  }

  async connect(): Promise<ConnectionState> {
    this.#connection = { ...this.#connection, connected: true };
    this.#emit();
    return delay(this.#connection);
  }

  async disconnect(): Promise<void> {
    this.#connection = { ...this.#connection, connected: false, account: null };
    this.#emit();
  }

  // ---- reads --------------------------------------------------------------

  async listOffers(filter: OfferFilter, sort: OfferSort): Promise<Offer[]> {
    let rows = this.#offers.slice();

    if (filter.direction) rows = rows.filter((o) => o.direction === filter.direction);
    if (filter.fiat) rows = rows.filter((o) => o.fiat === filter.fiat);
    if (filter.crypto) rows = rows.filter((o) => o.crypto === filter.crypto);
    if (filter.region) rows = rows.filter((o) => o.region === filter.region);

    if (filter.paymentMethods?.length) {
      const wanted = new Set(filter.paymentMethods);
      rows = rows.filter((o) => o.paymentMethods.some((m) => wanted.has(m)));
    }

    if (filter.minVerification) {
      const floor = VERIFICATION_RANK[filter.minVerification];
      rows = rows.filter((o) => VERIFICATION_RANK[o.counterparty.verification] >= floor);
    }

    // Size band containment: the offer must be able to fill this notional.
    if (filter.sizeMinor && filter.sizeMinor !== '0') {
      rows = rows.filter(
        (o) =>
          compareMinor(o.minFiatMinor, filter.sizeMinor!) <= 0 &&
          compareMinor(o.maxFiatMinor, filter.sizeMinor!) >= 0,
      );
    }

    if (filter.query) {
      const q = filter.query.trim().toLowerCase();
      if (q) {
        rows = rows.filter(
          (o) =>
            (o.counterparty.alias ?? '').toLowerCase().includes(q) ||
            o.counterparty.address.toLowerCase().includes(q) ||
            o.crypto.toLowerCase().includes(q) ||
            o.fiat.toLowerCase().includes(q),
        );
      }
    }

    rows.sort((a, b) => {
      switch (sort) {
        case 'TIGHTEST_SPREAD':
          return Math.abs(a.spreadBps) - Math.abs(b.spreadBps);
        case 'LARGEST_SIZE':
          return compareMinor(b.maxFiatMinor, a.maxFiatMinor);
        case 'MOST_TRUSTED':
          return (
            VERIFICATION_RANK[b.counterparty.verification] -
              VERIFICATION_RANK[a.counterparty.verification] ||
            b.counterparty.tradeCount - a.counterparty.tradeCount
          );
        case 'NEWEST':
          return Date.parse(b.createdAt) - Date.parse(a.createdAt);
        case 'BEST_RATE':
        default:
          // "Best" depends on which way the taker is going, so rank by how
          // favourable the spread is to the taker: lower is better.
          return a.spreadBps - b.spreadBps;
      }
    });

    return delay(clone(rows));
  }

  async getOffer(id: string): Promise<Offer> {
    const found = this.#offers.find((o) => o.id === id);
    if (!found) throw new AdapterError('NOT_FOUND', `No offer ${id}`);
    return delay(clone(found));
  }

  async listDeals(): Promise<Deal[]> {
    const rows = this.#deals.slice().sort((a, b) => {
      // Deals needing your action float to the top, then by recency.
      const aWaits = awaitsYou(a) ? 0 : 1;
      const bWaits = awaitsYou(b) ? 0 : 1;
      if (aWaits !== bWaits) return aWaits - bWaits;
      const aTerm = STATUS_META[a.status].terminal ? 1 : 0;
      const bTerm = STATUS_META[b.status].terminal ? 1 : 0;
      if (aTerm !== bTerm) return aTerm - bTerm;
      return Date.parse(b.openedAt) - Date.parse(a.openedAt);
    });
    return delay(clone(rows));
  }

  async getDeal(id: string): Promise<Deal> {
    const found = this.#deals.find((d) => d.id === id);
    if (!found) throw new AdapterError('NOT_FOUND', `No deal ${id}`);
    return delay(clone(found));
  }

  async listBalances(): Promise<Balance[]> {
    return delay(clone(this.#balances));
  }

  async getSummary(): Promise<DeskSummary> {
    const active = this.#deals.filter((d) => !STATUS_META[d.status].terminal);
    const thirtyDaysAgo = Date.now() - 30 * 86400_000;
    const settled = this.#deals.filter(
      (d) => d.status === 'COMPLETE' && Date.parse(d.openedAt) >= thirtyDaysAgo,
    );

    // Volume is reported in USD; EUR notionals are converted at a fixed
    // fixture reference so the figure is deterministic.
    const EUR_USD_BPS = 10850n; // 1 EUR = 1.0850 USD
    const volume = settled.reduce((sum, d) => {
      const minor = BigInt(d.fiatMinor);
      return sum + (d.fiat === 'EUR' ? (minor * EUR_USD_BPS) / 10000n : minor);
    }, 0n);

    return delay({
      openOffers: this.#offers.length,
      activeDeals: active.length,
      awaitingYou: this.#deals.filter(awaitsYou).length,
      settledLast30d: settled.length,
      volume30dMinor: volume.toString(),
      volumeCurrency: 'USD',
    });
  }

  // ---- writes -------------------------------------------------------------

  async acceptOffer(input: AcceptOfferInput): Promise<Deal> {
    const offer = this.#offers.find((o) => o.id === input.offerId);
    if (!offer) throw new AdapterError('NOT_FOUND', `No offer ${input.offerId}`);

    if (
      compareMinor(input.fiatMinor, offer.minFiatMinor) < 0 ||
      compareMinor(input.fiatMinor, offer.maxFiatMinor) > 0
    ) {
      throw new AdapterError('REJECTED', 'Size is outside this offer’s limits.');
    }

    const cryptoMinor = fiatToCrypto(input.fiatMinor, offer.rateMinor, offer.crypto);
    const deposit = percentOf(cryptoMinor, offer.depositPercent);
    const now = new Date().toISOString();

    const deal: Deal = {
      id: `dl-${this.#nextId++}`,
      offerId: offer.id,
      direction: offer.direction,
      fiat: offer.fiat,
      crypto: offer.crypto,
      fiatMinor: input.fiatMinor,
      cryptoMinor,
      rateMinor: offer.rateMinor,
      status: 'AWAITING_PAYMENT',
      counterparty: offer.counterparty,
      paymentMethod: input.paymentMethod as Deal['paymentMethod'],
      escrow: { yourDepositMinor: deposit, counterpartyDepositMinor: deposit },
      yourSide: 'TAKER',
      openedAt: now,
      expiresAt: new Date(Date.now() + offer.timeLimitHours * 3600_000).toISOString(),
      timeline: [
        { at: now, status: 'ACCEPTED', label: 'Offer accepted', actor: 'you' },
        { at: now, status: 'ACCEPTED', label: 'Escrow deposit posted', actor: 'you' },
        { at: now, status: 'AWAITING_PAYMENT', label: 'Escrow funded — awaiting fiat payment', actor: 'system' },
      ],
      messages: [],
    };

    this.#deals.unshift(deal);
    return delay(clone(deal), 600);
  }

  async createOffer(input: CreateOfferInput): Promise<Offer> {
    const offer: Offer = {
      id: `of-${this.#nextId++}`,
      ...input,
      // A self-made offer quotes against the current fixture reference.
      referenceRateMinor: input.rateMinor,
      spreadBps: 0,
      counterparty: {
        id: 'cp-you',
        address: this.#connection.account ?? '0x0',
        alias: 'You',
        verification: 'ENHANCED',
        tradeCount: 0,
        completionRate: 1,
        medianResponseMinutes: null,
        memberSince: new Date().toISOString().slice(0, 10),
        regions: [input.region],
        riskFlags: [],
      },
      createdAt: new Date().toISOString(),
    };
    this.#offers.unshift(offer);
    return delay(clone(offer), 600);
  }

  #advance(dealId: string, status: DealStatus, event: Omit<TimelineEvent, 'at' | 'status'>): Promise<Deal> {
    const deal = this.#deals.find((d) => d.id === dealId);
    if (!deal) throw new AdapterError('NOT_FOUND', `No deal ${dealId}`);
    deal.status = status;
    deal.timeline = [
      ...deal.timeline,
      { at: new Date().toISOString(), status, ...event },
    ];
    if (STATUS_META[status].terminal) deal.expiresAt = null;
    return delay(clone(deal), 600);
  }

  async markPaymentSent(dealId: string): Promise<Deal> {
    return this.#advance(dealId, 'PAYMENT_SENT', {
      label: 'Payment marked as sent',
      actor: 'you',
    });
  }

  async confirmPaymentReceived(dealId: string): Promise<Deal> {
    await this.#advance(dealId, 'CRYPTO_RELEASED', {
      label: 'Funds confirmed — crypto released',
      actor: 'you',
    });
    return this.#advance(dealId, 'COMPLETE', {
      label: 'Settlement complete — deposits returned',
      actor: 'system',
    });
  }

  async cancelDeal(dealId: string, reason: string): Promise<Deal> {
    return this.#advance(dealId, 'CANCELLED', {
      label: 'Cancelled by agreement',
      actor: 'you',
      detail: reason,
    });
  }

  async raiseDispute(dealId: string, reason: string): Promise<Deal> {
    const deal = this.#deals.find((d) => d.id === dealId);
    if (deal) deal.disputeReason = reason;
    return this.#advance(dealId, 'DISPUTED', {
      label: 'Dispute raised',
      actor: 'you',
      detail: reason,
    });
  }

  async sendMessage(dealId: string, body: string): Promise<Deal> {
    const deal = this.#deals.find((d) => d.id === dealId);
    if (!deal) throw new AdapterError('NOT_FOUND', `No deal ${dealId}`);
    deal.messages = [...deal.messages, { at: new Date().toISOString(), from: 'you', body }];
    return delay(clone(deal), 300);
  }
}
