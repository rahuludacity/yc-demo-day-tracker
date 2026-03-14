"use client";

import { useState, useEffect, useMemo } from "react";
import { Company, SortField, TierFilter, OutreachFilter } from "@/lib/types";
import { mergeWithTracking, exportTrackingData } from "@/lib/storage";
import CompanyRow from "./CompanyRow";
import OutreachModal from "./OutreachModal";
import companiesData from "../../data/companies.json";

export default function Dashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [sortField, setSortField] = useState<SortField>("total");
  const [sortAsc, setSortAsc] = useState(false);
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [outreachFilter, setOutreachFilter] = useState<OutreachFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [outreachTarget, setOutreachTarget] = useState<Company | null>(null);

  useEffect(() => {
    const merged = mergeWithTracking(companiesData as unknown as Company[]);
    setCompanies(merged);
  }, []);

  const handleUpdate = (id: string, updates: Partial<Company>) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
    );
  };

  const filtered = useMemo(() => {
    let result = [...companies];

    // Tier filter
    if (tierFilter !== "all") {
      const tierMap: Record<string, string> = {
        tier1: "TIER 1 — MUST MEET",
        tier2: "TIER 2 — HIGH PRIORITY",
        tier3: "TIER 3 — WORTH A LOOK",
        tier4: "TIER 4 — PASS",
      };
      result = result.filter((c) => c.tier === tierMap[tierFilter]);
    }

    // Outreach filter
    if (outreachFilter !== "all") {
      result = result.filter((c) => c.outreach_status === outreachFilter);
    }

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.one_liner.toLowerCase().includes(q) ||
          c.industries.some((i) => i.toLowerCase().includes(q)) ||
          c.founder_names.toLowerCase().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let av: number | string, bv: number | string;
      switch (sortField) {
        case "name":
          av = a.name.toLowerCase();
          bv = b.name.toLowerCase();
          break;
        case "team_size":
          av = a.team_size;
          bv = b.team_size;
          break;
        case "outreach_status":
          const order = { replied: 0, sent: 1, drafted: 2, not_started: 3 };
          av = order[a.outreach_status] ?? 4;
          bv = order[b.outreach_status] ?? 4;
          break;
        default:
          av = a.scores[sortField] ?? 0;
          bv = b.scores[sortField] ?? 0;
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, sortField, sortAsc, tierFilter, outreachFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const reached = companies.filter((c) => c.reached_out).length;
    const responded = companies.filter((c) => c.responded).length;
    const meetings = companies.filter((c) => c.meeting_scheduled).length;
    const invested = companies.filter((c) => c.invested).length;
    const tier1 = companies.filter((c) =>
      c.tier.includes("TIER 1")
    ).length;
    const tier2 = companies.filter((c) =>
      c.tier.includes("TIER 2")
    ).length;
    return { reached, responded, meetings, invested, tier1, tier2, total: companies.length };
  }, [companies]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExport = () => {
    const data = exportTrackingData(companies);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "yc_w26_tracking.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortButton = ({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) => (
    <button
      onClick={() => handleSort(field)}
      className={`text-xs font-medium ${
        sortField === field ? "text-blue-400" : "text-gray-500"
      } hover:text-gray-300`}
    >
      {label}
      {sortField === field && (sortAsc ? " ^" : " v")}
    </button>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">YC W26 Demo Day Tracker</h1>
            <p className="text-sm text-gray-400">
              {stats.total} companies | {stats.tier1} must-meet |{" "}
              {stats.tier2} high-priority | {stats.reached} reached out |{" "}
              {stats.responded} responded | {stats.meetings} meetings |{" "}
              {stats.invested} invested
            </p>
          </div>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
          >
            Export JSON
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 items-center flex-wrap">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search companies, industries, founders..."
            className="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500 w-64"
          />

          <div className="flex gap-1">
            {(
              [
                ["all", "All"],
                ["tier1", "T1"],
                ["tier2", "T2"],
                ["tier3", "T3"],
                ["tier4", "T4"],
              ] as [TierFilter, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setTierFilter(val)}
                className={`px-2.5 py-1 text-xs rounded ${
                  tierFilter === val
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex gap-1">
            {(
              [
                ["all", "All Status"],
                ["not_started", "Not Started"],
                ["drafted", "Drafted"],
                ["sent", "Sent"],
                ["replied", "Replied"],
              ] as [OutreachFilter, string][]
            ).map(([val, label]) => (
              <button
                key={val}
                onClick={() => setOutreachFilter(val)}
                className={`px-2.5 py-1 text-xs rounded ${
                  outreachFilter === val
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <span className="text-xs text-gray-500 ml-auto">
            {filtered.length} shown
          </span>
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[40px_40px_1fr_80px_120px_100px_80px_100px_60px] items-center gap-2 px-3 py-2 text-xs border-b border-gray-800 bg-gray-950 sticky top-0 z-10">
        <span className="text-gray-500">#</span>
        <span></span>
        <SortButton field="name" label="Company" />
        <div className="text-right">
          <SortButton field="total" label="Score" />
        </div>
        <SortButton field="outreach_status" label="Outreach" />
        <span className="text-gray-500">Founders</span>
        <span className="text-gray-500">Valuation</span>
        <span></span>
      </div>

      {/* Rows */}
      <div>
        {filtered.map((company, i) => (
          <CompanyRow
            key={company.id}
            company={company}
            index={i + 1}
            onUpdate={handleUpdate}
            onOutreach={setOutreachTarget}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No companies match your filters.
        </div>
      )}

      {/* Outreach Modal */}
      {outreachTarget && (
        <OutreachModal
          company={outreachTarget}
          onClose={() => setOutreachTarget(null)}
        />
      )}
    </div>
  );
}
