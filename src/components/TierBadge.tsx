"use client";

const TIER_STYLES: Record<string, string> = {
  "TIER 1 — MUST MEET": "bg-green-900/50 text-green-300 border-green-700",
  "TIER 2 — HIGH PRIORITY": "bg-blue-900/50 text-blue-300 border-blue-700",
  "TIER 3 — WORTH A LOOK": "bg-yellow-900/50 text-yellow-300 border-yellow-700",
  "TIER 4 — PASS": "bg-gray-800/50 text-gray-400 border-gray-600",
};

const TIER_SHORT: Record<string, string> = {
  "TIER 1 — MUST MEET": "T1",
  "TIER 2 — HIGH PRIORITY": "T2",
  "TIER 3 — WORTH A LOOK": "T3",
  "TIER 4 — PASS": "T4",
};

export default function TierBadge({ tier }: { tier: string }) {
  const style = TIER_STYLES[tier] || TIER_STYLES["TIER 4 — PASS"];
  const short = TIER_SHORT[tier] || "T4";
  return (
    <span
      className={`inline-block px-2 py-0.5 text-xs font-bold rounded border ${style}`}
      title={tier}
    >
      {short}
    </span>
  );
}
