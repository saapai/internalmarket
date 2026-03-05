"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { formatCurrency, calcCategoryProbabilities, calcCategoryMultiplier } from "@/lib/market-math";
import { useToast } from "@/components/Toast";

interface Bet {
  id: string;
  side: string;
  amount: number;
  created_at: string;
  market: {
    id: string;
    candidate: string;
    yes_pool: number;
    no_pool: number;
    resolved: boolean;
    outcome: boolean | null;
    category_id: string;
    category: { title: string } | null;
  };
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
}

export default function PortfolioPage() {
  const [balance, setBalance] = useState(0);
  const [bets, setBets] = useState<Bet[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categoryMarkets, setCategoryMarkets] = useState<Map<string, { id: string; yes_pool: number; no_pool: number }[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [cashingOut, setCashingOut] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [profileRes, betsRes, txRes] = await Promise.all([
        supabase.from("profiles").select("balance").eq("id", user.id).single(),
        supabase
          .from("bets")
          .select("*, market:markets(*, category:categories(title))")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (profileRes.data) setBalance(profileRes.data.balance);
      const fetchedBets = (betsRes.data as unknown as Bet[]) || [];
      setBets(fetchedBets);
      if (txRes.data) setTransactions(txRes.data);

      // Fetch sibling markets for each category to compute normalized probabilities
      const categoryIds = Array.from(new Set(fetchedBets.map((b) => b.market.category_id).filter(Boolean)));
      if (categoryIds.length > 0) {
        const { data: allMarkets } = await supabase
          .from("markets")
          .select("id, yes_pool, no_pool, category_id")
          .in("category_id", categoryIds);
        if (allMarkets) {
          const grouped = new Map<string, { id: string; yes_pool: number; no_pool: number }[]>();
          allMarkets.forEach((m: { id: string; yes_pool: number; no_pool: number; category_id: string }) => {
            const list = grouped.get(m.category_id) || [];
            list.push(m);
            grouped.set(m.category_id, list);
          });
          setCategoryMarkets(grouped);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-sm text-charcoal/40 animate-pulse">
          Loading portfolio...
        </div>
      </div>
    );
  }

  const activeBets = bets.filter((b) => !b.market.resolved);
  const resolvedBets = bets.filter((b) => b.market.resolved);

  const handleCashout = async (betId: string) => {
    setCashingOut(betId);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("cashout_bet", {
        p_user_id: user.id,
        p_bet_id: betId,
      });

      if (error) throw error;
      const result = data as { error?: string; success?: boolean; refund?: number };
      if (result.error) {
        toast(result.error, "error");
      } else {
        toast(`Cashed out ${formatCurrency(result.refund || 0)}`, "success");
        // Refresh data
        const [profileRes, betsRes, txRes] = await Promise.all([
          supabase.from("profiles").select("balance").eq("id", user.id).single(),
          supabase
            .from("bets")
            .select("*, market:markets(*, category:categories(title))")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("transactions")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(50),
        ]);
        if (profileRes.data) setBalance(profileRes.data.balance);
        const refreshedBets = (betsRes.data as unknown as Bet[]) || [];
        setBets(refreshedBets);
        if (txRes.data) setTransactions(txRes.data);
        // Re-fetch category markets for updated pools
        const catIds = Array.from(new Set(refreshedBets.map((b) => b.market.category_id).filter(Boolean)));
        if (catIds.length > 0) {
          const { data: allMarkets } = await supabase
            .from("markets")
            .select("id, yes_pool, no_pool, category_id")
            .in("category_id", catIds);
          if (allMarkets) {
            const grouped = new Map<string, { id: string; yes_pool: number; no_pool: number }[]>();
            allMarkets.forEach((m: { id: string; yes_pool: number; no_pool: number; category_id: string }) => {
              const list = grouped.get(m.category_id) || [];
              list.push(m);
              grouped.set(m.category_id, list);
            });
            setCategoryMarkets(grouped);
          }
        }
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to cashout", "error");
    } finally {
      setCashingOut(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <button
          onClick={handleLogout}
          className="text-sm text-charcoal/40 hover:text-no transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Balance card */}
      <Card className="p-6">
        <div className="text-sm text-charcoal/50 mb-1">Available Balance</div>
        <div className="text-4xl font-mono font-bold text-yes">
          {formatCurrency(balance)}
        </div>
        <div className="mt-4 p-3 bg-cream rounded-lg border border-charcoal/5">
          <p className="text-xs text-charcoal/50 font-mono">
            <span className="text-charcoal/70 font-semibold">$ deposit</span>{" "}
            Venmo @saathvikpai or Zelle 3853687238
          </p>
          <p className="text-xs text-charcoal/40 mt-1">
            Include your phone number in the note. Admin will credit your balance.
          </p>
        </div>
      </Card>

      {/* Active positions */}
      <Card className="p-6">
        <h2 className="font-semibold text-sm text-charcoal/50 uppercase tracking-wider mb-4">
          Active Positions ({activeBets.length})
        </h2>
        {activeBets.length === 0 ? (
          <p className="text-sm text-charcoal/30 font-mono">No active bets</p>
        ) : (
          <div className="space-y-3">
            {activeBets.map((bet) => {
              const siblings = categoryMarkets.get(bet.market.category_id) || [bet.market];
              const probs = calcCategoryProbabilities(siblings);
              const prob = probs.get(bet.market.id) ?? (100 / siblings.length);
              const anyBets = siblings.some((m) => m.yes_pool + m.no_pool > 0);
              const multiplier = anyBets
                ? calcCategoryMultiplier(bet.side as "YES" | "NO", prob)
                : 0;

              return (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-3 border-b border-charcoal/5 last:border-0 -mx-2 px-2 rounded"
                >
                  <div
                    className="flex-1 cursor-pointer hover:bg-charcoal/[0.02] rounded"
                    onClick={() => router.push(`/market/${bet.market.id}`)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          bet.side === "YES"
                            ? "bg-yes/10 text-yes"
                            : "bg-no/10 text-no"
                        }`}
                      >
                        {bet.side}
                      </span>
                      <span className="font-medium text-sm">
                        {bet.market.candidate}
                      </span>
                    </div>
                    <span className="text-xs text-charcoal/40 mt-0.5 block">
                      {bet.market.category?.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-mono text-sm font-semibold">
                        {formatCurrency(bet.amount)}
                      </div>
                      <div className="text-xs text-charcoal/40 font-mono">
                        {multiplier > 0 ? `${multiplier.toFixed(2)}x` : "—"}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCashout(bet.id);
                      }}
                      disabled={cashingOut === bet.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-charcoal/5 text-charcoal/60 hover:bg-charcoal/10 hover:text-charcoal transition-colors disabled:opacity-50"
                    >
                      {cashingOut === bet.id ? "..." : "Cashout"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Resolved bets */}
      {resolvedBets.length > 0 && (
        <Card className="p-6">
          <h2 className="font-semibold text-sm text-charcoal/50 uppercase tracking-wider mb-4">
            Resolved Bets ({resolvedBets.length})
          </h2>
          <div className="space-y-2">
            {resolvedBets.map((bet) => {
              const won =
                (bet.side === "YES" && bet.market.outcome === true) ||
                (bet.side === "NO" && bet.market.outcome === false);
              return (
                <div
                  key={bet.id}
                  className="flex items-center justify-between py-2 border-b border-charcoal/5 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold ${
                        won ? "bg-yes/10 text-yes" : "bg-no/10 text-no"
                      }`}
                    >
                      {won ? "WON" : "LOST"}
                    </span>
                    <span className="text-sm">{bet.market.candidate}</span>
                  </div>
                  <span className="font-mono text-sm">
                    {formatCurrency(bet.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Transaction history */}
      <Card className="p-6">
        <h2 className="font-semibold text-sm text-charcoal/50 uppercase tracking-wider mb-4">
          Transaction History
        </h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-charcoal/30 font-mono">No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-charcoal/5 last:border-0"
              >
                <div>
                  <span
                    className={`text-xs font-mono font-bold ${
                      tx.amount >= 0 ? "text-yes" : "text-no"
                    }`}
                  >
                    {tx.type.toUpperCase()}
                  </span>
                  <p className="text-xs text-charcoal/40 mt-0.5">
                    {tx.description}
                  </p>
                </div>
                <span
                  className={`font-mono text-sm font-semibold ${
                    tx.amount >= 0 ? "text-yes" : "text-no"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {formatCurrency(Math.abs(tx.amount))}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
