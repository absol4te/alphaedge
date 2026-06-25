// ───────────────────────────────────────────────────────────
// Finnhub market-data provider (server-side only).
// Returns null when FINNHUB_API_KEY is unset so callers can fall
// back to the deterministic mock-data layer. Never import this from
// a client component — it would leak the key.
// ───────────────────────────────────────────────────────────
import { NewsArticle, Quote, Sentiment } from "@/types";

const BASE = "https://finnhub.io/api/v1";

export function hasLiveData(): boolean {
  return !!process.env.FINNHUB_API_KEY;
}

function key(): string {
  const k = process.env.FINNHUB_API_KEY;
  if (!k) throw new Error("FINNHUB_API_KEY not set");
  return k;
}

async function fh<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const qs = new URLSearchParams({ ...params, token: key() }).toString();
  const res = await fetch(`${BASE}${path}?${qs}`, {
    // Cache live quotes for 15s, news for 60s at the route level.
    next: { revalidate: 15 },
  });
  if (!res.ok) throw new Error(`Finnhub ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

interface FinnhubQuote {
  c: number; // current
  d: number; // change
  dp: number; // percent change
  h: number;
  l: number;
  o: number;
  pc: number; // previous close
}

/** Live quote for a single symbol. Throws on network/HTTP error. */
export async function liveQuote(symbol: string): Promise<Quote> {
  const q = await fh<FinnhubQuote>("/quote", { symbol: symbol.toUpperCase() });
  return {
    symbol: symbol.toUpperCase(),
    name: symbol.toUpperCase(),
    price: q.c,
    change: q.d,
    changePercent: q.dp,
    volume: 0,
  };
}

interface FinnhubNews {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

// Cheap keyword sentiment so live items still carry an indicator.
const BULL = /(beat|surge|jump|rally|record|soar|upgrade|gain|rise|tops|strong)/i;
const BEAR = /(miss|fall|drop|plunge|cut|downgrade|slump|weak|loss|sink|warn)/i;
function sentimentOf(text: string): Sentiment {
  if (BULL.test(text)) return "bullish";
  if (BEAR.test(text)) return "bearish";
  return "neutral";
}

const PALETTE = ["#00C853", "#3B82F6", "#A855F7", "#FFB020", "#FF3B5C", "#0668E1"];

/** Live general market news, mapped onto our NewsArticle shape. */
export async function liveNews(limit: number): Promise<NewsArticle[]> {
  const items = await fh<FinnhubNews[]>("/news", { category: "general" });
  return items.slice(0, limit).map((n, i) => ({
    id: `fh-${n.id}`,
    headline: n.headline,
    summary: n.summary || "Tap to read the full story.",
    source: n.source,
    symbols: n.related ? n.related.split(",").filter(Boolean).slice(0, 3) : [],
    category: n.category ? n.category[0].toUpperCase() + n.category.slice(1) : "Markets",
    sentiment: sentimentOf(`${n.headline} ${n.summary}`),
    imageColor: PALETTE[i % PALETTE.length],
    publishedAt: new Date(n.datetime * 1000).toISOString(),
    url: n.url,
  }));
}

interface FinnhubSearch {
  count: number;
  result: { symbol: string; description: string; type: string }[];
}

export async function liveSearch(query: string) {
  const data = await fh<FinnhubSearch>("/search", { q: query });
  return data.result
    .filter((r) => r.type === "Common Stock")
    .slice(0, 8)
    .map((r) => ({ symbol: r.symbol, name: r.description }));
}
