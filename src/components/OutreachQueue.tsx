"use client";

import { useState, useEffect, useMemo } from "react";
import { Company } from "@/lib/types";
import { mergeWithTracking, saveTracking } from "@/lib/storage";
import {
  generateOutreachMessage,
  generateLinkedInMessage,
} from "@/lib/outreach";
import TierBadge from "./TierBadge";
import companiesData from "../../data/companies.json";

type MessageType = "email" | "linkedin";

export default function OutreachQueue() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [messageType, setMessageType] = useState<MessageType>("linkedin");
  const [editedMessage, setEditedMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [filterTier, setFilterTier] = useState<"all" | "tier1" | "tier2">(
    "tier1"
  );
  const [hideCompleted, setHideCompleted] = useState(true);

  useEffect(() => {
    const merged = mergeWithTracking(companiesData as unknown as Company[]);
    // Sort by score descending
    merged.sort((a, b) => b.scores.total - a.scores.total);
    setCompanies(merged);
  }, []);

  // Filter queue
  const queue = useMemo(() => {
    let result = [...companies];

    if (filterTier === "tier1") {
      result = result.filter((c) => c.tier.includes("TIER 1"));
    } else if (filterTier === "tier2") {
      result = result.filter(
        (c) => c.tier.includes("TIER 1") || c.tier.includes("TIER 2")
      );
    }

    if (hideCompleted) {
      result = result.filter(
        (c) => c.outreach_status === "not_started" || c.outreach_status === "drafted"
      );
    }

    return result;
  }, [companies, filterTier, hideCompleted]);

  const current = queue[currentIndex] || null;

  // Load saved message or generate fresh when company/type changes
  useEffect(() => {
    if (!current) return;
    const savedKey = messageType === "email" ? "saved_email_message" : "saved_linkedin_message";
    const saved = current[savedKey];
    const msg = saved || (
      messageType === "email"
        ? generateOutreachMessage(current)
        : generateLinkedInMessage(current)
    );
    setEditedMessage(msg);
  }, [current?.id, messageType]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save edited message to localStorage after 800ms of inactivity
  useEffect(() => {
    if (!current || !editedMessage) return;
    const key = messageType === "email" ? "saved_email_message" : "saved_linkedin_message";
    const timer = setTimeout(() => {
      saveTracking(current.id, { [key]: editedMessage } as Partial<Company>);
      setCompanies((prev) =>
        prev.map((c) => (c.id === current.id ? { ...c, [key]: editedMessage } : c))
      );
    }, 800);
    return () => clearTimeout(timer);
  }, [editedMessage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCopy = () => {
    navigator.clipboard.writeText(editedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleMarkSent = () => {
    if (!current) return;
    const updates: Partial<Company> = {
      outreach_status: "sent" as const,
      reached_out: true,
    };
    saveTracking(current.id, updates);
    setCompanies((prev) =>
      prev.map((c) => (c.id === current.id ? { ...c, ...updates } : c))
    );
    // Auto-advance to next
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handleMarkDrafted = () => {
    if (!current) return;
    const updates: Partial<Company> = { outreach_status: "drafted" as const };
    saveTracking(current.id, updates);
    setCompanies((prev) =>
      prev.map((c) => (c.id === current.id ? { ...c, ...updates } : c))
    );
  };

  const handleSkip = () => {
    if (currentIndex < queue.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  };

  // LinkedIn search URL for finding the founder
  const linkedInSearchUrl = current
    ? `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(
        (current.founder_names || current.name) + " " + current.name
      )}`
    : "#";

  // Stats
  const sentCount = companies.filter(
    (c) => c.outreach_status === "sent" || c.outreach_status === "replied"
  ).length;
  const draftedCount = companies.filter(
    (c) => c.outreach_status === "drafted"
  ).length;

  if (!current) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">All caught up!</h1>
          <p className="text-gray-400 mb-2">
            {sentCount} sent | {draftedCount} drafted
          </p>
          <a
            href="/"
            className="text-blue-400 hover:underline text-sm"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Top bar */}
      <div className="border-b border-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-gray-400 hover:text-white text-sm">
            Dashboard
          </a>
          <h1 className="text-lg font-bold">Outreach Queue</h1>
          <span className="text-sm text-gray-500">
            {currentIndex + 1} / {queue.length} remaining | {sentCount} sent |{" "}
            {draftedCount} drafted
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={hideCompleted}
              onChange={(e) => {
                setHideCompleted(e.target.checked);
                setCurrentIndex(0);
              }}
              className="rounded"
            />
            Hide sent
          </label>
          <select
            value={filterTier}
            onChange={(e) => {
              setFilterTier(e.target.value as typeof filterTier);
              setCurrentIndex(0);
            }}
            className="bg-gray-800 text-gray-300 text-xs rounded px-2 py-1"
          >
            <option value="tier1">Tier 1 Only</option>
            <option value="tier2">Tier 1 + 2</option>
            <option value="all">All Companies</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[350px_1fr] h-[calc(100vh-53px)]">
        {/* Left sidebar: company info */}
        <div className="border-r border-gray-800 overflow-y-auto p-5 space-y-4">
          {/* Company header */}
          <div className="flex items-start gap-3">
            {current.logo && (
              <img
                src={current.logo}
                alt=""
                className="w-10 h-10 rounded bg-gray-800"
              />
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">{current.name}</h2>
                <TierBadge tier={current.tier} />
              </div>
              <p className="text-sm text-gray-400">{current.one_liner}</p>
            </div>
          </div>

          {/* Score summary */}
          <div className="bg-gray-900 rounded p-3 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Score</span>
              <span className="font-bold text-white">
                {current.scores.total.toFixed(1)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Urgency</span>
              <span>{current.scores.buyer_urgency.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Moat</span>
              <span>{current.scores.moat_potential.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Timing</span>
              <span>{current.scores.market_timing.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">FMF</span>
              <span>{current.scores.founder_market_fit.toFixed(1)}</span>
            </div>
            {current.scores._markets.length > 0 && (
              <div className="pt-1 border-t border-gray-800">
                <span className="text-gray-500">Markets: </span>
                <span className="text-gray-300">
                  {current.scores._markets.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Analysis */}
          <div className="space-y-2 text-xs">
            <div>
              <span className="text-green-500 font-medium">Why: </span>
              <span className="text-gray-300">{current.why_interesting}</span>
            </div>
            <div>
              <span className="text-red-500 font-medium">Risk: </span>
              <span className="text-gray-300">{current.main_concern}</span>
            </div>
          </div>

          {/* Questions */}
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-1">
              Questions to Ask
            </h4>
            <ul className="text-xs text-gray-300 space-y-1">
              {current.questions.map((q, i) => (
                <li key={i} className="leading-relaxed">
                  {i + 1}. {q}
                </li>
              ))}
            </ul>
          </div>

          {/* Founder input */}
          <div className="space-y-2">
            <input
              type="text"
              value={current.founder_names}
              onChange={(e) => {
                const val = e.target.value;
                saveTracking(current.id, { founder_names: val });
                setCompanies((prev) =>
                  prev.map((c) =>
                    c.id === current.id ? { ...c, founder_names: val } : c
                  )
                );
              }}
              placeholder="Founder name(s) — enter to personalize message"
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600"
            />
            <input
              type="text"
              value={current.founder_linkedin}
              onChange={(e) => {
                const val = e.target.value;
                saveTracking(current.id, { founder_linkedin: val });
                setCompanies((prev) =>
                  prev.map((c) =>
                    c.id === current.id ? { ...c, founder_linkedin: val } : c
                  )
                );
              }}
              placeholder="LinkedIn profile URL"
              className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1.5 text-sm text-white placeholder-gray-600"
            />
          </div>

          {/* Links */}
          <div className="flex gap-3 text-xs">
            <a
              href={current.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline"
            >
              Website
            </a>
            <a
              href={current.yc_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-orange-400 hover:underline"
            >
              YC Profile
            </a>
            <a
              href={linkedInSearchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-300 hover:underline"
            >
              Find on LinkedIn
            </a>
          </div>

          {/* Mini queue list */}
          <div className="border-t border-gray-800 pt-3">
            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">
              Queue
            </h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {queue.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => setCurrentIndex(i)}
                  className={`w-full text-left text-xs px-2 py-1 rounded truncate ${
                    i === currentIndex
                      ? "bg-blue-900/50 text-blue-300"
                      : "text-gray-400 hover:bg-gray-800"
                  }`}
                >
                  {i + 1}. {c.name}
                  <span className="text-gray-600 ml-1">
                    {c.scores.total.toFixed(0)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Message editor */}
        <div className="flex flex-col p-5">
          {/* Message type toggle */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-2">
              <button
                onClick={() => setMessageType("linkedin")}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  messageType === "linkedin"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                LinkedIn (short)
              </button>
              <button
                onClick={() => setMessageType("email")}
                className={`px-3 py-1.5 rounded text-sm font-medium ${
                  messageType === "email"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-800 text-gray-400"
                }`}
              >
                Email (full)
              </button>
            </div>
            <span className="text-xs text-gray-500">
              {editedMessage.length} chars
              {messageType === "linkedin" && editedMessage.length > 300 && (
                <span className="text-red-400 ml-1">
                  (over 300 limit!)
                </span>
              )}
            </span>
          </div>

          {/* Editable message */}
          <textarea
            value={editedMessage}
            onChange={(e) => setEditedMessage(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg p-4 text-sm text-gray-200 leading-relaxed resize-none font-mono focus:border-blue-600 focus:outline-none"
            spellCheck
          />

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex gap-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-30 rounded text-sm text-gray-300"
              >
                Prev
              </button>
              <button
                onClick={handleSkip}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-sm text-gray-300"
              >
                Skip
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleMarkDrafted}
                className="px-4 py-2 bg-yellow-900/60 hover:bg-yellow-800/60 text-yellow-300 rounded text-sm font-medium"
              >
                Save Draft
              </button>
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              {current.founder_linkedin ? (
                <a
                  href={current.founder_linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleMarkSent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium inline-flex items-center gap-1"
                >
                  Open LinkedIn + Mark Sent
                </a>
              ) : (
                <a
                  href={linkedInSearchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleMarkSent}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium inline-flex items-center gap-1"
                >
                  Find + Mark Sent
                </a>
              )}
            </div>
          </div>

          {/* Keyboard shortcuts hint */}
          <p className="text-xs text-gray-600 mt-3 text-center">
            Workflow: Edit message if needed → Copy → Open LinkedIn → Paste → Send → Mark Sent (auto-advances)
          </p>
        </div>
      </div>
    </div>
  );
}
