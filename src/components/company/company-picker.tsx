"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Loader2, Check, X } from "lucide-react";
import { SearchResult } from "@/lib/providers/discovery";
import { LogoBadge } from "@/components/ui/logo-badge";
import { cn, colorFromString, flagFromCountry } from "@/lib/utils";

export interface PickedCompany {
  symbol: string;
  name: string;
  exchange: string;
}

/** Debounced universal company selector. Calls onSelect with the chosen company. */
export function CompanyPicker({
  value,
  onSelect,
  onClear,
  placeholder = "Link to a company — ticker or name…",
}: {
  value?: PickedCompany | null;
  onSelect: (c: PickedCompany) => void;
  onClear?: () => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const json = await res.json();
        setResults(json.data ?? []);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (value) {
    return (
      <div className="flex items-center gap-2.5 rounded-lg border border-accent/40 bg-accent/10 px-3 py-2">
        <LogoBadge symbol={value.symbol} color={colorFromString(value.symbol)} size={28} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <Check className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold">{value.symbol}</span>
            <span className="truncate text-xs text-muted">{value.name}</span>
          </div>
        </div>
        {onClear && (
          <button onClick={onClear} className="text-muted hover:text-foreground" title="Change company">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3">
        <Search className="h-4 w-4 shrink-0 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
        />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-muted" />}
      </div>

      {open && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-premium">
          {results.length ? (
            <div className="p-1.5">
              {results.map((r, i) => (
                <button
                  key={`${r.tvSymbol}-${i}`}
                  onClick={() => {
                    onSelect({ symbol: r.symbol, name: r.name, exchange: r.exchange });
                    setQuery("");
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface"
                >
                  <LogoBadge symbol={r.symbol} color={colorFromString(r.symbol)} size={28} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.symbol}</span>
                      <span className="truncate text-xs text-muted">{r.name}</span>
                    </div>
                    <span className="text-[11px] text-muted">
                      {flagFromCountry(r.country)} {r.exchange}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={cn("px-4 py-6 text-center text-sm text-muted")}>
              {loading ? "Searching…" : `No matches for "${query}"`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
