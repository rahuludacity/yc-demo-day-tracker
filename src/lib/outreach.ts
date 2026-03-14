import { Company } from "./types";

// ---------------------------------------------------------------------------
// Message generation matching Rahul's actual outreach style:
//   1. "Hi [Name] — Rahul here."
//   2. Demo Day context + company stood out
//   3. Company-specific observation (what they do + why it matters)
//   4. [PERSONAL HOOK PLACEHOLDER] — only Rahul can write this
//   5. Curiosity question about founder insight
//   6. Credibility: angel investor, $25-50K, early YC
//   7. Soft close
// ---------------------------------------------------------------------------

function founderFirstName(company: Company): string {
  if (!company.founder_names) return "there";
  return company.founder_names.split(/[,&]/)[0].trim().split(" ")[0];
}

function companyObservation(company: Company): string {
  const s = company.scores;
  const name = company.name;
  const liner = company.one_liner;
  const industries = company.industries;
  const markets = s._markets || [];

  // Build a specific observation based on what's actually strong about this company
  if (s.buyer_urgency >= 7 && s.moat_potential >= 6) {
    return (
      `${name} stood out to me while reviewing the batch. ` +
      `${liner} — that feels like a problem where buyers are actively looking for solutions, ` +
      `and the defensibility angle is real.`
    );
  }

  if (s.buyer_urgency >= 7) {
    const vertical = industries[0] || markets[0]?.replace("_", " ") || "this space";
    return (
      `${name} stood out to me while reviewing the batch. ` +
      `The pain point you're addressing in ${vertical} feels genuinely urgent — ` +
      `${liner.toLowerCase().endsWith(".") ? liner.slice(0, -1) : liner} ` +
      `is the kind of problem where buyers have budget and motivation to move fast.`
    );
  }

  if (s.moat_potential >= 6) {
    const moats = s._moats || [];
    const moatHint = moats.includes("hardware_moat")
      ? "the hardware component"
      : moats.includes("data_flywheel")
        ? "the data flywheel potential"
        : moats.includes("regulatory_moat")
          ? "the regulatory depth"
          : "the defensibility";
    return (
      `${name} stood out to me while reviewing the batch. ` +
      `What caught my attention is ${moatHint} — ` +
      `${liner.toLowerCase().endsWith(".") ? liner.slice(0, -1) : liner} ` +
      `feels like it could become genuinely hard to replicate over time.`
    );
  }

  if (s.execution_signal >= 3) {
    return (
      `${name} stood out to me while reviewing the batch. ` +
      `${liner} — I can see you're already shipping, ` +
      `which is more than most companies at this stage can say.`
    );
  }

  if (s.market_timing >= 7) {
    const market = markets[0]?.replace("_", " ") || "your market";
    return (
      `${name} stood out to me while reviewing the batch. ` +
      `The timing on ${market} feels right — ` +
      `${liner.toLowerCase().endsWith(".") ? liner.slice(0, -1) : liner} ` +
      `is hitting a market that's clearly ready for this.`
    );
  }

  // Default: use the one-liner as the hook
  const vertical = industries[0] || "your space";
  return (
    `${name} stood out to me while reviewing the batch. ` +
    `${liner} — applying AI to ${vertical.toLowerCase()} operations ` +
    `feels like a meaningful problem to solve.`
  );
}

function curiosityQuestion(company: Company): string {
  const s = company.scores;

  if (s.founder_market_fit >= 4) {
    return `Curious what insight or experience led you to start ${company.name} and where you see the biggest opportunity.`;
  }

  if (s.buyer_urgency >= 7) {
    return `Curious what you've learned from early customers about what matters most to them.`;
  }

  if (s.moat_potential >= 6) {
    return `Curious what insight led you to this approach and what you think gets harder to replicate as you scale.`;
  }

  if (s.market_timing >= 7) {
    return `Curious what you're seeing in the market right now that convinced you this is the right time to build this.`;
  }

  return `Curious what insight or experience led you to start ${company.name} and where you see the biggest opportunity.`;
}

export function generateOutreachMessage(company: Company): string {
  const name = founderFirstName(company);
  const observation = companyObservation(company);
  const question = curiosityQuestion(company);

  return `Hi ${name} — Rahul here.

I'll be attending YC W26 Demo Day and ${observation}

[YOUR PERSONAL HOOK — what connects you to their problem? Delete this line if nothing specific.]

${question}

I'm an active angel investor and usually invest $25K–$50K in early YC companies. Would enjoy learning more if you're open to connecting around demo day.

Best,
Rahul`;
}

export function generateLinkedInMessage(company: Company): string {
  const name = founderFirstName(company);
  const markets = company.scores._markets || [];
  const topMarket = markets[0]?.replace("_", " ") || "your space";

  // LinkedIn connection requests are capped at ~300 chars
  // Keep it tight but warm
  if (company.scores.buyer_urgency >= 7) {
    return `Hi ${name} — Rahul here. I'll be at YC W26 Demo Day and ${company.name} stood out. The problem you're solving feels genuinely urgent. I'm an angel investor ($25-50K checks) and would love to learn more. Open to connecting?`;
  }

  if (company.scores.moat_potential >= 6) {
    return `Hi ${name} — Rahul here. I'll be at YC W26 Demo Day and ${company.name} caught my eye — the defensibility angle is compelling. I'm an angel investor ($25-50K checks) and would love to connect around demo day.`;
  }

  return `Hi ${name} — Rahul here. I'll be at YC W26 Demo Day and ${company.name} stood out while reviewing the batch. Your approach to ${topMarket} is interesting. I'm an angel investor ($25-50K checks) — would love to connect.`;
}
