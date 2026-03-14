"use client";

import { Company } from "@/lib/types";
import { generateOutreachMessage, generateLinkedInMessage } from "@/lib/outreach";
import { useState } from "react";

interface Props {
  company: Company;
  onClose: () => void;
}

export default function OutreachModal({ company, onClose }: Props) {
  const [tab, setTab] = useState<"email" | "linkedin">("email");
  const [copied, setCopied] = useState(false);

  const message =
    tab === "email"
      ? generateOutreachMessage(company)
      : generateLinkedInMessage(company);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">
              Outreach — {company.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              x
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab("email")}
              className={`px-3 py-1 rounded text-sm ${
                tab === "email"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setTab("linkedin")}
              className={`px-3 py-1 rounded text-sm ${
                tab === "linkedin"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400"
              }`}
            >
              LinkedIn
            </button>
          </div>

          <pre className="bg-gray-800 p-4 rounded text-sm text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">
            {message}
          </pre>

          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCopy}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-medium"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            {company.founder_linkedin && (
              <a
                href={company.founder_linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm font-medium"
              >
                Open LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
