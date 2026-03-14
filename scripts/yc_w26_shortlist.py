import json
import argparse
import re

DATA_FILE = "/tmp/yc_w26_companies.json"

# -----------------------------------------------------------------------------
# Rahul-style YC W26 Demo Day shortlisting engine
#
# Philosophy:
#   Rank companies on:
#   1. Market timing        -> is this a now-market?
#   2. Buyer urgency        -> painful + budgeted + must-have?
#   3. Moat potential       -> can this become durable?
#   4. TAM / expansion      -> can this grow into something huge?
#   5. Founder-market-fit   -> why this team?
#   6. Execution signals    -> signs of traction / seriousness
#   7. Theme bonus          -> mega-trend intersection
#   8. Penalties            -> feature risk / crowded / buzzword-heavy
#
# Output:
#   - ranked list
#   - tier labels
#   - why interesting
#   - concern
#   - founder questions
# -----------------------------------------------------------------------------

HOT_MARKETS_2026 = {
    "ai_infra": [
        "infrastructure", "inference", "gpu", "serverless", "monitoring",
        "compression", "context", "guardrail", "vector", "deployment",
        "observability", "evaluation", "latency", "fine-tuning"
    ],
    "ai_agents": [
        "agent", "agentic", "autonomous", "autopilot", "ai employee",
        "copilot", "teammate", "workflow automation", "multi-agent"
    ],
    "defense": [
        "defense", "defence", "military", "drone", "missile",
        "surveillance", "dual-use", "battlefield", "mission"
    ],
    "robotics": [
        "robot", "robotics", "humanoid", "dexterous", "manipulator",
        "warehouse automation", "automation system"
    ],
    "fintech_ai": [
        "payment", "payments", "banking", "insurance", "lending",
        "trading", "billing", "reconciliation", "underwriting",
        "fintech", "treasury"
    ],
    "health_ai": [
        "health", "medical", "clinical", "patient", "drug discovery",
        "hospital", "surgery", "ehr", "care delivery", "provider"
    ],
    "dev_tools": [
        "developer", "devops", "code", "testing", "qa", "ide",
        "sdk", "open-source", "observability", "compiler",
        "debugging", "code review"
    ],
    "energy": [
        "energy", "grid", "solar", "uranium", "battery", "nuclear",
        "power", "utility", "electricity"
    ],
    "space": [
        "space", "satellite", "orbit", "lunar", "moon", "launch",
        "aerospace"
    ],
}

MARKET_HEAT = {
    "ai_infra": 1.00,
    "ai_agents": 0.95,
    "defense": 0.92,
    "robotics": 0.85,
    "dev_tools": 0.82,
    "energy": 0.78,
    "health_ai": 0.76,
    "fintech_ai": 0.72,
    "space": 0.70,
}

MOAT_SIGNALS = {
    "data_flywheel": [
        "proprietary data", "dataset", "training data", "multimodal data",
        "feedback loop", "closed-loop", "benchmark data"
    ],
    "switching_cost": [
        "system of record", "workflow", "embedded", "operating system",
        "mission-critical", "back office", "core workflow"
    ],
    "regulatory_moat": [
        "regulated", "compliance", "fda", "hipaa", "soc 2",
        "audit", "legal", "gxp", "pci"
    ],
    "hardware_moat": [
        "hardware", "chip", "semiconductor", "sensor", "wearable",
        "radar", "device", "robotics platform"
    ],
    "distribution_moat": [
        "marketplace", "platform", "network", "embedded finance",
        "api for", "distribution channel", "channel partner"
    ],
}

TAM_SIGNALS = {
    "large_b2b": [
        "enterprise", "b2b", "corporate", "fortune 500", "mid-market"
    ],
    "platform_layer": [
        "platform", "infrastructure", "api", "sdk", "stack"
    ],
    "large_vertical": [
        "manufacturing", "healthcare", "financial services", "logistics",
        "construction", "industrial", "supply chain", "government"
    ],
    "expansion_surface": [
        "workflow", "suite", "system", "end-to-end", "full stack",
        "multi-product"
    ],
    "global": [
        "global", "cross-border", "worldwide", "international"
    ],
}

URGENCY_SIGNALS = {
    "painkiller": [
        "manual", "slow", "error-prone", "time-consuming",
        "expensive", "broken", "inefficient", "bottleneck"
    ],
    "budget_owner": [
        "revenue", "cost savings", "compliance", "security",
        "headcount", "ops", "finance", "risk", "productivity"
    ],
    "must_have_workflow": [
        "billing", "payments", "security", "claims", "support",
        "underwriting", "documentation", "monitoring", "quality",
        "procurement", "compliance"
    ],
    "regulatory_or_mandated": [
        "compliance", "audit", "regulated", "fda", "legal",
        "security", "mandatory"
    ],
}

FOUNDER_MARKET_FIT_SIGNALS = {
    "deep_technical": [
        "research", "phd", "engineer", "infrastructure", "compiler",
        "systems", "robotics", "ml", "ai"
    ],
    "domain_native": [
        "former doctor", "physician", "trader", "lawyer", "operator",
        "worked at", "built at", "ex-"
    ],
    "credible_builders": [
        "stanford", "mit", "openai", "google", "meta", "stripe",
        "palantir", "nvidia", "anduril", "amazon", "microsoft"
    ],
    "repeat_founder": [
        "second company", "repeat founder", "previous startup",
        "founded before", "sold", "acquired"
    ],
}

EXECUTION_SIGNALS = {
    "traction_words": [
        "customers", "customer", "paid", "revenue", "pilot", "production",
        "deployed", "used by", "adoption", "contract", "annual recurring revenue",
        "arr", "growth"
    ],
    "serious_go_to_market": [
        "enterprise", "procurement", "integration", "compliance", "security review"
    ],
    "shipping_complexity": [
        "infrastructure", "hardware", "robotics", "regulatory", "clinical", "defense"
    ],
}

FEATURE_RISK_SIGNALS = [
    "assistant for", "copilot for", "chatgpt for", "wrapper",
    "summarize", "generate", "meeting notes", "chrome extension",
    "ai teammate", "ai employee"
]

CROWDING_SIGNALS = [
    "sales", "customer support", "meeting notes", "recruiting",
    "generic chatbot", "content generation", "email assistant",
    "note taking", "crm assistant"
]

BUZZWORD_SIGNALS = [
    "redefining", "reimagining", "revolutionizing", "agentic",
    "autonomous", "future of work", "superintelligence",
    "next generation", "world-class", "cutting-edge"
]

ANALOGY_BONUS = [
    "stripe for", "plaid for", "okta for", "harvey for",
    "vercel for", "gong for", "datadog for", "palantir for"
]

THEME_LABELS = sorted(HOT_MARKETS_2026.keys())


# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------

def clean_text(value) -> str:
    if value is None:
        return ""
    if isinstance(value, str):
        return value.strip().lower()
    if isinstance(value, list):
        return " ".join(clean_text(v) for v in value)
    if isinstance(value, dict):
        return " ".join(clean_text(v) for v in value.values())
    return str(value).strip().lower()


def normalize_text(company: dict) -> str:
    fields = [
        "name",
        "one_liner",
        "long_description",
        "description",
        "founder_bio",
        "founders",
        "why_now",
        "industries",
        "tags",
    ]
    text = " ".join(clean_text(company.get(field)) for field in fields)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def keyword_hits(text: str, keywords: list[str]) -> int:
    hits = 0
    for kw in keywords:
        pattern = re.escape(kw.lower())
        if re.search(pattern, text):
            hits += 1
    return hits


def has_any(text: str, keywords: list[str]) -> bool:
    return keyword_hits(text, keywords) > 0


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


# -----------------------------------------------------------------------------
# Scoring
# -----------------------------------------------------------------------------

def score_market_timing(text: str) -> tuple[float, list[str], list[str]]:
    best_score = 0.0
    matched_markets = []
    reasons = []

    for market, keywords in HOT_MARKETS_2026.items():
        hits = keyword_hits(text, keywords)
        if hits > 0:
            matched_markets.append(market)
            base = MARKET_HEAT.get(market, 0.5) * 6.2
            bonus = min(hits, 3) * 0.9
            market_score = clamp(base + bonus, 0, 10)
            if market_score > best_score:
                best_score = market_score
                reasons = [f"Strong exposure to {market.replace('_', ' ')}"]

    if len(matched_markets) >= 2:
        reasons.append("Intersection of multiple strong 2026 themes")

    return round(best_score, 1), matched_markets, reasons


def score_moat(text: str) -> tuple[float, list[str], list[str]]:
    score = 0.0
    moat_types = []
    reasons = []

    for moat, keywords in MOAT_SIGNALS.items():
        hits = keyword_hits(text, keywords)
        if hits > 0:
            moat_types.append(moat)
            score += min(2.3 + (hits - 1) * 0.45, 3.3)

    if "hardware_moat" in moat_types and "regulatory_moat" in moat_types:
        score += 1.0
        reasons.append("Hardware + regulatory combo can be unusually sticky")

    if "switching_cost" in moat_types:
        reasons.append("Workflow / system-of-record angle suggests lock-in")
    if "data_flywheel" in moat_types:
        reasons.append("Potential data flywheel if usage compounds")
    if "distribution_moat" in moat_types:
        reasons.append("Potential distribution advantage if channel really exists")

    return round(clamp(score, 0, 10), 1), moat_types, reasons


def score_tam(text: str) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []

    for bucket, keywords in TAM_SIGNALS.items():
        hits = keyword_hits(text, keywords)
        if hits > 0:
            score += min(1.9 + (hits - 1) * 0.3, 2.7)
            reasons.append(bucket.replace("_", " "))

    return round(clamp(score, 0, 10), 1), reasons


def score_buyer_urgency(text: str) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []

    for bucket, keywords in URGENCY_SIGNALS.items():
        hits = keyword_hits(text, keywords)
        if hits > 0:
            score += min(2.1 + (hits - 1) * 0.45, 3.1)
            reasons.append(bucket.replace("_", " "))

    return round(clamp(score, 0, 10), 1), reasons


def score_founder_market_fit(company: dict, text: str) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []

    for bucket, keywords in FOUNDER_MARKET_FIT_SIGNALS.items():
        hits = keyword_hits(text, keywords)
        if hits > 0:
            score += min(1.4 + (hits - 1) * 0.4, 2.4)
            reasons.append(bucket.replace("_", " "))

    team_size = company.get("team_size") or 0
    if team_size >= 4:
        score += 1.0
        reasons.append("Enough team surface to suggest some execution progress")
    elif team_size >= 2:
        score += 0.5
        reasons.append("Lean team; could still be strong if founder edge is real")

    return round(clamp(score, 0, 5), 1), reasons


def score_execution(company: dict, text: str) -> tuple[float, list[str]]:
    score = 0.0
    reasons = []

    for bucket, keywords in EXECUTION_SIGNALS.items():
        hits = keyword_hits(text, keywords)
        if hits > 0:
            score += min(1.2 + (hits - 1) * 0.35, 1.8)
            reasons.append(bucket.replace("_", " "))

    team_size = company.get("team_size") or 0
    if team_size >= 5:
        score += 0.7
        reasons.append("Larger team may indicate some early build-out")

    return round(clamp(score, 0, 5), 1), reasons


def score_theme_bonus(text: str, matched_markets: list[str]) -> tuple[float, list[str]]:
    bonus = 0.0
    reasons = []

    if has_any(text, ANALOGY_BONUS):
        bonus += 1.8
        reasons.append("Clear market analogy helps positioning")

    if len(matched_markets) >= 2:
        bonus += 1.8
        reasons.append("Multi-theme intersection play")

    if "defense" in matched_markets and "ai_infra" in matched_markets:
        bonus += 1.0
        reasons.append("Defense + AI infra is especially interesting")

    return round(clamp(bonus, 0, 5), 1), reasons


def score_penalties(text: str) -> tuple[float, list[str]]:
    penalty = 0.0
    reasons = []

    feature_hits = keyword_hits(text, FEATURE_RISK_SIGNALS)
    if feature_hits >= 2:
        penalty += 2.8
        reasons.append("Feels closer to feature than company")
    elif feature_hits == 1:
        penalty += 1.2
        reasons.append("Some feature-risk language")

    crowd_hits = keyword_hits(text, CROWDING_SIGNALS)
    if crowd_hits >= 2:
        penalty += 2.6
        reasons.append("Crowded category")
    elif crowd_hits == 1:
        penalty += 1.6
        reasons.append("Likely competitive space")

    buzz_hits = keyword_hits(text, BUZZWORD_SIGNALS)
    if buzz_hits >= 3:
        penalty += 2.0
        reasons.append("Buzzword-heavy description")
    elif buzz_hits == 2:
        penalty += 1.0
        reasons.append("Some buzzword inflation")

    if "agentic" in text and not has_any(text, ["deployment", "workflow", "integration", "customers", "production"]):
        penalty += 1.0
        reasons.append("AI-agent language without enough grounding")

    return round(clamp(penalty, 0, 8), 1), reasons


# -----------------------------------------------------------------------------
# Interpretation
# -----------------------------------------------------------------------------

def classify_company(total: float) -> str:
    if total >= 31:
        return "TIER 1 — MUST MEET"
    if total >= 25:
        return "TIER 2 — HIGH PRIORITY"
    if total >= 18:
        return "TIER 3 — WORTH A LOOK"
    return "TIER 4 — PASS"


def summarize_interest(scores: dict) -> str:
    positives = []

    if scores["buyer_urgency"] >= 7:
        positives.append("urgent pain")
    if scores["market_timing"] >= 7:
        positives.append("strong timing")
    if scores["moat_potential"] >= 7:
        positives.append("credible moat paths")
    if scores["founder_market_fit"] >= 4:
        positives.append("solid founder-market-fit")
    if scores["execution_signal"] >= 3:
        positives.append("early execution signal")
    if scores["tam_signal"] >= 7:
        positives.append("large expansion path")

    if not positives:
        return "Interesting at first glance, but not enough evidence yet."

    return "Interesting because of " + ", ".join(positives) + "."


def summarize_concern(scores: dict, penalty_reasons: list[str]) -> str:
    if penalty_reasons:
        return "Main concern: " + "; ".join(penalty_reasons[:2]) + "."
    if scores["moat_potential"] < 5:
        return "Main concern: moat may be thin."
    if scores["buyer_urgency"] < 5:
        return "Main concern: unclear buyer urgency."
    if scores["founder_market_fit"] < 3:
        return "Main concern: founder edge is not obvious from public data."
    return "Main concern: need sharper validation from customer traction."


def make_questions(scores: dict) -> list[str]:
    questions = []

    if scores["buyer_urgency"] < 6:
        questions.append("What is the sharpest pain point customers are paying to solve right now?")
    else:
        questions.append("Who is the buyer, what budget owns this, and what ROI have you proven?")

    if scores["moat_potential"] < 6:
        questions.append("Why does this become a durable company instead of a thin AI feature?")
    else:
        questions.append("What gets stronger with scale: data, workflow lock-in, regulatory advantage, or distribution?")

    if scores["founder_market_fit"] < 3:
        questions.append("Why are you uniquely suited to win this market versus other smart teams?")
    else:
        questions.append("What founder insight did you have from lived experience that outsiders miss?")

    if scores["tam_signal"] < 5:
        questions.append("What is the wedge market today, and how do you expand into a much larger platform?")
    else:
        questions.append("How big can this become if the initial wedge works exactly as planned?")

    if scores["execution_signal"] < 2:
        questions.append("What evidence do you already have that this is pulling rather than being pushed?")
    else:
        questions.append("What has happened in the last 60 days that most increased your conviction?")

    return questions[:4]


# -----------------------------------------------------------------------------
# Core
# -----------------------------------------------------------------------------

def score_company(company: dict) -> dict:
    text = normalize_text(company)

    market_timing, matched_markets, market_reasons = score_market_timing(text)
    moat_potential, moat_types, moat_reasons = score_moat(text)
    tam_signal, tam_reasons = score_tam(text)
    buyer_urgency, urgency_reasons = score_buyer_urgency(text)
    founder_market_fit, fmf_reasons = score_founder_market_fit(company, text)
    execution_signal, execution_reasons = score_execution(company, text)
    theme_bonus, theme_reasons = score_theme_bonus(text, matched_markets)
    penalty_score, penalty_reasons = score_penalties(text)

    total = (
        market_timing * 1.10
        + buyer_urgency * 1.30
        + moat_potential * 1.25
        + tam_signal * 0.90
        + founder_market_fit * 1.45
        + execution_signal * 0.90
        + theme_bonus * 0.55
        - penalty_score * 1.20
    )
    total = round(max(total, 0.0), 1)

    scores = {
        "market_timing": market_timing,
        "buyer_urgency": buyer_urgency,
        "moat_potential": moat_potential,
        "tam_signal": tam_signal,
        "founder_market_fit": founder_market_fit,
        "execution_signal": execution_signal,
        "theme_bonus": theme_bonus,
        "penalty_score": penalty_score,
        "total": total,
        "_markets": matched_markets,
        "_moats": moat_types,
        "_market_reasons": market_reasons,
        "_moat_reasons": moat_reasons,
        "_tam_reasons": tam_reasons,
        "_urgency_reasons": urgency_reasons,
        "_fmf_reasons": fmf_reasons,
        "_execution_reasons": execution_reasons,
        "_theme_reasons": theme_reasons,
        "_penalty_reasons": penalty_reasons,
    }

    return {
        "name": company.get("name", ""),
        "one_liner": company.get("one_liner", ""),
        "industries": company.get("industries", []),
        "team_size": company.get("team_size") or 0,
        "website": company.get("website", ""),
        "scores": scores,
        "tier": classify_company(total),
        "why_interesting": summarize_interest(scores),
        "main_concern": summarize_concern(scores, penalty_reasons),
        "questions": make_questions(scores),
    }


# -----------------------------------------------------------------------------
# Printing
# -----------------------------------------------------------------------------

def print_company(index: int, result: dict) -> None:
    s = result["scores"]

    print(
        f"  {index:>3}. {result['name']:<30} Score: {s['total']:>5.1f}  "
        f"[Timing:{s['market_timing']:.1f} "
        f"Urg:{s['buyer_urgency']:.1f} "
        f"Moat:{s['moat_potential']:.1f} "
        f"TAM:{s['tam_signal']:.1f} "
        f"FMF:{s['founder_market_fit']:.1f} "
        f"Exec:{s['execution_signal']:.1f} "
        f"Bonus:{s['theme_bonus']:.1f} "
        f"Penalty:-{s['penalty_score']:.1f}]"
    )
    print(f"       {result['one_liner']}")

    if s["_markets"]:
        print(f"       Markets: {', '.join(s['_markets'])}")
    if s["_moats"]:
        print(f"       Moat Signals: {', '.join(s['_moats'])}")

    print(f"       Why interesting: {result['why_interesting']}")
    print(f"       Concern: {result['main_concern']}")

    for question in result["questions"]:
        print(f"       Q: {question}")

    print()


# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(
        description="Rahul-style YC W26 Demo Day shortlist engine"
    )
    parser.add_argument("--tier1", action="store_true", help="Show only Tier 1")
    parser.add_argument(
        "--theme",
        type=str,
        choices=THEME_LABELS,
        help=f"Filter by market theme: {', '.join(THEME_LABELS)}"
    )
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    parser.add_argument("--top", type=int, default=50, help="Show top N companies")
    args = parser.parse_args()

    with open(DATA_FILE, "r", encoding="utf-8") as f:
        companies = json.load(f)

    results = [score_company(company) for company in companies]
    results.sort(key=lambda x: x["scores"]["total"], reverse=True)

    if args.tier1:
        results = [r for r in results if r["tier"] == "TIER 1 — MUST MEET"]

    if args.theme:
        results = [r for r in results if args.theme in r["scores"]["_markets"]]

    results = results[:args.top]

    if args.json:
        print(json.dumps(results, indent=2))
        return

    print(f"\n{'=' * 118}")
    print(f"  YC W26 DEMO DAY SHORTLIST — {len(results)} companies ranked")
    print(f"{'=' * 118}\n")

    current_tier = None
    for i, result in enumerate(results, 1):
        if result["tier"] != current_tier:
            current_tier = result["tier"]
            print(f"\n{'─' * 118}")
            print(f"  {current_tier}")
            print(f"{'─' * 118}")
        print_company(i, result)

    # Reuse already-scored results instead of scoring again
    tier_counts = {}
    for result in [score_company(c) for c in companies]:
        tier_counts[result["tier"]] = tier_counts.get(result["tier"], 0) + 1

    print(f"\n{'=' * 118}")
    print("  SUMMARY")
    print(f"{'=' * 118}")
    for tier in [
        "TIER 1 — MUST MEET",
        "TIER 2 — HIGH PRIORITY",
        "TIER 3 — WORTH A LOOK",
        "TIER 4 — PASS",
    ]:
        print(f"    {tier}: {tier_counts.get(tier, 0)} companies")
    print()


if __name__ == "__main__":
    main()
