"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import ProbabilityBar from "@/components/ProbabilityBar";
import CategoryChart from "@/components/CategoryChart";
import { calcProbability, calcPayout, formatCurrency, hasLiquidity } from "@/lib/market-math";
import { useToast } from "@/components/Toast";

interface Market {
  id: string;
  candidate: string;
  yes_pool: number;
  no_pool: number;
  resolved: boolean;
  outcome: boolean | null;
}

interface Category {
  id: string;
  title: string;
}

export default function CategoryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [category, setCategory] = useState<Category | null>(null);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [betModal, setBetModal] = useState<{ market: Market; side: "YES" | "NO" } | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [placing, setPlacing] = useState(false);
  const supabase = createClient();
  const { toast } = useToast();

  const fetchAll = async () => {
    const [catRes, marketsRes] = await Promise.all([
      supabase.from("categories").select("*").eq("id", id).single(),
      supabase
        .from("markets")
        .select("*")
        .eq("category_id", id)
        .order("created_at"),
    ]);

    if (catRes.data) setCategory(catRes.data);
    if (marketsRes.data) setMarkets(marketsRes.data);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      const { data: profile } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();
      if (profile) setUserBalance(profile.balance);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const channel = supabase
      .channel(`category-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets" },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  const openBet = (market: Market, side: "YES" | "NO") => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    setBetModal({ market, side });
    setBetAmount("");
  };

  const placeBet = async () => {
    if (!betModal) return;
    const amount = parseFloat(betAmount);
    if (!amount || amount <= 0) {
      toast("Enter a valid amount", "error");
      return;
    }
    if (amount > userBalance) {
      toast("Insufficient balance", "error");
      return;
    }

    setPlacing(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("place_bet", {
        p_user_id: user.id,
        p_market_id: betModal.market.id,
        p_side: betModal.side,
        p_amount: amount,
      });

      if (error) throw error;
      const result = data as { error?: string; success?: boolean };
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast(
          `Bet ${formatCurrency(amount)} on ${betModal.side} — ${betModal.market.candidate}`,
          "success"
        );
        setBetModal(null);
        fetchAll();
      }
    } catch {
      toast("Failed to place bet", "error");
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-sm text-charcoal/40 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="text-center py-20 text-charcoal/40 font-mono">
        Category not found
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push("/")}
        className="text-sm text-charcoal/40 hover:text-charcoal/60 font-mono"
      >
        &larr; all categories
      </button>

      <div>
        <h1 className="text-2xl font-bold">{category.title}</h1>
        <p className="text-charcoal/50 text-sm mt-1">
          Pick YES or NO for each candidate
        </p>
      </div>

      {isLoggedIn && (
        <div className="text-sm font-mono text-charcoal/50">
          Balance: <span className="font-semibold text-yes">{formatCurrency(userBalance)}</span>
        </div>
      )}

      {/* Combined probability chart */}
      <CategoryChart markets={markets} />

      {/* Candidate markets */}
      <div className="space-y-4">
        {markets.map((market) => {
          const prob = calcProbability(market.yes_pool, market.no_pool);
          const totalPool = market.yes_pool + market.no_pool;

          return (
            <Card key={market.id} className="p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{market.candidate}</h3>
                  <span className="text-xs font-mono text-charcoal/40">
                    Pool: {formatCurrency(totalPool)}
                  </span>
                </div>
                {market.resolved && (
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-bold ${
                      market.outcome
                        ? "bg-yes-light text-yes"
                        : "bg-no-light text-no"
                    }`}
                  >
                    {market.outcome ? "YES" : "NO"}
                  </span>
                )}
              </div>

              <ProbabilityBar probability={prob} />

              {!market.resolved && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openBet(market, "YES")}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-yes/10 text-yes hover:bg-yes/20 transition-colors"
                  >
                    {prob >= 0 ? `Yes ${Math.round(prob)}¢` : "Yes"}
                  </button>
                  <button
                    onClick={() => openBet(market, "NO")}
                    className="flex-1 py-2.5 rounded-lg text-sm font-bold bg-no/10 text-no hover:bg-no/20 transition-colors"
                  >
                    {prob >= 0 ? `No ${Math.round(100 - prob)}¢` : "No"}
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {/* Bet modal */}
      {betModal && (
        <div
          className="fixed inset-0 z-[80] bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setBetModal(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="font-bold text-lg">
                {betModal.side === "YES" ? "Buy YES" : "Buy NO"}
              </h3>
              <p className="text-sm text-charcoal/50">{betModal.market.candidate}</p>
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
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && placeBet()}
                autoFocus
              />
              <div className="flex gap-2 mt-2">
                {[1, 5, 10, 25].map((v) => (
                  <button
                    key={v}
                    onClick={() => setBetAmount(v.toString())}
                    className="px-2 py-1 text-xs font-mono rounded border border-charcoal/10 hover:bg-charcoal/5 transition-colors"
                  >
                    ${v}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-charcoal/50">Balance</span>
              <span className="font-mono font-semibold">
                {formatCurrency(userBalance)}
              </span>
            </div>

            {parseFloat(betAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-charcoal/50">Potential payout</span>
                <span className="font-mono font-semibold text-yes">
                  {formatCurrency(
                    calcPayout(
                      betModal.side,
                      parseFloat(betAmount),
                      betModal.market.yes_pool,
                      betModal.market.no_pool
                    )
                  )}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setBetModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant={betModal.side === "YES" ? "yes" : "no"}
                className="flex-1"
                onClick={placeBet}
                disabled={placing || !parseFloat(betAmount)}
              >
                {placing ? "Placing..." : `Bet ${betModal.side}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
