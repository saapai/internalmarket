"use client";

export default function DepositBanner() {
  const text =
    "Venmo @saathvikpai or Zelle 3853687238 to deposit balance";
  // Duplicate text for seamless loop
  return (
    <div className="bg-charcoal text-white overflow-hidden whitespace-nowrap">
      <div className="inline-flex animate-marquee">
        {[...Array(4)].map((_, i) => (
          <span key={i} className="mx-8 py-1.5 text-xs font-mono tracking-wide">
            {text}
            <span className="mx-4 text-yes">$</span>
          </span>
        ))}
      </div>
    </div>
  );
}
