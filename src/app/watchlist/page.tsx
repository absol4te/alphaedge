"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Star, X, LayoutGrid, Trash2, BarChart3, Newspaper } from "lucide-react";
import { useStore } from "@/store";
import { TradingViewWidget } from "@/components/tradingview/tv-widget";
import { tvSymbol } from "@/lib/tradingview";
import { cn } from "@/lib/utils";

export default function WatchlistPage() {
  const watchlists = useStore((s) => s.watchlists);
  const activeId = useStore((s) => s.activeWatchlistId);
  const setActive = useStore((s) => s.setActiveWatchlist);
  const create = useStore((s) => s.createWatchlist);
  const del = useStore((s) => s.deleteWatchlist);
  const remove = useStore((s) => s.removeFromWatchlist);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const active = watchlists.find((w) => w.id === activeId) ?? watchlists[0];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Watchlists</h1>
          <p className="mt-0.5 text-sm text-muted">
            Real-time quotes for the securities you track. Add tickers from any company page.
          </p>
        </div>
      </div>

      {/* Watchlist tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {watchlists.map((w) => (
          <button
            key={w.id}
            onClick={() => setActive(w.id)}
            className={cn(
              "group flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              w.id === activeId
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-card text-muted hover:text-foreground",
            )}
          >
            <Star className={cn("h-3.5 w-3.5", w.id === activeId && "fill-accent")} />
            {w.name}
            <span className="rounded bg-surface px-1.5 text-[10px]">{w.items.length}</span>
            {watchlists.length > 1 && w.id === activeId && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  del(w.id);
                }}
                className="ml-1 text-muted hover:text-negative"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
          </button>
        ))}

        {creating ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newName.trim()) {
                create(newName.trim());
                setNewName("");
                setCreating(false);
              }
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={() => setCreating(false)}
              placeholder="List name…"
              className="h-8 w-32 rounded-lg border border-accent/40 bg-surface px-2.5 text-sm focus:outline-none"
            />
          </form>
        ) : (
          <button
            onClick={() => setCreating(true)}
            className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-accent"
          >
            <Plus className="h-3.5 w-3.5" /> New List
          </button>
        )}
      </div>

      {active.items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {active.items.map((item) => (
            <div key={item.symbol} className="group relative overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-accent/30">
              {/* Transparent overlay — clicking anywhere on the card opens the company page */}
              <Link
                href={`/company/${encodeURIComponent(item.symbol)}?ex=${encodeURIComponent(item.exchange)}`}
                className="absolute inset-0 z-10"
                aria-label={`Open ${item.symbol}`}
              />

              {/* Action buttons sit above the overlay */}
              <div className="absolute right-2 top-2 z-20 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Link
                  href={`/watchlist/${encodeURIComponent(item.symbol)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-surface/90 text-muted backdrop-blur hover:text-accent"
                  title="News intelligence"
                >
                  <Newspaper className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href={`/company/${encodeURIComponent(item.symbol)}?ex=${encodeURIComponent(item.exchange)}`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-surface/90 text-muted backdrop-blur hover:text-accent"
                  title="Open chart"
                >
                  <BarChart3 className="h-3.5 w-3.5" />
                </Link>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(item.symbol); }}
                  className="flex h-7 w-7 items-center justify-center rounded-md bg-surface/90 text-muted backdrop-blur hover:text-negative"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <TradingViewWidget
                widget="single-quote"
                height={126}
                config={{
                  symbol: item.exchange ? `${item.exchange}:${item.symbol}` : tvSymbol(item.symbol),
                  width: "100%",
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface">
        <LayoutGrid className="h-6 w-6 text-muted" />
      </div>
      <h3 className="text-base font-semibold">This watchlist is empty</h3>
      <p className="mt-1 max-w-xs text-sm text-muted">
        Search for a company and tap the star, or add tickers from any company page.
      </p>
      <Link
        href="/search"
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-dim"
      >
        Find companies
      </Link>
    </div>
  );
}
