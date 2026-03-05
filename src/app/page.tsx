"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { formatCurrency, hasLiquidity } from "@/lib/market-math";

const COLORS = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

interface Category {
  id: string;
  title: string;
  sort_order: number;
}

interface MarketData {
  id: string;
  category_id: string;
  candidate: string;
  yes_pool: number;
  no_pool: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [marketsByCategory, setMarketsByCategory] = useState<Map<string, MarketData[]>>(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const [catsRes, marketsRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("markets").select("id, category_id, candidate, yes_pool, no_pool"),
      ]);

      if (catsRes.data) setCategories(catsRes.data);

      if (marketsRes.data) {
        const grouped = new Map<string, MarketData[]>();
        marketsRes.data.forEach((m) => {
          const existing = grouped.get(m.category_id) || [];
          existing.push(m);
          grouped.set(m.category_id, existing);
        });
        setMarketsByCategory(grouped);
      }

      setLoading(false);
    };

    fetchData();

    const channel = supabase
      .channel("home-markets")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "markets" },
        () => fetchData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered = categories.filter((c) => {
    if (!search) return true;
    return c.title.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="font-mono text-sm text-charcoal/40 animate-pulse">
          Loading markets...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold tracking-tight">
          SEP <span className="font-mono text-charcoal/40">MARKET</span>
        </h1>
        <p className="text-charcoal/50 text-sm mt-1">
          Winter Formal Superlative Predictions
        </p>
      </div>

      <Input
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md mx-auto"
      />

      {filtered.length === 0 ? (
        <div className="text-center py-12 text-charcoal/40 font-mono text-sm">
          No categories found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => {
            const markets = marketsByCategory.get(cat.id) || [];
            const totalPool = markets.reduce(
              (sum, m) => sum + (m.yes_pool || 0) + (m.no_pool || 0),
              0
            );
            const anyLiquidity = markets.some((m) =>
              hasLiquidity(m.yes_pool, m.no_pool)
            );

            return (
              <Card
                key={cat.id}
                hover
                className="p-5 flex flex-col gap-3"
                onClick={() => router.push(`/category/${cat.id}`)}
              >
                <h3 className="font-semibold text-charcoal text-lg leading-tight">
                  {cat.title}
                </h3>

                {/* Mini candidate bars */}
                <div className="space-y-1.5">
                  {markets.map((m, i) => {
                    const total = m.yes_pool + m.no_pool;
                    const prob = total > 0 ? (m.yes_pool / total) * 100 : 0;
                    const color = COLORS[i % COLORS.length];

                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <span
                          className="text-xs font-medium truncate w-24 shrink-0"
                          style={{ color }}
                        >
                          {m.candidate}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-charcoal/5 overflow-hidden">
                          {total > 0 && (
                            <div
                              className="h-2 rounded-full transition-all duration-500"
                              style={{
                                width: `${Math.max(prob, 4)}%`,
                                backgroundColor: color,
                                opacity: 0.7,
                              }}
                            />
                          )}
                        </div>
                        <span className="text-xs font-mono text-charcoal/40 w-8 text-right">
                          {total > 0 ? `${Math.round(prob)}%` : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between mt-auto pt-1">
                  <span className="text-xs font-mono text-charcoal/40">
                    {markets.length} candidates
                  </span>
                  <span className="text-xs font-mono text-charcoal/40">
                    {anyLiquidity
                      ? `Pool: ${formatCurrency(totalPool)}`
                      : "No bets yet"}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
