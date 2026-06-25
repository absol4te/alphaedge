// ───────────────────────────────────────────────────────────
// Company discovery — provider abstraction with ordered fallback.
//
// The platform is NOT limited to a seeded list. Any ticker, company
// name, or ISIN is resolved at request time through this chain:
//
//   1. TradingView symbol search  (global, all exchanges, no key)
//   2. Finnhub symbol search      (if FINNHUB_API_KEY is set)
//   3. Local seed universe        (offline fallback, ~12 names)
//
// Add Polygon / FMP / Alpha Vantage / Twelve Data / SEC EDGAR / OpenFIGI
// by implementing `SearchProvider` and inserting into PROVIDERS below.
// Server-only — never import from a client component.
// ───────────────────────────────────────────────────────────
import { searchCompanies as localSearch } from "@/lib/mock-data";
import { hasLiveData, liveSearch } from "@/lib/providers/finnhub";

export interface SearchResult {
  symbol: string; // bare ticker, e.g. "AAPL"
  name: string;
  exchange: string; // "NASDAQ", "NYSE", "LSE", "TSE", ...
  type?: string; // stock | fund | dr | index | crypto | forex | ...
  country?: string; // ISO alpha-2
  currency?: string;
  tvSymbol: string; // "EXCHANGE:SYMBOL" for TradingView widgets
  source: string; // which provider answered
}

interface SearchProvider {
  name: string;
  enabled: () => boolean;
  search: (query: string) => Promise<SearchResult[]>;
}

const stripTags = (s: string) => (s ?? "").replace(/<[^>]*>/g, "");

// ── 1. TradingView symbol search (public, used by their own widgets) ──
const TV_ENDPOINT = "https://symbol-search.tradingview.com/symbol_search/";

const tradingViewProvider: SearchProvider = {
  name: "tradingview",
  enabled: () => true,
  async search(query) {
    const url = `${TV_ENDPOINT}?text=${encodeURIComponent(query)}&hl=1&lang=en&domain=production`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AlphaEdge/1.0)",
        Referer: "https://www.tradingview.com/",
        Origin: "https://www.tradingview.com",
      },
      next: { revalidate: 300 },
    });
    if (!res.ok) throw new Error(`tradingview ${res.status}`);
    const data = await res.json();
    const items: Record<string, string>[] = Array.isArray(data) ? data : (data.symbols ?? []);

    const rank = (t = "") =>
      ({ stock: 0, dr: 1, fund: 2, index: 3, economic: 4 })[t] ?? 5;

    return items
      .filter((d) => d.symbol && (d.exchange || d.prefix))
      .map((d) => {
        const symbol = stripTags(d.symbol);
        const prefix = stripTags(d.prefix || d.exchange || "");
        return {
          symbol,
          name: stripTags(d.description || symbol),
          exchange: stripTags(d.exchange || prefix),
          type: d.type,
          country: d.country,
          currency: d.currency_code,
          tvSymbol: `${prefix}:${symbol}`,
          source: "tradingview",
        } as SearchResult;
      })
      .sort((a, b) => rank(a.type) - rank(b.type))
      .slice(0, 12);
  },
};

// ── 2. Finnhub (key-gated) ──
const finnhubProvider: SearchProvider = {
  name: "finnhub",
  enabled: hasLiveData,
  async search(query) {
    const results = await liveSearch(query);
    return results.map((r) => ({
      symbol: r.symbol,
      name: r.name,
      exchange: "US",
      tvSymbol: r.symbol,
      source: "finnhub",
    }));
  },
};

// ── 3. Local seed universe (offline fallback) ──
const localProvider: SearchProvider = {
  name: "local",
  enabled: () => true,
  async search(query) {
    return localSearch(query).map((c) => ({
      symbol: c.symbol,
      name: c.name,
      exchange: c.exchange,
      type: "stock",
      country: "US",
      tvSymbol: `${c.exchange}:${c.symbol}`,
      source: "local",
    }));
  },
};

const PROVIDERS: SearchProvider[] = [tradingViewProvider, finnhubProvider, localProvider];

/** Search across providers, returning the first non-empty result set. */
export async function searchSymbols(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) return [];
  for (const provider of PROVIDERS) {
    if (!provider.enabled()) continue;
    try {
      const results = await provider.search(q);
      if (results.length) return results;
    } catch (e) {
      console.error(`[discovery:${provider.name}] failed:`, e);
    }
  }
  return [];
}

/** Resolve a single symbol to a name/exchange — used to build company pages on demand. */
export async function resolveSymbol(
  symbol: string,
  exchangeHint?: string,
): Promise<SearchResult | null> {
  try {
    const results = await tradingViewProvider.search(symbol);
    const up = symbol.toUpperCase();
    const exact = results.find(
      (r) =>
        r.symbol.toUpperCase() === up &&
        (!exchangeHint || r.exchange.toUpperCase() === exchangeHint.toUpperCase()),
    );
    return exact ?? results.find((r) => r.symbol.toUpperCase() === up) ?? results[0] ?? null;
  } catch (e) {
    console.error("[discovery:resolve] failed:", e);
    return null;
  }
}

/** Deep link to the company's filings on SEC EDGAR full-text search. */
export function edgarUrl(symbol: string): string {
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&ticker=${encodeURIComponent(
    symbol,
  )}&type=&dateb=&owner=include&count=40`;
}
