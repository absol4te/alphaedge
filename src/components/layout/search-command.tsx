"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Clock, TrendingUp, X, Loader2, CornerDownLeft } from "lucide-react";
import { useStore, type RecentSearch } from "@/store";
import { SearchResult } from "@/lib/providers/discovery";
import { LogoBadge } from "@/components/ui/logo-badge";
import { cn, colorFromString, flagFromCountry } from "@/lib/utils";

const TRENDING: RecentSearch[] = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
];

export function SearchCommand({ variant = "bar" }: { variant?: "bar" | "hero" }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const recent = useStore((s) => s.recentSearches);
  const pushSearch = useStore((s) => s.pushSearch);

  // Debounced universal search against the discovery API.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults(json.data ?? []);
        setHighlight(0);
      } catch (e) {
        if (!(e instanceof DOMException)) setResults([]);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  // Cmd/Ctrl-K to focus, Esc to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Click-outside
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Search is tab-scoped: searching a company keeps you in the active tab's data domain.
  const destinationFor = (item: { symbol: string; name: string; exchange: string }) => {
    const sym = encodeURIComponent(item.symbol);
    const ex = encodeURIComponent(item.exchange || "");
    if (pathname.startsWith("/charts")) return `/charts?symbol=${sym}&ex=${ex}`;
    if (pathname.startsWith("/statements")) return `/statements?symbol=${sym}&ex=${ex}`;
    if (pathname.startsWith("/earnings")) return `/earnings?symbol=${sym}&name=${encodeURIComponent(item.name)}`;
    if (pathname.startsWith("/watchlist")) return `/watchlist/${sym}`;
    if (pathname.startsWith("/news")) return `/watchlist/${sym}`; // company news-only hub
    return ex ? `/company/${sym}?ex=${ex}` : `/company/${sym}`; // Home / Search → full overview
  };

  const go = (item: { symbol: string; name: string; exchange: string }) => {
    pushSearch({ symbol: item.symbol, name: item.name, exchange: item.exchange });
    setQuery("");
    setOpen(false);
    router.push(destinationFor(item));
  };

  const showResults = query.trim().length > 0;
  const navList = useMemo(
    () => (showResults ? results : recent),
    [showResults, results, recent],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, navList.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter" && navList[highlight]) {
      go(navList[highlight]);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", variant === "hero" ? "w-full" : "w-full max-w-md")}>
      <div
        className={cn(
          "flex items-center gap-2 rounded-lg border bg-surface transition-colors",
          open ? "border-accent/50 shadow-glow-sm" : "border-border",
          variant === "hero" ? "h-12 px-4" : "h-9 px-3",
        )}
      >
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={
            variant === "hero"
              ? "Search any of 50,000+ companies — ticker, name, ISIN…"
              : "Search any stock worldwide…"
          }
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        {loading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted" />
        ) : query ? (
          <button onClick={() => setQuery("")} className="text-muted hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        ) : (
          <kbd className="hidden items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[10px] text-muted sm:flex">
            ⌘K
          </kbd>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 animate-fade-in overflow-hidden rounded-xl border border-border bg-card shadow-premium">
          {showResults ? (
            results.length ? (
              <div className="max-h-[380px] overflow-y-auto p-1.5">
                {results.map((r, i) => (
                  <button
                    key={`${r.tvSymbol}-${i}`}
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                      highlight === i ? "bg-surface" : "hover:bg-surface",
                    )}
                  >
                    <LogoBadge symbol={r.symbol} color={colorFromString(r.symbol)} size={32} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{r.symbol}</span>
                        <span className="truncate text-xs text-muted">{r.name}</span>
                      </div>
                      <span className="text-[11px] text-muted">
                        {flagFromCountry(r.country)} {r.exchange}
                        {r.type && r.type !== "stock" ? ` · ${r.type}` : ""}
                      </span>
                    </div>
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-muted opacity-0 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            ) : loading ? (
              <div className="px-4 py-8 text-center text-sm text-muted">Searching markets…</div>
            ) : (
              <div className="px-4 py-8 text-center text-sm text-muted">
                No results for &ldquo;{query}&rdquo;
              </div>
            )
          ) : (
            <div className="p-1.5">
              {recent.length > 0 && (
                <>
                  <div className="flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                    <Clock className="h-3 w-3" /> Recent
                  </div>
                  {recent.slice(0, 4).map((r, i) => (
                    <button
                      key={r.symbol}
                      onMouseEnter={() => setHighlight(i)}
                      onClick={() => go(r)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors",
                        highlight === i ? "bg-surface" : "hover:bg-surface",
                      )}
                    >
                      <LogoBadge symbol={r.symbol} color={colorFromString(r.symbol)} size={28} />
                      <span className="font-medium">{r.symbol}</span>
                      <span className="truncate text-xs text-muted">{r.name}</span>
                    </button>
                  ))}
                </>
              )}
              <div className="mt-1 flex items-center gap-2 px-2.5 py-1.5 text-[11px] font-medium uppercase tracking-wide text-muted">
                <TrendingUp className="h-3 w-3" /> Trending
              </div>
              {TRENDING.map((r) => (
                <button
                  key={r.symbol}
                  onClick={() => go(r)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface"
                >
                  <LogoBadge symbol={r.symbol} color={colorFromString(r.symbol)} size={28} />
                  <span className="font-medium">{r.symbol}</span>
                  <span className="truncate text-xs text-muted">{r.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
