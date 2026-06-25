"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Target, Check, X, Pencil } from "lucide-react";
import { usePriceTargets } from "@/store/price-targets";
import { cn, formatPrice } from "@/lib/utils";

export function PriceTarget({ symbol }: { symbol: string }) {
  const sym = symbol.toUpperCase();
  const target = usePriceTargets((s) => s.targets[sym]);
  const setTarget = usePriceTargets((s) => s.setTarget);
  const clearTarget = usePriceTargets((s) => s.clearTarget);

  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  // Reset the editor when the symbol changes.
  useEffect(() => {
    setEditing(false);
    setVal("");
  }, [sym]);

  // Reference (last) price — live with a Finnhub key, mock otherwise.
  const { data } = useQuery({
    queryKey: ["quote", sym],
    queryFn: async (): Promise<{ data?: { price: number } } | null> => {
      const res = await fetch(`/api/quote/${sym}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30_000,
    retry: false,
  });
  const last = data?.data?.price;

  const commit = () => {
    const n = parseFloat(val);
    if (!isNaN(n) && n > 0) {
      setTarget(sym, n);
      setEditing(false);
    }
  };

  const upside = target && last ? ((target - last) / last) * 100 : null;

  // ── Editor (no target yet, or editing) ──
  if (editing || target == null) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Target className="h-4 w-4 shrink-0 text-accent" />
        <span className="hidden text-xs font-medium text-muted sm:inline">Price target</span>
        <div className="flex items-center rounded-md border border-border bg-surface px-2">
          <span className="text-sm text-muted">$</span>
          <input
            autoFocus={editing}
            value={val}
            onChange={(e) => setVal(e.target.value.replace(/[^0-9.]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder={last ? last.toFixed(2) : "0.00"}
            inputMode="decimal"
            className="tabular w-20 bg-transparent py-1 text-sm focus:outline-none"
          />
        </div>
        <button
          onClick={commit}
          className="flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-black transition-colors hover:bg-accent-dim"
        >
          <Check className="h-3.5 w-3.5" /> Set
        </button>
        {target != null && (
          <button onClick={() => setEditing(false)} className="text-muted hover:text-foreground" title="Cancel">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    );
  }

  // ── Set state ──
  return (
    <div className="flex items-center gap-3 rounded-lg border border-accent/30 bg-accent/[0.07] px-3 py-2">
      <Target className="h-4 w-4 shrink-0 text-accent" />
      <div className="flex items-baseline gap-2">
        <span className="hidden text-xs font-medium text-muted sm:inline">Target</span>
        <span className="tabular text-sm font-bold">{formatPrice(target)}</span>
      </div>
      {upside != null && (
        <span
          className={cn(
            "tabular rounded px-1.5 py-0.5 text-xs font-semibold",
            upside >= 0 ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative",
          )}
          title={`vs last ${formatPrice(last!)}`}
        >
          {upside >= 0 ? "▲" : "▼"} {Math.abs(upside).toFixed(1)}% {upside >= 0 ? "upside" : "downside"}
        </span>
      )}
      <div className="ml-auto flex items-center gap-0.5">
        <button
          onClick={() => {
            setVal(String(target));
            setEditing(true);
          }}
          className="rounded p-1 text-muted hover:text-foreground"
          title="Edit target"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => clearTarget(sym)}
          className="rounded p-1 text-muted hover:text-negative"
          title="Clear target"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
