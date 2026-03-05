/**
 * Parimutuel market math utilities
 */

export function calcProbability(yesPool: number, noPool: number): number {
  const total = yesPool + noPool;
  if (total === 0) return -1; // -1 signals "no bets yet"
  return (yesPool / total) * 100;
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

export function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)}`;
}

export function formatPercent(value: number): string {
  if (value < 0) return "—";
  return `${Math.round(value)}%`;
}
