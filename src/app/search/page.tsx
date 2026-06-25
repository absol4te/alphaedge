"use client";

import Link from "next/link";
import { Search as SearchIcon, TrendingUp, Clock, Globe2 } from "lucide-react";
import { SearchCommand } from "@/components/layout/search-command";
import { COMPANIES } from "@/lib/mock-data";
import { LogoBadge } from "@/components/ui/logo-badge";
import { useStore } from "@/store";
import { colorFromString } from "@/lib/utils";

const POPULAR = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ" },
  { symbol: "META", name: "Meta Platforms, Inc.", exchange: "NASDAQ" },
];

interface RowItem {
  symbol: string;
  name: string;
  exchange: string;
}

export default function SearchPage() {
  const recent = useStore((s) => s.recentSearches);
  const clear = useStore((s) => s.clearSearches);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/10">
          <SearchIcon className="h-6 w-6 text-accent" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Search the markets</h1>
        <p className="mt-1 text-sm text-muted">
          Any of 50,000+ companies across NYSE, NASDAQ, LSE, Euronext, TSE, HKEX, NSE &amp; more — by
          ticker, name, or ISIN.
        </p>
      </div>

      <div className="mx-auto mb-8 max-w-2xl">
        <SearchCommand variant="hero" />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="h-4 w-4 text-muted" /> Recent Searches
            </h2>
            {recent.length > 0 && (
              <button onClick={clear} className="text-xs text-muted hover:text-foreground">
                Clear
              </button>
            )}
          </div>
          <div className="space-y-1.5">
            {recent.length === 0 && (
              <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted">
                No recent searches yet
              </p>
            )}
            {recent.map((r) => (
              <Row key={r.symbol} item={r} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <TrendingUp className="h-4 w-4 text-accent" /> Trending
          </h2>
          <div className="space-y-1.5">
            {POPULAR.map((r) => (
              <Row key={r.symbol} item={r} />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <Globe2 className="h-4 w-4 text-muted" /> Popular Companies
        </h2>
        <div className="grid gap-1.5 sm:grid-cols-2">
          {COMPANIES.map((c) => (
            <Row key={c.symbol} item={{ symbol: c.symbol, name: c.name, exchange: c.exchange }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Row({ item }: { item: RowItem }) {
  return (
    <Link
      href={`/company/${encodeURIComponent(item.symbol)}?ex=${encodeURIComponent(item.exchange)}`}
      className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors hover:border-[#3a3a3a]"
    >
      <LogoBadge symbol={item.symbol} color={colorFromString(item.symbol)} size={32} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{item.symbol}</span>
          <span className="truncate text-xs text-muted">{item.name}</span>
        </div>
        <span className="text-[11px] text-muted">{item.exchange}</span>
      </div>
    </Link>
  );
}
