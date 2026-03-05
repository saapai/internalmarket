"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import { formatCurrency } from "@/lib/market-math";

interface LeaderboardEntry {
  id: string;
  display_name: string;
  balance: number;
  total_bets: number;
  total_wagered: number;
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      // Get all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, balance")
        .order("balance", { ascending: false });

      if (!profiles) {
        setLoading(false);
        return;
      }

      // Get bet stats for each user
      const { data: bets } = await supabase
        .from("bets")
        .select("user_id, amount");

      const betStats = new Map<string, { count: number; total: number }>();
      if (bets) {
        bets.forEach((b) => {
          const existing = betStats.get(b.user_id) || { count: 0, total: 0 };
          existing.count++;
          existing.total += b.amount;
          betStats.set(b.user_id, existing);
        });
      }

      const leaderboard = profiles
        .filter((p) => p.display_name)
        .map((p) => ({
          id: p.id,
          display_name: p.display_name,
          balance: p.balance,
          total_bets: betStats.get(p.id)?.count || 0,
          total_wagered: betStats.get(p.id)?.total || 0,
        }))
        .sort((a, b) => (b.balance + b.total_wagered) - (a.balance + a.total_wagered));

      setEntries(leaderboard);
      setLoading(false);
    };

    fetchLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-sm text-charcoal/40 animate-pulse">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Leaderboard</h1>

      <Card className="p-6">
        {entries.length === 0 ? (
          <p className="text-center text-charcoal/30 font-mono text-sm">
            No users yet
          </p>
        ) : (
          <div className="space-y-1">
            {entries.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between py-3 px-3 rounded-lg ${
                  i < 3 ? "bg-cream" : ""
                }`}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold font-mono ${
                      i === 0
                        ? "bg-yellow-400/20 text-yellow-600"
                        : i === 1
                        ? "bg-gray-300/30 text-gray-500"
                        : i === 2
                        ? "bg-amber-600/10 text-amber-700"
                        : "bg-charcoal/5 text-charcoal/30"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-sm">
                      {entry.display_name}
                    </div>
                    <div className="text-xs text-charcoal/40 font-mono">
                      {entry.total_bets} bets · {formatCurrency(entry.total_wagered)} wagered
                    </div>
                  </div>
                </div>
                <div className="font-mono text-right">
                  <div
                    className={`font-bold ${
                      entry.balance + entry.total_wagered > 0 ? "text-yes" : "text-charcoal/50"
                    }`}
                  >
                    {formatCurrency(entry.balance + entry.total_wagered)}
                  </div>
                  <div className="text-[10px] text-charcoal/40">
                    {formatCurrency(entry.balance)} + {formatCurrency(entry.total_wagered)} in bets
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
