/**
 * Domain model for the OTC desk.
 *
 * These types describe settlement as a desk sees it, not as the chain stores
 * it. Adapters are responsible for translating whatever the underlying
 * contract exposes into these shapes.
 *
 * Money rule: every amount is a **minor-unit integer string** (cents for
 * fiat, satoshi/wei-scale base units for crypto), never a float. Rates and
 * spreads are the only decimals, and they are basis points or fixed-scale
 * decimal strings. This keeps rounding out of the UI layer entirely.
 */

export type FiatCurrency = 'USD' | 'EUR';

export type CryptoAsset = 'BTC' | 'ETH' | 'USDT' | 'USDC';

/** Which way value moves, from the perspective of the offer's maker. */
export type Direction =
  /** Maker sells crypto; taker pays fiat. Taker is buying crypto. */
  | 'FIAT_TO_CRYPTO'
  /** Maker buys crypto; taker receives fiat. Taker is selling crypto. */
  | 'CRYPTO_TO_FIAT';

export type PaymentMethod =
  | 'SEPA_INSTANT'
  | 'SEPA'
  | 'FEDWIRE'
  | 'ACH'
  | 'SWIFT'
  | 'FASTER_PAYMENTS';

export type Region = 'EU' | 'US' | 'UK' | 'APAC' | 'GLOBAL';

/** Counterparty verification tier. Ordered: none < basic < enhanced < institutional. */
export type VerificationTier = 'NONE' | 'BASIC' | 'ENHANCED' | 'INSTITUTIONAL';

export type RiskFlag =
  | 'NEW_COUNTERPARTY'
  | 'LOW_COMPLETION_RATE'
  | 'SLOW_RESPONSE'
  | 'DISPUTE_HISTORY'
  | 'LIMIT_MISMATCH';

/**
 * Settlement lifecycle. Deliberately explicit about *who owes the next
 * action*, because that is the question a desk operator asks first.
 */
export type DealStatus =
  /** Offer is live on the board, nobody has committed. */
  | 'OPEN'
  /** Both sides committed and posted escrow deposits. */
  | 'ACCEPTED'
  /** Escrow funded; fiat sender must send payment. */
  | 'AWAITING_PAYMENT'
  /** Fiat sender marked payment sent; receiver must confirm. */
  | 'PAYMENT_SENT'
  /** Fiat confirmed; crypto released from escrow. */
  | 'CRYPTO_RELEASED'
  /** Both sides signed off, deposits returned. */
  | 'COMPLETE'
  /** Cancelled by agreement before settlement. */
  | 'CANCELLED'
  /** One side raised a dispute. */
  | 'DISPUTED'
  /** Time limit elapsed without resolution. */
  | 'EXPIRED';

/** Colour band a status maps to. Drives every status affordance in the UI. */
export type StatusBand = 'open' | 'active' | 'attention' | 'settled' | 'closed' | 'danger';

export interface Counterparty {
  id: string;
  /** On-chain address. Always shown in full somewhere on the deal record. */
  address: string;
  /** Human label the counterparty published, if any. */
  alias: string | null;
  verification: VerificationTier;
  /** Completed settlements, all time. */
  tradeCount: number;
  /** 0..1. Completed / (completed + cancelled + disputed). */
  completionRate: number;
  /** Median first response, minutes. Null when there is no sample yet. */
  medianResponseMinutes: number | null;
  memberSince: string; // ISO date
  /** Regions this counterparty settles in. */
  regions: Region[];
  riskFlags: RiskFlag[];
}

export interface Offer {
  id: string;
  direction: Direction;
  fiat: FiatCurrency;
  crypto: CryptoAsset;
  /**
   * Price of one whole crypto unit in fiat minor units, as a decimal string.
   * e.g. BTC/USD at 64,210.50 -> "6421050".
   */
  rateMinor: string;
  /** Desk reference (mid-market) at quote time, same scale as rateMinor. */
  referenceRateMinor: string;
  /** Signed basis points vs reference. Positive = above mid. */
  spreadBps: number;
  /** Trade size bounds, fiat minor units. */
  minFiatMinor: string;
  maxFiatMinor: string;
  paymentMethods: PaymentMethod[];
  region: Region;
  counterparty: Counterparty;
  /** Escrow deposit required of each side, as a percentage of notional. */
  depositPercent: number;
  /** Settlement window once accepted. */
  timeLimitHours: number;
  createdAt: string; // ISO
}

export interface TimelineEvent {
  at: string; // ISO
  status: DealStatus;
  label: string;
  /** Who moved it. 'you' | 'counterparty' | 'system' */
  actor: 'you' | 'counterparty' | 'system';
  detail?: string;
}

export interface Message {
  at: string; // ISO
  from: 'you' | 'counterparty';
  body: string;
}

export interface Deal {
  id: string;
  offerId: string;
  direction: Direction;
  fiat: FiatCurrency;
  crypto: CryptoAsset;
  /** Agreed notional. */
  fiatMinor: string;
  cryptoMinor: string;
  rateMinor: string;
  status: DealStatus;
  counterparty: Counterparty;
  paymentMethod: PaymentMethod;
  /** Escrow deposits actually posted, crypto minor units. */
  escrow: {
    yourDepositMinor: string;
    counterpartyDepositMinor: string;
  };
  /** Which side you are on this deal. */
  yourSide: 'MAKER' | 'TAKER';
  openedAt: string; // ISO
  /** Settlement deadline. Null once terminal. */
  expiresAt: string | null;
  timeline: TimelineEvent[];
  messages: Message[];
  /** Set only when status is DISPUTED. */
  disputeReason?: string;
}

export interface Balance {
  asset: CryptoAsset | FiatCurrency;
  kind: 'CRYPTO' | 'FIAT';
  availableMinor: string;
  inEscrowMinor: string;
}

/** Aggregate shown on the dashboard. */
export interface DeskSummary {
  openOffers: number;
  activeDeals: number;
  /** Deals where the next action is yours. */
  awaitingYou: number;
  settledLast30d: number;
  /** Notional settled in the last 30 days, in the desk's reporting currency. */
  volume30dMinor: string;
  volumeCurrency: FiatCurrency;
}

/** Filter state for the market board. All fields optional = unfiltered. */
export interface OfferFilter {
  direction?: Direction;
  fiat?: FiatCurrency;
  crypto?: CryptoAsset;
  paymentMethods?: PaymentMethod[];
  region?: Region;
  /** Only offers whose [min,max] band contains this fiat minor amount. */
  sizeMinor?: string;
  /** Minimum verification tier. */
  minVerification?: VerificationTier;
  /** Free text over alias and address. */
  query?: string;
}

export type OfferSort =
  | 'BEST_RATE'
  | 'TIGHTEST_SPREAD'
  | 'LARGEST_SIZE'
  | 'MOST_TRUSTED'
  | 'NEWEST';

/** Connection state of whatever adapter is active. */
export interface ConnectionState {
  kind: 'FIXTURE' | 'CHAIN';
  connected: boolean;
  /** Address when connected to a chain adapter. */
  account: string | null;
  /** Human label, e.g. "Fixture data" or "Polygon". */
  label: string;
  /** Set when the adapter cannot serve requests. */
  error?: string;
}
