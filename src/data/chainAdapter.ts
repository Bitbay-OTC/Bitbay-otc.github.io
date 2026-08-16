/**
 * Chain implementation of `DeskAdapter` — the wiring point for the BitBay
 * double-deposit escrow contract.
 *
 * This file is deliberately unfinished, and it is honest about it: every
 * method throws `NOT_SUPPORTED` rather than returning plausible-looking
 * data. A half-wired adapter that invents numbers is worse than one that
 * refuses, because the UI cannot tell the difference.
 *
 * ## What completing this involves
 *
 * 1. Add a web3 client (`ethers` or `web3`) and the DDE ABI.
 * 2. Implement `connect()` against `window.ethereum`, and keep
 *    `getConnection()` synchronous by caching the last known state.
 * 3. Map contract reads onto the domain model in `types.ts`.
 *
 * ## Where the contract and the desk model diverge
 *
 * The escrow contract stores a two-element status pair and a token/amount
 * pair. It does **not** store:
 *
 *   - fiat currency, rate, or spread — offers encode these in free text
 *   - payment method or region
 *   - counterparty trade count, completion rate or response time
 *   - verification tier
 *
 * Those fields power the market board's filters and the trust card. Serving
 * them needs one of:
 *
 *   a) a structured offer payload (JSON in the existing offer message /
 *      IPFS document) that the desk writes and parses, plus
 *   b) an indexer that derives counterparty statistics from settled
 *      contract history.
 *
 * Until (a) and (b) exist, a chain adapter can serve offers, deals,
 * balances and the full settlement lifecycle, but must report trust and
 * spread fields as unknown rather than guessing. The domain model already
 * allows this: `alias` and `medianResponseMinutes` are nullable, and
 * `riskFlags` may carry `NEW_COUNTERPARTY` when there is no history.
 */

import { AdapterError } from './adapter';
import type { AcceptOfferInput, CreateOfferInput, DeskAdapter } from './adapter';
import type {
  Balance,
  ConnectionState,
  Deal,
  DeskSummary,
  Offer,
  OfferFilter,
  OfferSort,
} from './types';

export interface ChainAdapterOptions {
  /** Deployed DDE escrow contract address. */
  contractAddress: string;
  /** Human label for the network, shown in the header. */
  networkLabel: string;
}

const unimplemented = (what: string): never => {
  throw new AdapterError(
    'NOT_SUPPORTED',
    `${what} is not wired to the escrow contract yet. See src/data/chainAdapter.ts.`,
  );
};

export class ChainAdapter implements DeskAdapter {
  readonly #options: ChainAdapterOptions;
  #listeners = new Set<(state: ConnectionState) => void>();

  #connection: ConnectionState;

  constructor(options: ChainAdapterOptions) {
    this.#options = options;
    this.#connection = {
      kind: 'CHAIN',
      connected: false,
      account: null,
      label: options.networkLabel,
      error: 'Chain adapter not implemented',
    };
  }

  get contractAddress(): string {
    return this.#options.contractAddress;
  }

  getConnection(): ConnectionState {
    return this.#connection;
  }

  onConnectionChange(listener: (state: ConnectionState) => void): () => void {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  async connect(): Promise<ConnectionState> {
    return unimplemented('Wallet connection');
  }

  async disconnect(): Promise<void> {
    this.#connection = { ...this.#connection, connected: false, account: null };
    for (const l of this.#listeners) l(this.#connection);
  }

  async listOffers(_filter: OfferFilter, _sort: OfferSort): Promise<Offer[]> {
    return unimplemented('Reading offers');
  }

  async getOffer(_id: string): Promise<Offer> {
    return unimplemented('Reading an offer');
  }

  async listDeals(): Promise<Deal[]> {
    return unimplemented('Reading deals');
  }

  async getDeal(_id: string): Promise<Deal> {
    return unimplemented('Reading a deal');
  }

  async listBalances(): Promise<Balance[]> {
    return unimplemented('Reading balances');
  }

  async getSummary(): Promise<DeskSummary> {
    return unimplemented('Desk summary');
  }

  async acceptOffer(_input: AcceptOfferInput): Promise<Deal> {
    return unimplemented('Accepting an offer');
  }

  async createOffer(_input: CreateOfferInput): Promise<Offer> {
    return unimplemented('Creating an offer');
  }

  async markPaymentSent(_dealId: string): Promise<Deal> {
    return unimplemented('Marking payment sent');
  }

  async confirmPaymentReceived(_dealId: string): Promise<Deal> {
    return unimplemented('Confirming payment');
  }

  async cancelDeal(_dealId: string, _reason: string): Promise<Deal> {
    return unimplemented('Cancelling a deal');
  }

  async raiseDispute(_dealId: string, _reason: string): Promise<Deal> {
    return unimplemented('Raising a dispute');
  }

  async sendMessage(_dealId: string, _body: string): Promise<Deal> {
    return unimplemented('Messaging');
  }
}
