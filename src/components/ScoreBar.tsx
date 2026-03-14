"use client";

interface ScoreBarProps {
  value: number;
  max: number;
  label: string;
  color?: string;
}

export default function ScoreBar({
  value,
  max,
  label,
  color = "bg-blue-500",
}: ScoreBarProps) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-12 text-gray-400 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right text-gray-300">{value.toFixed(1)}</span>
    </div>
  );
}
