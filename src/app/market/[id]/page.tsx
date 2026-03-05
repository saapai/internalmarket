"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import ProbabilityBar from "@/components/ProbabilityBar";
import BetSlip from "@/components/BetSlip";
import { calcProbability, formatCurrency, calcCategoryProbabilities, calcCategoryMultiplier } from "@/lib/market-math";

interface Market {
  id: string;
  candidate: string;
  yes_pool: number;
  no_pool: number;
  resolved: boolean;
  outcome: boolean | null;
  category_id: string;
  created_at: string;
  category: { title: string } | null;
}

interface Bet {
  id: string;
  side: string;
  amount: number;
  created_at: string;
  profile: { display_name: string } | null;
}

export default function MarketPage() {
  const { id } = useParams();
  const router = useRouter();
  const [market, setMarket] = useState<Market | null>(null);
  const [siblingMarkets, setSiblingMarkets] = useState<{ id: string; yes_pool: number; no_pool: number }[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [userBalance, setUserBalance] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchAll = async () => {
    const [marketRes, betsRes] = await Promise.all([
      supabase
        .from("markets")
        .select("*, category:categories(title)")
        .eq("id", id)
        .single(),
      supabase
        .from("bets")
        .select("*, profile:profiles(display_name)")
        .eq("market_id", id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (marketRes.data) {
      setMarket(marketRes.data as unknown as Market);
      // Fetch sibling markets in same category for normalized probabilities
      const { data: siblings } = await supabase
        .from("markets")
        .select("id, yes_pool, no_pool")
        .eq("category_id", marketRes.data.category_id);
      if (siblings) setSiblingMarkets(siblings);
    }
    if (betsRes.data) setBets(betsRes.data as unknown as Bet[]);

    const { data: { user } } = await supabase.auth.getUser();
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
      .channel(`market-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "markets", filter: `id=eq.${id}` },
        () => fetchAll()
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bets", filter: `market_id=eq.${id}` },
        () => fetchAll()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-sm text-charcoal/40 animate-pulse">
          Loading market...
        </div>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="text-center py-20 text-charcoal/40 font-mono">
        Market not found
      </div>
    );
  }

  const categoryProbs = calcCategoryProbabilities(siblingMarkets.length > 0 ? siblingMarkets : [market]);
  const prob = categoryProbs.get(market.id) ?? calcProbability(market.yes_pool, market.no_pool);
  const totalPool = market.yes_pool + market.no_pool;
  const anyBets = siblingMarkets.some((m) => m.yes_pool + m.no_pool > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="text-sm text-charcoal/40 hover:text-charcoal/60 font-mono"
      >
        &larr; back
      </button>

      {/* Market header */}
      <div>
        {market.category && (
          <span className="text-xs font-medium text-charcoal/50 uppercase tracking-wider">
            {market.category.title}
          </span>
        )}
        <h1 className="text-2xl font-bold mt-1">{market.candidate}</h1>
        {market.resolved && (
          <span
            className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-bold ${
              market.outcome ? "bg-yes-light text-yes" : "bg-no-light text-no"
            }`}
          >
            Resolved: {market.outcome ? "YES" : "NO"}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: market info */}
        <div className="md:col-span-2 space-y-4">
          <Card className="p-6">
            <ProbabilityBar probability={anyBets ? prob : -1} size="lg" />
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-xs text-charcoal/40 mb-1">Total Pool</div>
                <div className="font-mono font-bold text-lg">
                  {formatCurrency(totalPool)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-charcoal/40 mb-1">YES Price</div>
                <div className="font-mono font-bold text-lg text-yes">
                  {anyBets
                    ? `${Math.round(prob)}¢ (${calcCategoryMultiplier("YES", prob).toFixed(2)}x)`
                    : "—"}
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-charcoal/40 mb-1">NO Price</div>
                <div className="font-mono font-bold text-lg text-no">
                  {anyBets
                    ? `${Math.round(100 - prob)}¢ (${calcCategoryMultiplier("NO", prob).toFixed(2)}x)`
                    : "—"}
                </div>
              </div>
            </div>
          </Card>

          {/* Recent bets */}
          <Card className="p-6">
            <h2 className="font-semibold text-sm text-charcoal/50 uppercase tracking-wider mb-4">
              Recent Bets
            </h2>
            {bets.length === 0 ? (
              <p className="text-sm text-charcoal/30 font-mono">No bets yet</p>
            ) : (
              <div className="space-y-2">
                {bets.map((bet) => (
                  <div
                    key={bet.id}
                    className="flex items-center justify-between py-2 border-b border-charcoal/5 last:border-0"
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
                      <span className="text-sm">
                        {bet.profile?.display_name || "Anonymous"}
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold">
                      {formatCurrency(bet.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right: bet slip */}
        <div>
          <Card className="p-6 sticky top-20">
            <h2 className="font-semibold text-sm text-charcoal/50 uppercase tracking-wider mb-4">
              Place Bet
            </h2>
            {isLoggedIn ? (
              <BetSlip
                market={market}
                userBalance={userBalance}
                onBetPlaced={fetchAll}
                normalizedProb={anyBets ? prob : undefined}
              />
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-charcoal/50 mb-3">
                  Log in to place bets
                </p>
                <button
                  onClick={() => router.push("/login")}
                  className="px-4 py-2 rounded-lg bg-charcoal text-white text-sm font-medium hover:bg-charcoal/90"
                >
                  Login
                </button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
