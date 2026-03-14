export interface Scores {
  market_timing: number;
  buyer_urgency: number;
  moat_potential: number;
  tam_signal: number;
  founder_market_fit: number;
  execution_signal: number;
  theme_bonus: number;
  penalty_score: number;
  total: number;
  _markets: string[];
  _moats: string[];
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  one_liner: string;
  long_description: string;
  logo: string;
  website: string;
  yc_url: string;
  industries: string[];
  team_size: number;
  stage: string;
  batch: string;
  scores: Scores;
  tier: string;
  why_interesting: string;
  main_concern: string;
  questions: string[];
  // Tracking fields
  valuation: string | null;
  founder_names: string;
  founder_linkedin: string;
  reached_out: boolean;
  responded: boolean;
  meeting_scheduled: boolean;
  invested: boolean;
  notes: string;
  outreach_status: "not_started" | "drafted" | "sent" | "replied";
}

export type SortField =
  | "total"
  | "market_timing"
  | "buyer_urgency"
  | "moat_potential"
  | "founder_market_fit"
  | "name"
  | "team_size"
  | "outreach_status";

export type TierFilter = "all" | "tier1" | "tier2" | "tier3" | "tier4";

export type OutreachFilter = "all" | "not_started" | "drafted" | "sent" | "replied";
