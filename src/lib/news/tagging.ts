// ───────────────────────────────────────────────────────────
// Watchlist article classification: tags, sections, relevance/significance
// scoring, source tier, sentiment. Keyword-driven, deterministic.
// ───────────────────────────────────────────────────────────

export type Tag =
  | "Earnings"
  | "Financial Statements"
  | "SEC Filing"
  | "Management"
  | "Product Launch"
  | "AI"
  | "Technology"
  | "M&A"
  | "Dividend"
  | "Buyback"
  | "Litigation"
  | "Regulation"
  | "Analyst Rating"
  | "Partnership"
  | "Market Moving"
  | "Breaking News";

export type Section = "latest" | "earnings" | "management" | "products" | "analyst" | "risks" | "market";
export type Sentiment = "bullish" | "bearish" | "neutral";

export interface TaggedArticle {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  tickers: string[];
  tier: 1 | 2 | 3;
  tags: Tag[];
  sections: Section[];
  relevance: number;
  significance: number;
  sentiment: Sentiment;
}

const TIER1 = /reuters|bloomberg|associated press|\bap\b|financial times|\bft\b|dow jones|sec\b|press release|globenewswire|business wire|prnewswire/i;
const TIER2 = /cnbc|wall street journal|wsj|\bbbc\b|nikkei|the economist|barron|marketwatch|forbes|business insider|investor.?s business daily|seeking ?alpha|the motley fool|zacks/i;
function tierOf(pub: string): 1 | 2 | 3 {
  if (TIER1.test(pub)) return 1;
  if (TIER2.test(pub)) return 2;
  return 3;
}

interface Rule {
  tag: Tag;
  re: RegExp;
  sections: Section[];
  weight: number;
}
const RULES: Rule[] = [
  { tag: "Earnings", re: /\bearnings|quarter(ly)?|\bq[1-4]\b|\beps\b|revenue|guidance|results|beats?|miss(es|ed)?|forecast|outlook/i, sections: ["earnings"], weight: 18 },
  { tag: "Financial Statements", re: /annual report|balance sheet|cash flow|income statement|10-?k\b|10-?q\b/i, sections: ["earnings"], weight: 15 },
  { tag: "SEC Filing", re: /\bsec\b|8-?k\b|13-?f\b|s-?1\b|prospectus|files? with|filing/i, sections: ["earnings"], weight: 16 },
  { tag: "Management", re: /\bceo\b|\bcfo\b|\bcoo\b|chief executive|executive|appoint|resign|steps? down|chairman|\bboard\b|insider (buy|sell|transaction)/i, sections: ["management"], weight: 14 },
  { tag: "Product Launch", re: /launch|unveil|introduc|debut|reveals?|new (product|chip|model|phone|device|service)/i, sections: ["products"], weight: 12 },
  { tag: "Partnership", re: /partner|collaborat|alliance|teams? up|joint venture|deal with|integrat/i, sections: ["products"], weight: 12 },
  { tag: "AI", re: /\bai\b|artificial intelligence|machine learning|chatbot|\bllm\b|generative/i, sections: ["products"], weight: 8 },
  { tag: "Technology", re: /chip|semiconductor|software|cloud|cyber|data ?cent|quantum/i, sections: ["products"], weight: 6 },
  { tag: "M&A", re: /acquir|merger|takeover|buyout|to buy|stake in|acquisition/i, sections: ["market"], weight: 22 },
  { tag: "Dividend", re: /dividend/i, sections: ["market"], weight: 14 },
  { tag: "Buyback", re: /buyback|repurchase|share repurchase/i, sections: ["market"], weight: 16 },
  { tag: "Litigation", re: /lawsuit|sued?|litigation|court|settlement|fine|penalty|class action/i, sections: ["risks"], weight: 18 },
  { tag: "Regulation", re: /regulat|antitrust|investigation|probe|sanction|compliance|\bftc\b|\bdoj\b|\beu\b commission|recall|ban\b/i, sections: ["risks"], weight: 18 },
  { tag: "Analyst Rating", re: /upgrade|downgrade|price target|rating|analyst|overweight|underweight|outperform|underperform|initiates? coverage|buy rating|sell rating/i, sections: ["analyst"], weight: 14 },
];

const BULL = /\b(beat|surge|jump|soar|rally|record|upgrade|gain|rise|tops?|strong|wins?|boost|高|surges|outperform|raises?)\b/i;
const BEAR = /\b(miss|fall|drop|plunge|cut|downgrade|slump|weak|loss|sink|warn|lawsuit|probe|recall|tumble|underperform|halts?)\b/i;
const MOVING = /\b(surge|plunge|soar|tumble|jumps?|sinks?|rally|crash|skyrocket|record high|all-time)\b/i;

function sentimentOf(text: string): Sentiment {
  const bull = BULL.test(text);
  const bear = BEAR.test(text);
  if (bull && !bear) return "bullish";
  if (bear && !bull) return "bearish";
  return "neutral";
}

const TIER_BASE: Record<1 | 2 | 3, number> = { 1: 60, 2: 48, 3: 38 };

export function tagArticle(a: {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  tickers: string[];
}): TaggedArticle {
  const text = `${a.title}`;
  const tier = tierOf(a.publisher);
  const tags: Tag[] = [];
  const sections = new Set<Section>(["latest"]);
  let maxWeight = 0;

  for (const r of RULES) {
    if (r.re.test(text)) {
      if (!tags.includes(r.tag)) tags.push(r.tag);
      r.sections.forEach((s) => sections.add(s));
      maxWeight = Math.max(maxWeight, r.weight);
    }
  }

  const hoursOld = Math.max(0, (Date.now() - +new Date(a.publishedAt)) / 3.6e6);
  if (hoursOld <= 3) tags.push("Breaking News");

  const moving = MOVING.test(text);
  const recency = 18 * Math.max(0, 1 - hoursOld / 36);
  const significance = Math.round(
    Math.max(0, Math.min(100, TIER_BASE[tier] + maxWeight + recency + (moving ? 10 : 0))),
  );
  if (moving || significance >= 80) tags.push("Market Moving");
  if (moving || significance >= 80) sections.add("market");

  // Relevance: company-queried, so inherently high; nudge by tags + tier.
  const relevance = Math.round(Math.max(0, Math.min(100, 72 + (tags.length ? 8 : 0) + (tier === 1 ? 8 : tier === 2 ? 4 : 0) + recency / 3)));

  return {
    ...a,
    tier,
    tags,
    sections: [...sections],
    relevance,
    significance,
    sentiment: sentimentOf(text),
  };
}
