// ───────────────────────────────────────────────────────────
// News source registry — tier-ranked, with public RSS feeds.
//
// Tier 1 = gold standard (Reuters/AP/Bloomberg/FT/BBC/AFP). Tier 2 = high quality.
// Tier 3 = supplementary. Only sources with PUBLIC RSS are "active" and fetched;
// paywalled Tier-1s (Reuters, AP, Bloomberg, FT, WSJ, Economist, Politico, Nikkei)
// are registered for the hierarchy but require a licensed feed to activate — drop a
// feed URL in and they join the pipeline with no other change.
// ───────────────────────────────────────────────────────────

export type Category = "top" | "business" | "technology" | "world";

export interface NewsSource {
  id: string;
  name: string;
  tier: 1 | 2 | 3;
  active: boolean; // false = registered for hierarchy, no public feed
  feeds: { url: string; category: Category }[];
}

export const SOURCES: NewsSource[] = [
  {
    // Reuters has no public RSS — sourced via Google News scoped to reuters.com.
    id: "reuters",
    name: "Reuters",
    tier: 1,
    active: true,
    feeds: [
      { url: "https://news.google.com/rss/search?q=site:reuters.com+business+when:7d&hl=en-US&gl=US&ceid=US:en", category: "business" },
      { url: "https://news.google.com/rss/search?q=site:reuters.com+world+when:7d&hl=en-US&gl=US&ceid=US:en", category: "world" },
      { url: "https://news.google.com/rss/search?q=site:reuters.com+technology+when:7d&hl=en-US&gl=US&ceid=US:en", category: "technology" },
    ],
  },
  {
    id: "bbc",
    name: "BBC News",
    tier: 1,
    active: true,
    feeds: [
      { url: "https://feeds.bbci.co.uk/news/rss.xml", category: "top" },
      { url: "https://feeds.bbci.co.uk/news/business/rss.xml", category: "business" },
      { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", category: "technology" },
      { url: "https://feeds.bbci.co.uk/news/world/rss.xml", category: "world" },
    ],
  },
  {
    id: "dw",
    name: "Deutsche Welle",
    tier: 1,
    active: true,
    feeds: [
      { url: "https://rss.dw.com/rdf/rss-en-all", category: "top" },
      { url: "https://rss.dw.com/rdf/rss-en-bus", category: "business" },
    ],
  },
  {
    id: "guardian",
    name: "The Guardian",
    tier: 2,
    active: true,
    feeds: [
      { url: "https://www.theguardian.com/business/rss", category: "business" },
      { url: "https://www.theguardian.com/technology/rss", category: "technology" },
      { url: "https://www.theguardian.com/world/rss", category: "world" },
    ],
  },
  {
    id: "npr",
    name: "NPR",
    tier: 2,
    active: true,
    feeds: [
      { url: "https://feeds.npr.org/1006/rss.xml", category: "business" },
      { url: "https://feeds.npr.org/1019/rss.xml", category: "technology" },
      { url: "https://feeds.npr.org/1004/rss.xml", category: "world" },
    ],
  },
  {
    id: "france24",
    name: "France 24",
    tier: 2,
    active: true,
    feeds: [{ url: "https://www.france24.com/en/rss", category: "top" }],
  },

  // ── Registered for the hierarchy; activate with a licensed feed ──
  { id: "ap", name: "Associated Press", tier: 1, active: false, feeds: [] },
  { id: "bloomberg", name: "Bloomberg", tier: 1, active: false, feeds: [] },
  { id: "ft", name: "Financial Times", tier: 1, active: false, feeds: [] },
  { id: "afp", name: "AFP", tier: 1, active: false, feeds: [] },
  { id: "wsj", name: "Wall Street Journal", tier: 2, active: false, feeds: [] },
  { id: "economist", name: "The Economist", tier: 2, active: false, feeds: [] },
  { id: "cnbc", name: "CNBC", tier: 2, active: false, feeds: [] },
  { id: "politico", name: "Politico", tier: 2, active: false, feeds: [] },
  { id: "nikkei", name: "Nikkei Asia", tier: 2, active: false, feeds: [] },
];

export const TIER_BASE: Record<1 | 2 | 3, number> = { 1: 55, 2: 45, 3: 35 };
