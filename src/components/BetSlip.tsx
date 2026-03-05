"use client";

import { useState } from "react";
import Button from "./ui/Button";
import Input from "./ui/Input";
import { calcPayout, calcCategoryPayout, formatCurrency } from "@/lib/market-math";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "./Toast";

interface BetSlipProps {
  market: {
    id: string;
    candidate: string;
    yes_pool: number;
    no_pool: number;
    resolved: boolean;
  };
  userBalance: number;
  onBetPlaced: () => void;
  /** Category-normalized probability (0-100). When provided, uses category payout math. */
  normalizedProb?: number;
}

export default function BetSlip({ market, userBalance, onBetPlaced, normalizedProb }: BetSlipProps) {
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const amountNum = parseFloat(amount) || 0;
  const potentialPayout = normalizedProb !== undefined
    ? calcCategoryPayout(side, amountNum, normalizedProb)
    : calcPayout(side, amountNum, market.yes_pool, market.no_pool);

  const placeBet = async () => {
    if (amountNum <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    if (amountNum > userBalance) {
      toast("Insufficient balance", "error");
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast("Please log in first", "error");
        return;
      }

      const { data, error } = await supabase.rpc("place_bet", {
        p_user_id: user.id,
        p_market_id: market.id,
        p_side: side,
        p_amount: amountNum,
      });

      if (error) throw error;

      const result = data as { error?: string; success?: boolean };
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast(
          `Bet ${formatCurrency(amountNum)} on ${side} — ${market.candidate}`,
          "success"
        );
        setAmount("");
        onBetPlaced();
      }
    } catch {
      toast("Failed to place bet", "error");
    } finally {
      setLoading(false);
    }
  };

  if (market.resolved) {
    return (
      <div className="p-4 bg-charcoal/5 rounded-lg text-center text-sm text-charcoal/50 font-mono">
        Market resolved
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant={side === "YES" ? "yes" : "outline"}
          onClick={() => setSide("YES")}
          className="w-full"
        >
          YES
        </Button>
        <Button
          variant={side === "NO" ? "no" : "outline"}
          onClick={() => setSide("NO")}
          className="w-full"
        >
          NO
        </Button>
      </div>

      <div>
        <label className="block text-xs font-medium text-charcoal/50 mb-1">
          Amount
        </label>
        <Input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <div className="flex gap-2 mt-2">
          {[1, 5, 10, 25].map((v) => (
            <button
              key={v}
              onClick={() => setAmount(v.toString())}
              className="px-2 py-1 text-xs font-mono rounded border border-charcoal/10 hover:bg-charcoal/5 transition-colors"
            >
              ${v}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between text-sm">
        <span className="text-charcoal/50">Balance</span>
        <span className="font-mono font-semibold">{formatCurrency(userBalance)}</span>
      </div>

      {amountNum > 0 && (
        <div className="flex justify-between text-sm">
          <span className="text-charcoal/50">Potential payout</span>
          <span className="font-mono font-semibold text-yes">
            {formatCurrency(potentialPayout)}
          </span>
        </div>
      )}

      <Button
        variant={side === "YES" ? "yes" : "no"}
        size="lg"
        className="w-full"
        onClick={placeBet}
        disabled={loading || amountNum <= 0}
      >
        {loading ? "Placing..." : `Bet ${side}`}
      </Button>
    </div>
  );
}
