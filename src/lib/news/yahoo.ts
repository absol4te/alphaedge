// Shared Yahoo Finance news fetch (server-only). Used by the global feed and
// the per-company watchlist intelligence route.

export interface YahooRaw {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string; // ISO
  tickers: string[];
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

interface YahooNews {
  uuid?: string;
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
  relatedTickers?: string[];
}

export async function fetchYahooSymbol(symbol: string, count = 12): Promise<YahooRaw[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    symbol,
  )}&quotesCount=0&newsCount=${count}&enableFuzzyQuery=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`yahoo ${res.status}`);
  const raw = await res.text();
  if (!raw) return [];
  let data: { news?: YahooNews[] };
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  return (data.news ?? [])
    .filter((n) => n.title && n.link)
    .map((n) => ({
      id: n.uuid || n.link!,
      title: n.title!,
      publisher: n.publisher || "Yahoo Finance",
      url: n.link!,
      publishedAt: new Date((n.providerPublishTime ?? 0) * 1000).toISOString(),
      tickers: Array.from(
        new Set([symbol.toUpperCase(), ...(n.relatedTickers ?? []).map((t) => t.toUpperCase())]),
      )
        .filter((t) => /^[A-Z.\-]{1,6}$/.test(t))
        .slice(0, 6),
    }));
}
