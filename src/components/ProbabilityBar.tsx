"use client";

interface ProbabilityBarProps {
  probability: number; // 0-100, or -1 for "no bets"
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  /** Default probability to show when no bets (e.g. 33 for 3 candidates) */
  defaultProb?: number;
}

export default function ProbabilityBar({
  probability,
  size = "md",
  showLabels = true,
  defaultProb = 50,
}: ProbabilityBarProps) {
  const heights = { sm: "h-2", md: "h-3", lg: "h-4" };
  const noBets = probability < 0;
  const displayProb = noBets ? defaultProb : probability;
  const clamped = Math.max(0, Math.min(100, displayProb));

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between mb-1">
          {noBets ? (
            <span className="text-xs font-mono text-charcoal/30">
              Default: {Math.round(defaultProb)}% / {Math.round(100 - defaultProb)}%
            </span>
          ) : (
            <>
              <span className="text-xs font-mono font-semibold text-yes">
                YES {Math.round(clamped)}¢
              </span>
              <span className="text-xs font-mono font-semibold text-no">
                NO {Math.round(100 - clamped)}¢
              </span>
            </>
          )}
        </div>
      )}
      <div
        className={`w-full ${heights[size]} rounded-full ${noBets ? "bg-charcoal/10" : "bg-no/20"} overflow-hidden`}
      >
        <div
          className={`${heights[size]} rounded-full ${noBets ? "bg-charcoal/20" : "bg-yes"} transition-all duration-500 ease-out`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
