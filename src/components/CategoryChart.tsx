"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const COLORS = [
  "#22c55e", // green
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
];

interface HistoryRow {
  market_id: string;
  yes_pool: number;
  no_pool: number;
  created_at: string;
}

interface Market {
  id: string;
  candidate: string;
  yes_pool: number;
  no_pool: number;
}

interface CategoryChartProps {
  markets: Market[];
  /** key to trigger refetch (e.g. increment after a bet) */
  refreshKey?: number;
}

interface DataPoint {
  time: number; // ms timestamp
  probabilities: Map<string, number>; // market_id -> probability
}

export default function CategoryChart({ markets, refreshKey }: CategoryChartProps) {
  const [timeline, setTimeline] = useState<DataPoint[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchHistory = async () => {
      // Fetch all history for these markets
      const marketIds = markets.map((m) => m.id);
      const { data } = await supabase
        .from("market_history")
        .select("market_id, yes_pool, no_pool, created_at")
        .in("market_id", marketIds)
        .order("created_at", { ascending: true });

      // Build a timeline: collect all unique timestamps, then for each timestamp
      // carry forward the latest probability for each market
      const allEvents: HistoryRow[] = data || [];

      // Track running state for each market
      const currentState = new Map<string, number>();
      markets.forEach((m) => currentState.set(m.id, 50)); // start at 50%

      const points: DataPoint[] = [];

      // Add initial point (all at 50%)
      const startTime = allEvents.length > 0
        ? new Date(allEvents[0].created_at).getTime() - 1000
        : Date.now() - 60000;
      points.push({
        time: startTime,
        probabilities: new Map(currentState),
      });

      // Process each event
      allEvents.forEach((ev) => {
        const total = ev.yes_pool + ev.no_pool;
        const prob = total > 0 ? (ev.yes_pool / total) * 100 : 50;
        currentState.set(ev.market_id, prob);

        points.push({
          time: new Date(ev.created_at).getTime(),
          probabilities: new Map(currentState),
        });
      });

      // Add current state as final point
      markets.forEach((m) => {
        const total = m.yes_pool + m.no_pool;
        const prob = total > 0 ? (m.yes_pool / total) * 100 : 50;
        currentState.set(m.id, prob);
      });
      points.push({
        time: Date.now(),
        probabilities: new Map(currentState),
      });

      setTimeline(points);
    };

    fetchHistory();

    // Subscribe to realtime history inserts
    const channel = supabase
      .channel("category-chart")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "market_history" },
        () => fetchHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [markets.map((m) => `${m.id}-${m.yes_pool}-${m.no_pool}`).join(","), refreshKey]);

  if (timeline.length < 2) {
    return (
      <div className="w-full bg-white rounded-xl border border-black/5 shadow-sm p-4">
        <div className="text-xs text-charcoal/30 font-mono text-center py-6">
          Chart will appear after first bet
        </div>
      </div>
    );
  }

  // SVG dimensions
  const W = 500;
  const H = 180;
  const padL = 32;
  const padR = 8;
  const padT = 12;
  const padB = 24;
  const chartW = W - padL - padR;
  const chartH = H - padT - padB;

  const minTime = timeline[0].time;
  const maxTime = timeline[timeline.length - 1].time;
  const timeRange = maxTime - minTime || 1;

  const toX = (t: number) => padL + ((t - minTime) / timeRange) * chartW;
  const toY = (prob: number) => padT + ((100 - prob) / 100) * chartH;

  // Build path for each market
  const buildPath = (marketId: string): string => {
    return timeline
      .map((pt, i) => {
        const prob = pt.probabilities.get(marketId) ?? 50;
        const x = toX(pt.time);
        const y = toY(prob);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  };

  // Y-axis labels
  const yLabels = [0, 25, 50, 75, 100];

  return (
    <div className="w-full bg-white rounded-xl border border-black/5 shadow-sm p-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-3">
        {markets.map((m, i) => {
          const total = m.yes_pool + m.no_pool;
          const prob = total > 0 ? (m.yes_pool / total) * 100 : 50;
          return (
            <div key={m.id} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-xs font-medium text-charcoal/70">
                {m.candidate}
              </span>
              <span
                className="text-xs font-mono font-bold"
                style={{ color: COLORS[i % COLORS.length] }}
              >
                {Math.round(prob)}%
              </span>
            </div>
          );
        })}
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 160 }}>
        {/* Grid lines */}
        {yLabels.map((val) => (
          <g key={val}>
            <line
              x1={padL}
              y1={toY(val)}
              x2={W - padR}
              y2={toY(val)}
              stroke="#1d1d1f"
              strokeOpacity={val === 50 ? 0.12 : 0.05}
              strokeDasharray={val === 50 ? "4 4" : undefined}
            />
            <text
              x={padL - 4}
              y={toY(val) + 3}
              textAnchor="end"
              className="text-[9px] font-mono"
              fill="#1d1d1f"
              fillOpacity={0.3}
            >
              {val}%
            </text>
          </g>
        ))}

        {/* Lines for each market */}
        {markets.map((m, i) => {
          const color = COLORS[i % COLORS.length];
          const path = buildPath(m.id);
          const lastPoint = timeline[timeline.length - 1];
          const lastProb = lastPoint.probabilities.get(m.id) ?? 50;

          return (
            <g key={m.id}>
              {/* Area fill */}
              <path
                d={`${path} L ${toX(lastPoint.time).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(timeline[0].time).toFixed(1)} ${toY(0).toFixed(1)} Z`}
                fill={color}
                fillOpacity={0.05}
              />
              {/* Line */}
              <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* End dot */}
              <circle
                cx={toX(lastPoint.time)}
                cy={toY(lastProb)}
                r={3.5}
                fill={color}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
