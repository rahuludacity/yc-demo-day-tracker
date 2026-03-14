import { Company } from "./types";

export function generateOutreachMessage(company: Company): string {
  const founderFirst = company.founder_names
    ? company.founder_names.split(/[,&]/)[0].trim().split(" ")[0]
    : "there";

  const markets = company.scores._markets || [];
  const topMarket = markets[0]?.replace("_", " ") || "your space";

  // Pick the most relevant hook based on scores
  let hook: string;
  if (company.scores.buyer_urgency >= 7) {
    hook = `The problem you're solving feels genuinely urgent — I've been tracking ${topMarket} closely and the buyer pain is real.`;
  } else if (company.scores.moat_potential >= 6) {
    hook = `What caught my eye is the defensibility angle — the moat potential in ${topMarket} is something most companies in this batch don't have.`;
  } else if (company.scores.execution_signal >= 3) {
    hook = `I can see you're already shipping — the execution signals stand out relative to the rest of the batch.`;
  } else if (company.scores.market_timing >= 7) {
    hook = `The timing on ${topMarket} feels perfect right now, and your positioning is sharp.`;
  } else {
    hook = `Your approach to ${topMarket} is interesting — I'd love to understand the founder insight behind it.`;
  }

  // Pick a question from their generated questions
  const question = company.questions[0] || "I'd love to hear what's driving traction right now.";

  return `Hi ${founderFirst},

I'll be at YC Demo Day and ${company.name} is on my shortlist.

${hook}

${question}

Would love to connect — happy to chat at Demo Day or grab 15 min before if that's easier.

Best,
Rahul`;
}

export function generateLinkedInMessage(company: Company): string {
  const founderFirst = company.founder_names
    ? company.founder_names.split(/[,&]/)[0].trim().split(" ")[0]
    : "there";

  const markets = company.scores._markets || [];
  const topMarket = markets[0]?.replace("_", " ") || "your space";

  return `Hi ${founderFirst} — I'll be at YC Demo Day and ${company.name} stood out to me. Your approach to ${topMarket} is compelling. Would love to connect and learn more about what you're building. Happy to chat at Demo Day or before.`;
}
