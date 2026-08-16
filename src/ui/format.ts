/**
 * Formatting for money, rates, spreads and time.
 *
 * All monetary values enter as minor-unit integer strings and are formatted
 * with BigInt arithmetic. No amount is ever parsed into a JS number — a
 * float would silently misprice an eight-decimal crypto notional.
 */

import type { CryptoAsset, Direction, FiatCurrency, PaymentMethod, VerificationTier } from '../data/types';
import { decimalsFor } from '../data/money';

// Money arithmetic lives in the domain layer; re-exported here so views
// have a single import for "everything about displaying an amount".
export {
  decimalsFor,
  fiatToCrypto,
  cryptoToFiat,
  percentOf,
  compareMinor,
  addMinor,
} from '../data/money';

/**
 * Convert a minor-unit integer string into a display string with grouping.
 * `maxFractionDigits` trims trailing precision without rounding the integer
 * part — crypto amounts stay exact, they just stop displaying dust.
 */
export function formatAmount(
  minor: string,
  asset: string,
  opts: { maxFractionDigits?: number } = {},
): string {
  const decimals = decimalsFor(asset);
  const negative = minor.startsWith('-');
  const digits = (negative ? minor.slice(1) : minor).replace(/\D/g, '') || '0';

  const padded = digits.padStart(decimals + 1, '0');
  const whole = padded.slice(0, padded.length - decimals) || '0';
  let fraction = decimals > 0 ? padded.slice(padded.length - decimals) : '';

  const maxFraction = opts.maxFractionDigits ?? decimals;
  if (fraction.length > maxFraction) fraction = fraction.slice(0, maxFraction);
  // Trim trailing zeros but always keep at least 2 for fiat-like scales.
  const floor = decimals >= 6 ? 2 : decimals;
  while (fraction.length > floor && fraction.endsWith('0')) fraction = fraction.slice(0, -1);

  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const body = fraction ? `${grouped}.${fraction}` : grouped;
  return negative ? `-${body}` : body;
}

const FIAT_SYMBOL: Record<FiatCurrency, string> = { USD: '$', EUR: '€' };

export function formatFiat(minor: string, currency: FiatCurrency): string {
  return `${FIAT_SYMBOL[currency]}${formatAmount(minor, currency)}`;
}

export function formatCrypto(minor: string, asset: CryptoAsset): string {
  return `${formatAmount(minor, asset)} ${asset}`;
}

/** Rate is "fiat minor per one whole crypto unit". */
export function formatRate(rateMinor: string, fiat: FiatCurrency, crypto: CryptoAsset): string {
  return `${formatFiat(rateMinor, fiat)} / ${crypto}`;
}

export function formatSpread(bps: number): string {
  const sign = bps > 0 ? '+' : '';
  return `${sign}${(bps / 100).toFixed(2)}%`;
}

// ---- labels ---------------------------------------------------------------

export function directionLabel(d: Direction, fiat: FiatCurrency, crypto: CryptoAsset): string {
  return d === 'FIAT_TO_CRYPTO' ? `${fiat} → ${crypto}` : `${crypto} → ${fiat}`;
}

/** What the *taker* does when they hit this offer. */
export function takerActionLabel(d: Direction): string {
  return d === 'FIAT_TO_CRYPTO' ? 'Buy crypto' : 'Sell crypto';
}

export const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  SEPA_INSTANT: 'SEPA Instant',
  SEPA: 'SEPA',
  FEDWIRE: 'Fedwire',
  ACH: 'ACH',
  SWIFT: 'SWIFT',
  FASTER_PAYMENTS: 'Faster Payments',
};

export const VERIFICATION_LABEL: Record<VerificationTier, string> = {
  NONE: 'Unverified',
  BASIC: 'Basic',
  ENHANCED: 'Enhanced',
  INSTITUTIONAL: 'Institutional',
};

export { VERIFICATION_RANK } from '../data/status';

export function shortAddress(address: string): string {
  return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function formatPercent(ratio: number, digits = 1): string {
  return `${(ratio * 100).toFixed(digits)}%`;
}

export function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return 'No sample';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = minutes / 60;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)} h`;
  return `${Math.round(hours / 24)} d`;
}

// ---- time -----------------------------------------------------------------

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

/** Compact "time left" for settlement deadlines. */
export function formatTimeRemaining(iso: string | null, now = Date.now()): string {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - now;
  if (ms <= 0) return 'Elapsed';
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m left`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ${minutes % 60}m left`;
  return `${Math.floor(hours / 24)}d left`;
}

/** True when a deadline is close enough to warrant an attention treatment. */
export function isUrgent(iso: string | null, now = Date.now()): boolean {
  if (!iso) return false;
  const ms = new Date(iso).getTime() - now;
  return ms > 0 && ms < 4 * 3600 * 1000;
}

export function relativeTime(iso: string, now = Date.now()): string {
  const ms = now - new Date(iso).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}d ago` : formatDate(iso);
}
