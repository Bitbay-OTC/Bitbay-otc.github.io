/**
 * Minor-unit money arithmetic.
 *
 * Domain-layer, not presentation: fixtures, adapters and views all derive
 * amounts through these functions so a notional can never disagree with
 * the rate it was priced at.
 *
 * Every value is a minor-unit integer string. Nothing here parses a value
 * into a JS number.
 */

/** Minor-unit exponent per asset. */
const DECIMALS: Record<string, number> = {
  USD: 2,
  EUR: 2,
  BTC: 8,
  ETH: 8,
  USDT: 6,
  USDC: 6,
};

export function decimalsFor(asset: string): number {
  return DECIMALS[asset] ?? 2;
}

/**
 * Crypto amount bought by a fiat notional at a given rate.
 *
 * `rateMinor` is fiat minor units per **one whole** crypto unit, so the
 * conversion scales by the crypto's own precision:
 *
 *   crypto_minor = fiat_minor * 10^crypto_decimals / rate_minor
 *
 * Truncates toward zero — a desk never rounds a notional up.
 */
export function fiatToCrypto(fiatMinor: string, rateMinor: string, crypto: string): string {
  const rate = BigInt(rateMinor);
  if (rate === 0n) return '0';
  const scale = 10n ** BigInt(decimalsFor(crypto));
  return ((BigInt(fiatMinor) * scale) / rate).toString();
}

/** Inverse of `fiatToCrypto`, for quoting a crypto amount in fiat. */
export function cryptoToFiat(cryptoMinor: string, rateMinor: string, crypto: string): string {
  const scale = 10n ** BigInt(decimalsFor(crypto));
  return ((BigInt(cryptoMinor) * BigInt(rateMinor)) / scale).toString();
}

/** Percentage of a minor amount, truncated. `percent` may be fractional. */
export function percentOf(minor: string, percent: number): string {
  const scaled = BigInt(Math.round(percent * 100));
  return ((BigInt(minor) * scaled) / 10000n).toString();
}

export function compareMinor(a: string, b: string): number {
  const x = BigInt(a);
  const y = BigInt(b);
  return x < y ? -1 : x > y ? 1 : 0;
}

export function addMinor(a: string, b: string): string {
  return (BigInt(a) + BigInt(b)).toString();
}
