import { NextRequest, NextResponse } from "next/server";
import { getNews } from "@/lib/mock-data";
import { Sentiment } from "@/types";

export const runtime = "nodejs";

const POPULAR = ["AAPL", "NVDA", "MSFT", "GOOGL", "AMZN", "META", "TSLA", "JPM"];

const BULL = /(beat|surge|jump|rally|record|soar|upgrade|gain|rise|tops|strong|buy|wins|boost|high)/i;
const BEAR = /(miss|fall|drop|plunge|cut|downgrade|slump|weak|loss|sink|warn|lawsuit|probe|recall|low)/i;
function sentimentOf(text: string): Sentiment {
  if (BULL.test(text)) return "bullish";
  if (BEAR.test(text)) return "bearish";
  return "neutral";
}

export interface NewsItem {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt: string;
  tickers: string[];
  sentiment: Sentiment;
}

interface YahooNews {
  uuid?: string;
  title?: string;
  publisher?: string;
  link?: string;
  providerPublishTime?: number;
  relatedTickers?: string[];
}

async function fetchSymbolNews(symbol: string): Promise<NewsItem[]> {
  const url = `https://query2.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(
    symbol,
  )}&quotesCount=0&newsCount=8&enableFuzzyQuery=false`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`yahoo ${res.status}`);
  const raw = await res.text();
  if (!raw) return [];
  let data: { news?: YahooNews[] };
  try {
    data = JSON.parse(raw);
  } catch {
    return []; // non-JSON body — skip this symbol
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
        .slice(0, 5),
      sentiment: sentimentOf(n.title!),
    }));
}

// GET /api/yahoo-news?symbols=AAPL,NVDA  → live Yahoo Finance news, company-linked
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const extra = (searchParams.get("symbols") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  const symbols = Array.from(new Set([...extra, ...POPULAR])).slice(0, 10);

  const results = await Promise.allSettled(symbols.map(fetchSymbolNews));
  const collected = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  // Yahoo unreachable → fall back to mock so the tab still renders.
  if (collected.length === 0) {
    const fallback: NewsItem[] = getNews(30).map((n) => ({
      id: n.id,
      title: n.headline,
      publisher: n.source,
      url: n.url,
      publishedAt: n.publishedAt,
      tickers: n.symbols,
      sentiment: n.sentiment,
    }));
    return NextResponse.json({ data: fallback, live: false, updatedAt: new Date().toISOString() });
  }

  // Dedupe by id; merge related tickers across duplicates.
  const map = new Map<string, NewsItem>();
  for (const a of collected) {
    const existing = map.get(a.id);
    if (existing) {
      existing.tickers = Array.from(new Set([...existing.tickers, ...a.tickers])).slice(0, 5);
    } else {
      map.set(a.id, { ...a });
    }
  }

  const data = [...map.values()]
    .sort((a, b) => +new Date(b.publishedAt) - +new Date(a.publishedAt))
    .slice(0, 50);

  return NextResponse.json({ data, live: true, updatedAt: new Date().toISOString() });
}
