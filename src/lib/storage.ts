import { Company } from "./types";

const STORAGE_KEY = "yc_w26_tracker";

export function loadTracking(): Record<string, Partial<Company>> {
  if (typeof window === "undefined") return {};
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export function saveTracking(companyId: string, updates: Partial<Company>) {
  const all = loadTracking();
  all[companyId] = { ...all[companyId], ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function mergeWithTracking(companies: Company[]): Company[] {
  const tracking = loadTracking();
  return companies.map((c) => {
    const overrides = tracking[c.id];
    if (!overrides) return c;
    return { ...c, ...overrides, scores: c.scores, tier: c.tier };
  });
}

export function exportTrackingData(companies: Company[]): string {
  const rows = companies.map((c) => ({
    name: c.name,
    tier: c.tier,
    score: c.scores.total,
    one_liner: c.one_liner,
    website: c.website,
    yc_url: c.yc_url,
    founder_names: c.founder_names,
    founder_linkedin: c.founder_linkedin,
    valuation: c.valuation,
    reached_out: c.reached_out,
    responded: c.responded,
    meeting_scheduled: c.meeting_scheduled,
    invested: c.invested,
    outreach_status: c.outreach_status,
    notes: c.notes,
  }));
  return JSON.stringify(rows, null, 2);
}
