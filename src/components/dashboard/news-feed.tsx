"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Minus, RefreshCw, Globe, ArrowRight } from "lucide-react";
import type { NewsItem } from "@/app/api/yahoo-news/route";
import { useStore } from "@/store";
import { LogoBadge } from "@/components/ui/logo-badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, timeAgo, colorFromString } from "@/lib/utils";

const sentimentMeta = {
  bullish: { cls: "bg-positive/10 text-positive", Icon: TrendingUp, label: "Bullish" },
  bearish: { cls: "bg-negative/10 text-negative", Icon: TrendingDown, label: "Bearish" },
  neutral: { cls: "bg-muted/10 text-muted", Icon: Minus, label: "Neutral" },
} as const;

export function NewsFeed() {
  // Watchlist companies feed into the global homepage feed too.
  const watchlists = useStore((s) => s.watchlists);
  const symbols = useMemo(
    () => Array.from(new Set(watchlists.flatMap((w) => w.items.map((i) => i.symbol)))).join(","),
    [watchlists],
  );

  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["yahoo-news", "dashboard", symbols],
    queryFn: async (): Promise<{ data: NewsItem[]; live: boolean; updatedAt: string }> => {
      const res = await fetch(`/api/yahoo-news?symbols=${encodeURIComponent(symbols)}`);
      if (!res.ok) throw new Error("news fetch failed");
      return res.json();
    },
    refetchInterval: 60_000, // consistently keep fresh
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  });

  const articles = (data?.data ?? []).slice(0, 16);

  return (
    <div>
      {/* Live status bar */}
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          <span className={cn("h-1.5 w-1.5 rounded-full", data?.live ? "animate-pulse-dot bg-positive" : "bg-muted")} />
          {data?.live ? "Live from Yahoo Finance" : "Sample feed"}
          {dataUpdatedAt > 0 && <span>· updated {timeAgo(new Date(dataUpdatedAt))}</span>}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} /> Refresh
          </button>
          <Link href="/news" className="flex items-center gap-1 text-xs font-medium text-accent hover:underline">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
              <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2 py-1">
                <Skeleton className="h-3 w-3/4" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}

        {!isLoading &&
          articles.map((a) => {
            const meta = sentimentMeta[a.sentiment];
            const lead = a.tickers[0];
            return (
              <article
                key={a.id}
                className="group flex gap-3 rounded-xl border border-border bg-card p-3 transition-colors hover:border-[#3a3a3a]"
              >
                {lead ? (
                  <LogoBadge symbol={lead} color={colorFromString(lead)} size={36} />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface">
                    <Globe className="h-4 w-4 text-muted" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                      <Globe className="h-3 w-3" /> {a.publisher}
                    </span>
                    <span className="text-[11px] text-muted">· {timeAgo(a.publishedAt)}</span>
                    <span className={cn("ml-auto flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium", meta.cls)}>
                      <meta.Icon className="h-3 w-3" />
                      {meta.label}
                    </span>
                  </div>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-accent"
                  >
                    {a.title}
                  </a>
                  {a.tickers.length > 0 && (
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {a.tickers.slice(0, 4).map((t) => (
                        <Link
                          key={t}
                          href={`/company/${encodeURIComponent(t)}`}
                          className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted transition-colors hover:bg-accent/10 hover:text-accent"
                        >
                          ${t}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}

        {!isLoading && articles.length === 0 && (
          <p className="py-10 text-center text-sm text-muted">No stories right now — try Refresh.</p>
        )}
      </div>
    </div>
  );
}
