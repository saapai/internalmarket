"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";

interface Category {
  id: string;
  title: string;
  sort_order: number;
}

interface MarketSummary {
  category_id: string;
  count: number;
  total_pool: number;
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [marketStats, setMarketStats] = useState<Map<string, MarketSummary>>(new Map());
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const [catsRes, marketsRes] = await Promise.all([
        supabase.from("categories").select("*").order("sort_order"),
        supabase.from("markets").select("id, category_id, yes_pool, no_pool"),
      ]);

      if (catsRes.data) setCategories(catsRes.data);

      if (marketsRes.data) {
        const stats = new Map<string, MarketSummary>();
        marketsRes.data.forEach((m) => {
          const existing = stats.get(m.category_id) || {
            category_id: m.category_id,
            count: 0,
            total_pool: 0,
          };
          existing.count++;
          existing.total_pool += (m.yes_pool || 0) + (m.no_pool || 0);
          stats.set(m.category_id, existing);
        });
        setMarketStats(stats);
      }

      setLoading(false);
    };

    fetchData();
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
      {/* Hero */}
      <div className="text-center py-4">
        <h1 className="text-3xl font-bold tracking-tight">
          SEP <span className="font-mono text-charcoal/40">MARKET</span>
        </h1>
        <p className="text-charcoal/50 text-sm mt-1">
          Winter Formal Superlative Predictions
        </p>
      </div>

      {/* Search */}
      <Input
        placeholder="Search categories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md mx-auto"
      />

      {/* Category grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-12 text-charcoal/40 font-mono text-sm">
          No categories found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cat) => {
            const stats = marketStats.get(cat.id);
            return (
              <Card
                key={cat.id}
                hover
                className="p-5 flex flex-col gap-2"
                onClick={() => router.push(`/category/${cat.id}`)}
              >
                <h3 className="font-semibold text-charcoal text-lg leading-tight">
                  {cat.title}
                </h3>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-mono text-charcoal/40">
                    {stats?.count || 0} candidates
                  </span>
                  <span className="text-xs font-mono text-charcoal/40">
                    Pool: ${(stats?.total_pool || 0).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-charcoal/30">Tap to vote</span>
                  <span className="text-charcoal/30">&rarr;</span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
