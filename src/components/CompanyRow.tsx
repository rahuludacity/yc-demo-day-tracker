"use client";

import { Company } from "@/lib/types";
import { saveTracking } from "@/lib/storage";
import TierBadge from "./TierBadge";
import ScoreBar from "./ScoreBar";
import { useState } from "react";

interface Props {
  company: Company;
  index: number;
  onUpdate: (id: string, updates: Partial<Company>) => void;
  onOutreach: (company: Company) => void;
}

const OUTREACH_COLORS: Record<string, string> = {
  not_started: "bg-gray-700 text-gray-300",
  drafted: "bg-yellow-900/60 text-yellow-300",
  sent: "bg-blue-900/60 text-blue-300",
  replied: "bg-green-900/60 text-green-300",
};

export default function CompanyRow({
  company,
  index,
  onUpdate,
  onOutreach,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const s = company.scores;

  const handleFieldChange = (field: keyof Company, value: string | boolean | null) => {
    const updates = { [field]: value } as Partial<Company>;
    saveTracking(company.id, updates);
    onUpdate(company.id, updates);
  };

  return (
    <div className="border-b border-gray-800 hover:bg-gray-900/50 transition-colors">
      {/* Main row */}
      <div className="grid grid-cols-[40px_40px_1fr_80px_120px_100px_80px_100px_60px] items-center gap-2 px-3 py-2.5 text-sm">
        {/* Rank */}
        <span className="text-gray-500 text-xs">{index}</span>

        {/* Logo */}
        <div className="w-7 h-7 rounded overflow-hidden bg-gray-800 shrink-0">
          {company.logo ? (
            <img
              src={company.logo}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">
              {company.name[0]}
            </div>
          )}
        </div>

        {/* Name + one liner */}
        <div
          className="min-w-0 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-white truncate">
              {company.name}
            </span>
            <TierBadge tier={company.tier} />
          </div>
          <p className="text-gray-400 text-xs truncate">{company.one_liner}</p>
        </div>

        {/* Score */}
        <div className="text-right font-mono font-bold text-white">
          {s.total.toFixed(1)}
        </div>

        {/* Outreach status */}
        <select
          value={company.outreach_status}
          onChange={(e) =>
            handleFieldChange(
              "outreach_status",
              e.target.value as Company["outreach_status"]
            )
          }
          className={`text-xs rounded px-2 py-1 border-0 cursor-pointer ${
            OUTREACH_COLORS[company.outreach_status]
          }`}
        >
          <option value="not_started">Not Started</option>
          <option value="drafted">Drafted</option>
          <option value="sent">Sent</option>
          <option value="replied">Replied</option>
        </select>

        {/* Founder names (editable) */}
        <input
          type="text"
          value={company.founder_names}
          onChange={(e) => handleFieldChange("founder_names", e.target.value)}
          placeholder="Founders"
          className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 w-full"
        />

        {/* Valuation */}
        <input
          type="text"
          value={company.valuation || ""}
          onChange={(e) => handleFieldChange("valuation", e.target.value || null)}
          placeholder="Val"
          className="bg-transparent border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 w-full"
        />

        {/* Actions */}
        <button
          onClick={() => onOutreach(company)}
          className="text-xs text-blue-400 hover:text-blue-300"
          title="Generate outreach"
        >
          Reach
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-12 pb-4 grid grid-cols-2 gap-6">
          {/* Left: Scores */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">
              Scores
            </h4>
            <ScoreBar
              value={s.market_timing}
              max={10}
              label="Timing"
              color="bg-purple-500"
            />
            <ScoreBar
              value={s.buyer_urgency}
              max={10}
              label="Urgency"
              color="bg-red-500"
            />
            <ScoreBar
              value={s.moat_potential}
              max={10}
              label="Moat"
              color="bg-green-500"
            />
            <ScoreBar
              value={s.tam_signal}
              max={10}
              label="TAM"
              color="bg-blue-500"
            />
            <ScoreBar
              value={s.founder_market_fit}
              max={5}
              label="FMF"
              color="bg-yellow-500"
            />
            <ScoreBar
              value={s.execution_signal}
              max={5}
              label="Exec"
              color="bg-cyan-500"
            />
            {s.penalty_score > 0 && (
              <ScoreBar
                value={s.penalty_score}
                max={8}
                label="Penalty"
                color="bg-red-700"
              />
            )}

            <div className="mt-3 text-xs">
              {s._markets.length > 0 && (
                <p className="text-gray-400">
                  <span className="text-gray-500">Markets:</span>{" "}
                  {s._markets.join(", ")}
                </p>
              )}
              {s._moats.length > 0 && (
                <p className="text-gray-400">
                  <span className="text-gray-500">Moats:</span>{" "}
                  {s._moats.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* Right: Analysis + Tracking */}
          <div className="space-y-3">
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">
                Why Interesting
              </h4>
              <p className="text-xs text-green-400">{company.why_interesting}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">
                Concern
              </h4>
              <p className="text-xs text-red-400">{company.main_concern}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">
                Questions for Founder
              </h4>
              <ul className="text-xs text-gray-300 space-y-1">
                {company.questions.map((q, i) => (
                  <li key={i}>• {q}</li>
                ))}
              </ul>
            </div>

            {/* Tracking checkboxes */}
            <div className="flex gap-4 pt-2 border-t border-gray-800">
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={company.reached_out}
                  onChange={(e) =>
                    handleFieldChange("reached_out", e.target.checked)
                  }
                  className="rounded"
                />
                Reached Out
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={company.responded}
                  onChange={(e) =>
                    handleFieldChange("responded", e.target.checked)
                  }
                  className="rounded"
                />
                Responded
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={company.meeting_scheduled}
                  onChange={(e) =>
                    handleFieldChange("meeting_scheduled", e.target.checked)
                  }
                  className="rounded"
                />
                Meeting
              </label>
              <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={company.invested}
                  onChange={(e) =>
                    handleFieldChange("invested", e.target.checked)
                  }
                  className="rounded"
                />
                Invested
              </label>
            </div>

            {/* LinkedIn + Notes */}
            <div className="space-y-2">
              <input
                type="text"
                value={company.founder_linkedin}
                onChange={(e) =>
                  handleFieldChange("founder_linkedin", e.target.value)
                }
                placeholder="Founder LinkedIn URL"
                className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600"
              />
              <textarea
                value={company.notes}
                onChange={(e) => handleFieldChange("notes", e.target.value)}
                placeholder="Notes..."
                rows={2}
                className="w-full bg-transparent border border-gray-700 rounded px-2 py-1 text-xs text-gray-200 placeholder-gray-600 resize-none"
              />
            </div>

            {/* Links */}
            <div className="flex gap-3 text-xs">
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline"
              >
                Website
              </a>
              <a
                href={company.yc_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-orange-400 hover:underline"
              >
                YC Profile
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
