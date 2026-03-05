/**
 * Parimutuel market math utilities
 */

interface MarketLike {
  id: string;
  yes_pool: number;
  no_pool: number;
}

/** Per-market probability (only considers this market's pools). Returns -1 if no bets. */
export function calcProbability(yesPool: number, noPool: number): number {
  const total = yesPool + noPool;
  if (total === 0) return -1; // -1 signals "no bets yet"
  return (yesPool / total) * 100;
}

/**
 * Normalized probability across a category.
 *
 * Algorithm:
 * 1. Candidates WITH bets: raw = yes_pool / (yes_pool + no_pool)
 * 2. Candidates WITHOUT bets: share whatever probability is left
 * 3. If bet candidates sum < 100%: remainder split equally among no-bet candidates
 * 4. If bet candidates sum >= 100%: normalize bet candidates, no-bet get MIN_SHARE each
 * 5. Always sums to 100%
 *
 * Examples:
 *   Henry $3Y/$1N, Yashas $0, Anish $0 → 75%, 12.5%, 12.5%
 *   A $0Y/$5N, B $0, C $0 → 0%, 50%, 50%
 *   All zero → 33.3% each
 *
 * Returns a Map of market_id -> probability (0-100).
 */
export function calcCategoryProbabilities(markets: MarketLike[]): Map<string, number> {
  const result = new Map<string, number>();
  const n = markets.length;
  if (n === 0) return result;

  const MIN_SHARE = 2; // 2% minimum per no-bet candidate

  const withBets: MarketLike[] = [];
  const withoutBets: MarketLike[] = [];
  markets.forEach((m) => {
    if (m.yes_pool + m.no_pool > 0) {
      withBets.push(m);
    } else {
      withoutBets.push(m);
    }
  });

  // No bets anywhere → equal split
  if (withBets.length === 0) {
    const prob = 100 / n;
    markets.forEach((m) => result.set(m.id, prob));
    return result;
  }

  // Compute raw probabilities (0-1) for bet candidates
  const rawProbs = new Map<string, number>();
  withBets.forEach((m) => {
    rawProbs.set(m.id, m.yes_pool / (m.yes_pool + m.no_pool));
  });
  const sumRaw = Array.from(rawProbs.values()).reduce((a, b) => a + b, 0);

  // All candidates have bets → normalize to 100%
  if (withoutBets.length === 0) {
    if (sumRaw === 0) {
      // All pure-NO bets → equal split
      markets.forEach((m) => result.set(m.id, 100 / n));
    } else {
      withBets.forEach((m) => {
        result.set(m.id, ((rawProbs.get(m.id) ?? 0) / sumRaw) * 100);
      });
    }
    return result;
  }

  // Mix of bet and no-bet candidates
  const sumRawPercent = sumRaw * 100;

  if (sumRawPercent < 100) {
    // Bet candidates keep raw probability; remainder to no-bet candidates
    const remainder = 100 - sumRawPercent;
    const sharePerNoBet = remainder / withoutBets.length;
    withBets.forEach((m) => {
      result.set(m.id, (rawProbs.get(m.id) ?? 0) * 100);
    });
    withoutBets.forEach((m) => {
      result.set(m.id, sharePerNoBet);
    });
  } else {
    // Bet candidates sum >= 100% — normalize them, give no-bet MIN_SHARE
    const noBetTotal = Math.min(MIN_SHARE * withoutBets.length, 50);
    const betTotal = 100 - noBetTotal;
    withBets.forEach((m) => {
      result.set(m.id, ((rawProbs.get(m.id) ?? 0) / sumRaw) * betTotal);
    });
    withoutBets.forEach((m) => {
      result.set(m.id, noBetTotal / withoutBets.length);
    });
  }

  return result;
}

/** Get a single candidate's normalized probability within its category */
export function calcCategoryProb(market: MarketLike, allMarkets: MarketLike[]): number {
  const probs = calcCategoryProbabilities(allMarkets);
  return probs.get(market.id) ?? (100 / allMarkets.length);
}

export function hasLiquidity(yesPool: number, noPool: number): boolean {
  return yesPool + noPool > 0;
}

export function calcPayout(
  side: "YES" | "NO",
  amount: number,
  yesPool: number,
  noPool: number
): number {
  const total = yesPool + noPool + amount;
  const winningPool =
    side === "YES" ? yesPool + amount : noPool + amount;
  if (winningPool === 0) return 0;
  return (amount / winningPool) * total;
}

export function calcMultiplier(
  side: "YES" | "NO",
  yesPool: number,
  noPool: number
): number {
  const total = yesPool + noPool;
  if (total === 0) return 0; // no liquidity — show "—"
  const winningPool = side === "YES" ? yesPool : noPool;
  if (winningPool === 0) return total + 1;
  return total / winningPool;
}

/** Category-normalized payout: amount / price where price = prob/100 for YES */
export function calcCategoryPayout(
  side: "YES" | "NO",
  amount: number,
  normalizedProb: number // 0-100
): number {
  const price = side === "YES" ? normalizedProb / 100 : (100 - normalizedProb) / 100;
  if (price <= 0) return 0;
  return amount / price;
}

/** Category-normalized multiplier: 1 / price */
export function calcCategoryMultiplier(
  side: "YES" | "NO",
  normalizedProb: number // 0-100
): number {
  const price = side === "YES" ? normalizedProb / 100 : (100 - normalizedProb) / 100;
  if (price <= 0) return 0;
  return 1 / price;
}

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  if (value < 0) return "—";
  return `${Math.round(value)}%`;
}
