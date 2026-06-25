// ───────────────────────────────────────────────────────────
// News aggregation: parse RSS/Atom → dedupe across sources → score 0–100 →
// categorize. Server-only (no fetch here; the route fetches and calls these).
// ───────────────────────────────────────────────────────────
import { Category, NewsSource, TIER_BASE } from "./sources";

export interface RawArticle {
  headline: string;
  url: string;
  summary: string;
  publishedAt: string; // ISO
  sourceName: string;
  tier: 1 | 2 | 3;
  category: Category;
}

export interface Story {
  id: string;
  headline: string;
  url: string;
  summary: string;
  whyItMatters: string;
  source: { name: string; tier: number };
  confirming: string[]; // other confirming source names
  category: Category;
  publishedAt: string;
  score: number;
}

// ── XML helpers (regex-based; the target feeds are well-formed RSS/Atom) ──
function decodeText(s: string): string {
  return (s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagContent(block: string, name: string): string {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1] : "";
}

function extractLink(block: string): string {
  const plain = tagContent(block, "link").trim();
  if (plain && /^https?:/i.test(decodeText(plain))) return decodeText(plain);
  const href = block.match(/<link[^>]*href="([^"]+)"/i);
  return href ? href[1] : decodeText(plain);
}

export function parseFeed(xml: string, source: NewsSource, category: Category, limit = 15): RawArticle[] {
  const items = xml.match(/<(item|entry)\b[\s\S]*?<\/\1>/gi) ?? [];
  const out: RawArticle[] = [];
  for (const block of items.slice(0, limit)) {
    let headline = decodeText(tagContent(block, "title"));
    // Google News appends " - Publisher" to titles; strip the source suffix.
    const suffix = ` - ${source.name}`;
    if (headline.endsWith(suffix)) headline = headline.slice(0, -suffix.length);
    const url = extractLink(block);
    if (!headline || !url) continue;
    const summary = decodeText(
      tagContent(block, "description") || tagContent(block, "summary") || tagContent(block, "content"),
    ).slice(0, 360);
    const dateRaw =
      tagContent(block, "pubDate") ||
      tagContent(block, "published") ||
      tagContent(block, "updated") ||
      tagContent(block, "dc:date");
    const d = new Date(decodeText(dateRaw));
    out.push({
      headline,
      url,
      summary,
      publishedAt: isNaN(+d) ? new Date().toISOString() : d.toISOString(),
      sourceName: source.name,
      tier: source.tier,
      category,
    });
  }
  return out;
}

// ── Anti-clickbait + significance ──
const CLICKBAIT =
  /\b(kardashian|royal family|celebrity|horoscope|astrolog|goes viral|you won.?t believe|shocking|jaw-dropping|fans react|red carpet|met gala|oscars|grammys|dating|wedding|divorce|slams|claps back|breaks silence|net worth)\b/i;
const SIGNIFICANCE =
  /\b(fed|federal reserve|interest rate|inflation|gdp|recession|earnings|revenue|profit|merger|acquisition|acquire|ipo|bankrupt|layoff|sanction|tariff|election|war|ceasefire|strike|antitrust|lawsuit|data breach|outage|semiconductor|artificial intelligence|\bai\b|chip|opec|oil price|central bank|ecb|treasury|default|stimulus|jobs report|unemployment)\b/i;

const STOP = new Set("the a an of to in on for and or with at by from as is are be has have after over into amid say says new".split(" "));
function tokenize(s: string): Set<string> {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP.has(w)),
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

function whyItMatters(text: string, category: Category): string {
  const t = text.toLowerCase();
  if (/\b(fed|interest rate|inflation|central bank|ecb|treasury|gdp|recession)\b/.test(t))
    return "Signals for monetary policy, rates and broad market direction.";
  if (/\b(earnings|revenue|profit|guidance)\b/.test(t)) return "A direct read on corporate financial health and outlook.";
  if (/\b(merger|acquisition|acquire|ipo|buyout)\b/.test(t)) return "Reshapes competitive dynamics and capital flows in the sector.";
  if (/\b(layoff|jobs|unemployment)\b/.test(t)) return "Bears on the labour market and consumer demand.";
  if (/\b(sanction|tariff|war|ceasefire|election|treaty)\b/.test(t)) return "Geopolitical shift with cross-border economic spillover.";
  if (/\b(ai|chip|semiconductor|cyber|breach|outage)\b/.test(t)) return "Tracks the technology cycle driving productivity and risk.";
  const map: Record<Category, string> = {
    top: "Among the most-reported global developments right now.",
    business: "Relevant to markets, corporate strategy and the economy.",
    technology: "Part of the technology cycle shaping growth and risk.",
    world: "International development with potential economic spillover.",
  };
  return map[category];
}

function scoreStory(s: { tier: number; publishedAt: string; confirming: number; text: string }): number {
  const base = TIER_BASE[(s.tier as 1 | 2 | 3) ?? 3] ?? 35;
  const hours = Math.max(0, (Date.now() - +new Date(s.publishedAt)) / 3.6e6);
  const recency = 35 * Math.max(0, 1 - hours / 48); // full within hours, ~0 at 48h
  const confirmation = Math.min(24, s.confirming * 8);
  const significance = SIGNIFICANCE.test(s.text) ? 14 : 0;
  if (CLICKBAIT.test(s.text)) return 0; // rejected
  return Math.round(Math.max(0, Math.min(100, base + recency + confirmation + significance)));
}

/** Cluster near-duplicate articles across sources into scored Stories. */
export function buildStories(articles: RawArticle[]): Story[] {
  // Drop clickbait early.
  const clean = articles.filter((a) => !CLICKBAIT.test(`${a.headline} ${a.summary}`));

  const clusters: { items: RawArticle[]; tokens: Set<string> }[] = [];
  for (const a of clean) {
    const tk = tokenize(a.headline);
    const hit = clusters.find((c) => jaccard(c.tokens, tk) >= 0.5);
    if (hit) hit.items.push(a);
    else clusters.push({ items: [a], tokens: tk });
  }

  return clusters
    .map((c) => {
      // Primary = highest tier, then newest.
      const items = [...c.items].sort(
        (x, y) => x.tier - y.tier || +new Date(y.publishedAt) - +new Date(x.publishedAt),
      );
      const primary = items[0];
      const confirming = Array.from(new Set(items.slice(1).map((i) => i.sourceName)));
      const text = `${primary.headline} ${primary.summary}`;
      const score = scoreStory({
        tier: primary.tier,
        publishedAt: primary.publishedAt,
        confirming: confirming.length,
        text,
      });
      return {
        id: primary.url,
        headline: primary.headline,
        url: primary.url,
        summary: primary.summary,
        whyItMatters: whyItMatters(text, primary.category),
        source: { name: primary.sourceName, tier: primary.tier },
        confirming,
        category: primary.category,
        publishedAt: primary.publishedAt,
        score,
      } as Story;
    })
    .filter((s) => s.score > 0);
}
