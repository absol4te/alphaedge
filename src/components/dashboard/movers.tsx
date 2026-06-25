"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Zap, RefreshCw } from "lucide-react";
import type { Mover } from "@/app/api/movers/route";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoBadge } from "@/components/ui/logo-badge";
import { cn, colorFromString } from "@/lib/utils";

type Tab = "active" | "gainers" | "losers";

interface Feed {
  live: boolean;
  gainers: Mover[];
  losers: Mover[];
  active: Mover[];
}

const TABS: { key: Tab; label: string; icon: typeof Zap }[] = [
  { key: "active",  label: "Active",  icon: Zap },
  { key: "gainers", label: "Gainers", icon: TrendingUp },
  { key: "losers",  label: "Losers",  icon: TrendingDown },
];

export function Movers() {
  const [tab, setTab] = useState<Tab>("active");

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ["movers"],
    queryFn: async (): Promise<Feed> => {
      const res = await fetch("/api/movers");
      if (!res.ok) throw new Error("movers fetch failed");
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  const rows: Mover[] = data?.[tab] ?? [];

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Tab bar */}
      <div className="flex items-center justify-between border-b border-border px-3 pt-2">
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "flex items-center gap-1.5 rounded-t-md px-3 py-2 text-xs font-semibold transition-colors",
                tab === key
                  ? "border-b-2 border-accent text-accent"
                  : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 pb-2 text-[11px] text-muted transition-colors hover:text-foreground"
        >
          <RefreshCw className={cn("h-3 w-3", isFetching && "animate-spin")} />
        </button>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/60">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2.5">
              <Skeleton className="h-7 w-7 shrink-0 rounded-md" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <Skeleton className="h-3 w-14" />
            </div>
          ))}

        {!isLoading && rows.length === 0 && (
          <p className="px-4 py-8 text-center text-sm text-muted">
            {data?.live === false ? "Market data unavailable" : "No movers right now"}
          </p>
        )}

        {!isLoading &&
          rows.map((m) => {
            const up = m.changePercent >= 0;
            return (
              <Link
                key={m.symbol}
                href={`/company/${encodeURIComponent(m.symbol)}`}
                className="flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-surface"
              >
                <LogoBadge symbol={m.symbol} color={colorFromString(m.symbol)} size={28} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">{m.symbol}</div>
                  <div className="truncate text-[11px] text-muted">{m.name}</div>
                </div>
                <div className="text-right">
                  <div className="tabular text-sm font-semibold">
                    ${m.price.toFixed(2)}
                  </div>
                  <div
                    className={cn(
                      "tabular text-[11px] font-medium",
                      up ? "text-positive" : "text-negative",
                    )}
                  >
                    {up ? "+" : ""}
                    {m.changePercent.toFixed(2)}%
                  </div>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
