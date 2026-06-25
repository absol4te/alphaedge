import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SYMBOLS = [
  "AAPL","NVDA","MSFT","TSLA","AMZN","META","GOOGL","JPM","AMD","NFLX",
  "V","PLTR","INTC","SOFI","SHOP","CRM","UBER","BABA","DIS","PYPL",
  "BA","WMT","GS","COIN","SNAP",
];

export interface Mover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
}

interface YahooQuote {
  symbol?: string;
  shortName?: string;
  longName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
  regularMarketVolume?: number;
}

async function fetchQuotes(): Promise<Mover[]> {
  const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS.join(",")}&fields=symbol,shortName,longName,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketVolume`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36",
      Accept: "application/json",
    },
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`yahoo quote ${res.status}`);
  const data = await res.json();
  const results: YahooQuote[] = data?.quoteResponse?.result ?? [];
  return results
    .filter((q) => q.symbol && q.regularMarketPrice != null)
    .map((q) => ({
      symbol: q.symbol!,
      name: q.shortName ?? q.longName ?? q.symbol!,
      price: q.regularMarketPrice!,
      change: q.regularMarketChange ?? 0,
      changePercent: q.regularMarketChangePercent ?? 0,
      volume: q.regularMarketVolume ?? 0,
    }));
}

// GET /api/movers
export async function GET() {
  try {
    const quotes = await fetchQuotes();
    const sorted = [...quotes].sort((a, b) => b.changePercent - a.changePercent);

    return NextResponse.json({
      live: true,
      gainers: sorted.filter((q) => q.changePercent > 0).slice(0, 8),
      losers:  [...sorted].reverse().filter((q) => q.changePercent < 0).slice(0, 8),
      active:  [...quotes].sort((a, b) => b.volume - a.volume).slice(0, 8),
    });
  } catch (e) {
    console.error("[/api/movers]", e);
    return NextResponse.json({ live: false, gainers: [], losers: [], active: [] }, { status: 200 });
  }
}
