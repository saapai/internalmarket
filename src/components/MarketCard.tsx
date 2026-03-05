"use client";

import { useRouter } from "next/navigation";
import Card from "./ui/Card";
import ProbabilityBar from "./ProbabilityBar";
import { calcProbability, formatCurrency } from "@/lib/market-math";

interface MarketCardProps {
  market: {
    id: string;
    candidate: string;
    yes_pool: number;
    no_pool: number;
    resolved: boolean;
    outcome: boolean | null;
    category?: { title: string };
  };
  onQuickBet?: (marketId: string, side: "YES" | "NO") => void;
}

export default function MarketCard({ market, onQuickBet }: MarketCardProps) {
  const router = useRouter();
  const prob = calcProbability(market.yes_pool, market.no_pool);
  const totalPool = market.yes_pool + market.no_pool;

  return (
    <Card
      hover
      className="p-4 flex flex-col gap-3"
      onClick={() => router.push(`/market/${market.id}`)}
    >
      {market.category && (
        <span className="text-xs font-medium text-charcoal/50 uppercase tracking-wider">
          {market.category.title}
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-charcoal text-lg leading-tight">
          {market.candidate}
        </h3>
        {market.resolved && (
          <span
            className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
              market.outcome ? "bg-yes-light text-yes" : "bg-no-light text-no"
            }`}
          >
            {market.outcome ? "YES" : "NO"}
          </span>
        )}
      </div>

      <ProbabilityBar probability={prob} />

      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-charcoal/40">
          Pool: {formatCurrency(totalPool)}
        </span>
        {!market.resolved && onQuickBet && (
          <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onQuickBet(market.id, "YES")}
              className="px-3 py-1 rounded-md text-xs font-bold bg-yes/10 text-yes hover:bg-yes/20 transition-colors"
            >
              Yes {Math.round(prob)}¢
            </button>
            <button
              onClick={() => onQuickBet(market.id, "NO")}
              className="px-3 py-1 rounded-md text-xs font-bold bg-no/10 text-no hover:bg-no/20 transition-colors"
            >
              No {Math.round(100 - prob)}¢
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
