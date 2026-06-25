import type { Impact, Sentiment, Confidence, NewsCategory, NewsItem, RawFeedItem, TrackedCompany, SourceType } from "./types";

/* ───────────────────── Company keyword dictionary ───────────────────── */

export const TICKER_NAMES: Record<string, string> = {
  // Mag-7 / Big Tech
  NVDA: "NVIDIA", TSLA: "Tesla", AAPL: "Apple", MSFT: "Microsoft",
  META: "Meta", GOOGL: "Alphabet", GOOG: "Alphabet", AMZN: "Amazon",
  // Semis
  AMD: "AMD", INTC: "Intel", ARM: "Arm", QCOM: "Qualcomm",
  AVGO: "Broadcom", MU: "Micron", SMCI: "Super Micro", TSM: "TSMC",
  AMAT: "Applied Materials", ASML: "ASML", LRCX: "Lam Research",
  KLAC: "KLA", TXN: "Texas Instruments",
  // AI / Software
  PLTR: "Palantir", CRM: "Salesforce", ORCL: "Oracle", IBM: "IBM",
  SAP: "SAP", NOW: "ServiceNow", SNOW: "Snowflake", DDOG: "Datadog",
  // Consumer / E-com
  WMT: "Walmart", COST: "Costco", TGT: "Target", SHOP: "Shopify",
  // Financials
  JPM: "JPMorgan", GS: "Goldman Sachs", BAC: "Bank of America",
  MS: "Morgan Stanley", C: "Citigroup", WFC: "Wells Fargo", BLK: "BlackRock",
  // Healthcare / Pharma
  PFE: "Pfizer", MRNA: "Moderna", JNJ: "Johnson & Johnson",
  LLY: "Eli Lilly", ABBV: "AbbVie", BMY: "Bristol-Myers Squibb",
  // EV / Auto
  F: "Ford", GM: "General Motors", RIVN: "Rivian", LCID: "Lucid",
  // Streaming / Media
  NFLX: "Netflix", DIS: "Disney", PARA: "Paramount",
  // Mobility / Travel
  UBER: "Uber", LYFT: "Lyft", ABNB: "Airbnb",
  // Fintech / Crypto-adjacent
  COIN: "Coinbase", PYPL: "PayPal", SQ: "Block",
  MSTR: "MicroStrategy", HOOD: "Robinhood",
  // Social
  SNAP: "Snap", PINS: "Pinterest", RDDT: "Reddit",
  // Telecom
  T: "AT&T", VZ: "Verizon", TMUS: "T-Mobile",
  // Defense / Aerospace
  LMT: "Lockheed Martin", RTX: "Raytheon", BA: "Boeing", NOC: "Northrop Grumman",
  // ETFs / Indices
  SPY: "S&P 500", QQQ: "Nasdaq 100", IWM: "Russell 2000",
  DIA: "Dow Jones", VTI: "Total Market", GLD: "Gold", TLT: "Treasury",
};

/** Keyword aliases used for relevance matching */
const TICKER_KEYWORDS: Record<string, string[]> = {
  NVDA: ["nvidia", "jensen huang", "geforce", "cuda", "blackwell", "hopper", "h100", "h200", "b200", "dgx", "nemo", "nvlink"],
  TSLA: ["tesla", "elon musk", "cybertruck", "model 3", "model s", "model x", "model y", "gigafactory", "supercharger", "fsd", "autopilot", "dojo"],
  AAPL: ["apple", "tim cook", "iphone", "ipad", "macbook", "mac ", "ios", "app store", "vision pro", "airpods", "apple watch", "siri"],
  MSFT: ["microsoft", "satya nadella", "azure", "windows", "office 365", "teams", "copilot", "xbox", "github", "openai"],
  META: ["meta ", "facebook", "mark zuckerberg", "instagram", "whatsapp", "threads", "llama", "quest vr", "ray-ban", "horizon worlds"],
  GOOGL: ["google", "alphabet", "sundar pichai", "android", "youtube", "chrome", "gemini", "deepmind", "waymo", "google cloud", "pixel"],
  GOOG: ["google", "alphabet", "sundar pichai", "android", "youtube", "chrome", "gemini", "deepmind", "waymo"],
  AMZN: ["amazon", "andy jassy", "aws", "prime", "alexa", "kindle", "whole foods", "twitch", "ring "],
  AMD: ["amd", "lisa su", "ryzen", "radeon", "epyc", "instinct", "mi300"],
  INTC: ["intel", "pat gelsinger", "core ultra", "xeon", "arc gpu", "gaudi"],
  ARM: ["arm holdings", "arm chip", "arm architecture", "arm-based", "softbank arm"],
  SMCI: ["super micro", "supermicro", "smci"],
  AVGO: ["broadcom", "hock tan", "vmware"],
  PLTR: ["palantir", "alex karp", "aip platform", "gotham", "foundry"],
  QCOM: ["qualcomm", "snapdragon", "cristiano amon"],
  TSM: ["tsmc", "taiwan semiconductor", "morris chang", "n3", "n2 node"],
  JPM: ["jpmorgan", "jp morgan", "jamie dimon"],
  GS: ["goldman sachs", "david solomon"],
  BAC: ["bank of america", "brian moynihan"],
  PFE: ["pfizer", "albert bourla"],
  MRNA: ["moderna", "mrna vaccine", "stephane bancel"],
  LLY: ["eli lilly", "ozempic", "mounjaro", "tirzepatide", "glp-1", "david ricks"],
  RIVN: ["rivian", "rj scaringe"],
  COIN: ["coinbase", "brian armstrong", "coinbase exchange"],
  NFLX: ["netflix", "ted sarandos", "reed hastings"],
  SPY: ["s&p 500", "sp500", "spx", "s&p500", "federal reserve", "fed rate", "interest rate", "inflation", "cpi", "pce", "gdp", "fomc", "jerome powell"],
  QQQ: ["nasdaq", "nasdaq 100", "qqq", "tech sector", "semiconductor sector"],
  IWM: ["russell 2000", "small cap", "small-cap stocks"],
  GLD: ["gold price", "spot gold", "gold etf", "bullion"],
  TLT: ["treasury yield", "10-year yield", "bond market", "long-term bonds", "fed funds"],
};

/* ──────────────────────────── Keyword sets ──────────────────────────── */

const CRITICAL_KEYWORDS = [
  "earnings", "quarterly results", "q1 results", "q2 results", "q3 results", "q4 results",
  "annual results", "beats estimates", "misses estimates", "beat expectations",
  "missed expectations", "eps beat", "eps miss", "revenue beat", "revenue miss",
  "merger", "acquisition", "acquires", "acquired", "takeover", "buyout",
  "fda approval", "fda approved", "fda rejects", "fda rejection", "complete response letter",
  "ceo resign", "ceo resigns", "ceo departure", "ceo steps down", "ceo fired", "ceo ousted",
  "bankruptcy", "chapter 11", "chapter 7", "defaults on debt", "debt default", "insolvency",
  "sec charges", "sec enforcement", "doj indictment", "criminal charges", "securities fraud",
  "class action", "accounting fraud", "financial fraud",
  "major data breach", "cyberattack", "ransomware attack",
  "delisted", "delisting notice", "nasdaq delisting",
  "profit warning", "revenue warning", "earnings warning", "guidance withdrawn",
  "clinical trial failure", "clinical hold", "complete response",
];

const HIGH_KEYWORDS = [
  "guidance", "raises guidance", "lowers guidance", "cuts forecast", "raises forecast",
  "full-year guidance", "revenue guidance", "eps guidance",
  "strategic partnership", "major partnership", "joint venture",
  "government contract", "dod contract", "billion dollar contract", "awarded contract",
  "ipo", "initial public offering", "direct listing", "spac",
  "share buyback", "stock repurchase program", "buyback program",
  "special dividend", "increased dividend", "dividend cut",
  "price target raised", "price target cut", "upgraded to buy", "downgraded to sell",
  "antitrust", "antitrust investigation", "monopoly probe", "ftc investigation", "doj probe",
  "layoffs", "job cuts", "workforce reduction", "restructuring plan",
  "product recall", "safety recall", "fda warning letter",
  "hostile takeover", "acquisition offer", "bid for", "all-cash offer",
  "raised outlook", "lowered outlook", "consensus beat", "consensus miss",
];

const MEDIUM_KEYWORDS = [
  "product launch", "product unveiled", "new product", "announces", "unveils",
  "partnership", "collaboration", "strategic alliance",
  "analyst rating", "maintains rating", "reiterates", "neutral",
  "quarterly guidance", "preliminary results",
  "expansion", "new market", "international expansion",
  "appoints", "names as ceo", "names as cfo", "leadership hire",
  "investor day", "analyst day", "annual meeting",
  "share offering", "secondary offering", "capital raise",
  "patent", "trademark", "intellectual property",
  "fda submission", "nda submission", "anda submission",
];

const BULLISH_KEYWORDS = [
  "beats", "beat", "exceeds", "exceeded", "surpasses", "record high", "record revenue",
  "record profit", "all-time high", "strong growth", "grew", "surge", "surged",
  "gains", "gained", "rises", "rose", "jumps", "jumped", "rallies",
  "positive", "strong", "robust", "solid", "outperforms", "outperformed",
  "approved", "wins", "won", "awarded", "secured", "breakthrough",
  "raises guidance", "above expectations", "better than expected",
  "upgrade", "raised price target", "overweight", "buy rating", "outperform",
  "profit", "profitable", "margin expansion", "accelerates", "momentum",
  "record orders", "record backlog", "market share gain",
];

const BEARISH_KEYWORDS = [
  "misses", "missed", "falls short", "below expectations", "disappoints", "disappointing",
  "decline", "declines", "declined", "drops", "dropped", "falls", "fell", "sinks",
  "negative", "weak", "poor", "cuts", "cut", "lowered", "reduced",
  "loss", "losses", "losing", "unprofitable", "burn rate increases",
  "warning", "warns", "caution", "concerns", "risks elevated",
  "downgrade", "lowered price target", "sell rating", "underweight", "underperform",
  "lowers guidance", "below expectations", "worse than expected",
  "recall", "lawsuit filed", "charges", "fraud", "investigation opened",
  "layoffs", "job cuts", "bankruptcy", "default", "delisted",
  "margin compression", "revenue decline", "revenue miss", "loss widens",
];

/* ─────────────────────────── Scoring functions ──────────────────────── */

function normalise(text: string): string {
  return text.toLowerCase().replace(/['']/g, "'").replace(/[""]/g, '"');
}

export function scoreImpact(text: string): Impact {
  const t = normalise(text);
  if (CRITICAL_KEYWORDS.some((kw) => t.includes(kw))) return "Critical";
  if (HIGH_KEYWORDS.some((kw) => t.includes(kw))) return "High";
  if (MEDIUM_KEYWORDS.some((kw) => t.includes(kw))) return "Medium";
  return "Low";
}

export function scoreSentiment(text: string): Sentiment {
  const t = normalise(text);
  let bullCount = BULLISH_KEYWORDS.filter((kw) => t.includes(kw)).length;
  let bearCount = BEARISH_KEYWORDS.filter((kw) => t.includes(kw)).length;
  if (bullCount > bearCount) return "Bullish";
  if (bearCount > bullCount) return "Bearish";
  return "Neutral";
}

export function scoreConfidence(impact: Impact, sentiment: Sentiment): Confidence {
  if (impact === "Critical") return "High";
  if (impact === "High" && sentiment !== "Neutral") return "High";
  if (impact === "Medium") return "Medium";
  return "Low";
}

export function detectCategory(text: string): NewsCategory {
  const t = normalise(text);
  if (/\bearnings\b|quarterly results|eps |revenue beat|revenue miss|fiscal q/.test(t)) return "earnings";
  if (/\bguidance\b|full.year outlook|raises forecast|lowers forecast|outlook/.test(t)) return "guidance";
  if (/acqui(re|red|res|sition)|merger|buyout|takeover|bid for/.test(t)) return "acquisition";
  if (/ceo |cfo |cto |president .* resign|steps down|appoints|leadership/.test(t)) return "leadership";
  if (/sec |doj |ftc |antitrust|fda |regulatory|lawsuit|class action|probe|investigation/.test(t)) return "regulatory";
  if (/lawsuit|litigation|class action|sued|settlement/.test(t)) return "legal";
  if (/product launch|unveils|announces product|new model|new chip|new drug/.test(t)) return "product";
  if (/price target|upgraded|downgraded|initiates|maintains rating|analyst/.test(t)) return "analyst";
  if (/federal reserve|fed rate|interest rate|inflation|cpi|gdp|macro|economy/.test(t)) return "macro";
  return "general";
}

/**
 * Score 0–100 how relevant this headline is to a set of tracked tickers.
 * Returns matched ticker IDs.
 */
export function scoreRelevance(
  text: string,
  tracked: TrackedCompany[],
): { score: number; tickers: string[] } {
  const t = normalise(text);
  const matched: string[] = [];

  for (const company of tracked) {
    const kws = TICKER_KEYWORDS[company.ticker] ?? [company.name.toLowerCase(), company.ticker.toLowerCase()];
    const hits = kws.filter((kw) => t.includes(kw)).length;
    if (hits > 0) matched.push(company.ticker);
  }

  if (matched.length === 0) return { score: 0, tickers: [] };
  // More matched companies = broader market-moving story
  const score = Math.min(100, 40 + matched.length * 15 + (matched.length > 1 ? 20 : 0));
  return { score, tickers: matched };
}

export function isBreakingNews(impact: Impact, category: NewsCategory): boolean {
  if (impact === "Critical") return true;
  if (impact === "High" && (category === "earnings" || category === "acquisition" || category === "leadership")) return true;
  return false;
}

/* ────────────────── Hash function for deduplication ─────────────────── */

export function hashId(url: string, headline: string): string {
  // Simple djb2 hash — no crypto needed
  const s = (url + headline).toLowerCase().replace(/\s+/g, " ").trim();
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) ^ s.charCodeAt(i);
    h = h >>> 0; // unsigned 32-bit
  }
  return h.toString(36);
}

/** Deduplicate by normalised headline similarity (Jaccard on word sets) */
export function isSimilarHeadline(a: string, b: string, threshold = 0.65): boolean {
  const setA = new Set(normalise(a).split(/\W+/).filter((w) => w.length > 3));
  const setB = new Set(normalise(b).split(/\W+/).filter((w) => w.length > 3));
  if (setA.size === 0 || setB.size === 0) return false;
  const intersection = [...setA].filter((w) => setB.has(w)).length;
  const union = new Set([...setA, ...setB]).size;
  return intersection / union >= threshold;
}

/* ──────────────── Source type detection ────────────────────────────── */

export function detectSourceType(sourceName: string, url: string, preset?: SourceType): SourceType {
  if (preset) return preset;
  const s = sourceName.toLowerCase();
  const u = url.toLowerCase();
  if (s.includes("sec edgar") || s.includes("edgar") || u.includes("sec.gov")) return "sec";
  if (
    s.includes("business wire") || s.includes("businesswire") ||
    s.includes("pr newswire") || s.includes("prnewswire") ||
    s.includes("globe newswire") || s.includes("globenewswire") ||
    s.includes("accesswire") || s.includes("globe newswire")
  ) return "press_release";
  if (
    u.includes("nitter.") || u.includes("twitter.com") || u.includes("x.com") ||
    s.startsWith("@")
  ) return "social";
  if (
    s.includes("federal reserve") || s.includes("sec.gov") || s.includes("ftc") ||
    s.includes("fda") || s.includes("cftc") || s.includes("finra") || s.includes("occ")
  ) return "regulatory";
  return "news";
}

/* ──────────────── Score a raw feed item into a NewsItem ─────────────── */

export function scoreRawItem(
  raw: RawFeedItem,
  tracked: TrackedCompany[],
  fetchedAt: number,
): Omit<NewsItem, "id" | "isPinned" | "isNew" | "sourceCount"> {
  const combinedText = `${raw.title} ${raw.description}`;
  const { score, tickers } = scoreRelevance(combinedText, tracked);
  const impact = scoreImpact(combinedText);
  const sentiment = scoreSentiment(combinedText);
  const confidence = scoreConfidence(impact, sentiment);
  const category = detectCategory(combinedText);
  const sourceType = detectSourceType(raw.sourceName, raw.link, raw.presetSourceType);

  // Social posts from a tracked account always pass — score 100 so no filter can drop them
  const finalScore = sourceType === "social" ? 100 : score;

  // Parse publishedAt
  let publishedAt = fetchedAt;
  if (raw.pubDate) {
    const parsed = Date.parse(raw.pubDate);
    if (!isNaN(parsed)) publishedAt = parsed;
  }

  return {
    tickers,
    primaryTicker: tickers[0] ?? null,
    headline: raw.title.replace(/<[^>]+>/g, "").trim(),
    summary: raw.description.replace(/<[^>]+>/g, "").slice(0, 280).trim(),
    url: raw.link,
    source: raw.sourceName,
    sourceType,
    publishedAt,
    fetchedAt,
    impact,
    sentiment,
    confidence,
    isBreaking: isBreakingNews(impact, category),
    category,
    relevanceScore: finalScore,
    // Pass through social metadata
    ...(raw.socialHandle && { socialHandle: raw.socialHandle }),
    ...(raw.socialDisplayName && { socialDisplayName: raw.socialDisplayName }),
    ...(raw.socialCategory && { socialCategory: raw.socialCategory }),
  };
}
