"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface HistoryPoint {
  yes_pool: number;
  no_pool: number;
  created_at: string;
}

interface ProbabilityChartProps {
  marketId: string;
  currentYesPool: number;
  currentNoPool: number;
}

export default function ProbabilityChart({
  marketId,
  currentYesPool,
  currentNoPool,
}: ProbabilityChartProps) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from("market_history")
        .select("yes_pool, no_pool, created_at")
        .eq("market_id", marketId)
        .order("created_at", { ascending: true });

      if (data) setHistory(data);
    };

    fetchHistory();
  }, [marketId, currentYesPool, currentNoPool]);

  // Build data points: start at 50%, then history, then current
  const points: { prob: number; label: string }[] = [
    { prob: 50, label: "Start" },
  ];

  history.forEach((h) => {
    const total = h.yes_pool + h.no_pool;
    const prob = total > 0 ? (h.yes_pool / total) * 100 : 50;
    const time = new Date(h.created_at).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    points.push({ prob, label: time });
  });

  // Add current state if different from last history point
  const currentTotal = currentYesPool + currentNoPool;
  const currentProb = currentTotal > 0 ? (currentYesPool / currentTotal) * 100 : 50;
  if (
    points.length === 1 ||
    Math.abs(points[points.length - 1].prob - currentProb) > 0.01
  ) {
    points.push({ prob: currentProb, label: "Now" });
  }

  if (points.length < 2) return null;

  // SVG dimensions
  const W = 400;
  const H = 100;
  const padX = 0;
  const padY = 8;
  const chartW = W - padX * 2;
  const chartH = H - padY * 2;

  const toX = (i: number) => padX + (i / (points.length - 1)) * chartW;
  const toY = (prob: number) => padY + ((100 - prob) / 100) * chartH;

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(i)} ${toY(p.prob)}`)
    .join(" ");

  // Area fill path
  const areaPath = `${linePath} L ${toX(points.length - 1)} ${H} L ${toX(0)} ${H} Z`;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-charcoal/40 font-mono">Probability</span>
        <span className="text-xs font-mono font-semibold text-yes">
          {Math.round(currentProb)}%
        </span>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-20"
        preserveAspectRatio="none"
      >
        {/* 50% baseline */}
        <line
          x1={padX}
          y1={toY(50)}
          x2={W - padX}
          y2={toY(50)}
          stroke="#1d1d1f"
          strokeOpacity={0.08}
          strokeDasharray="4 4"
        />

        {/* Area fill */}
        <path d={areaPath} fill="#22c55e" fillOpacity={0.1} />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#22c55e"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Current dot */}
        <circle
          cx={toX(points.length - 1)}
          cy={toY(points[points.length - 1].prob)}
          r={3}
          fill="#22c55e"
        />
      </svg>
    </div>
  );
}
