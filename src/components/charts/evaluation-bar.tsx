"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gauge, Check } from "lucide-react";
import { Candle } from "@/types";
import { computeEvaluation } from "@/lib/evaluation";
import { usePriceTargets } from "@/store/price-targets";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatPrice } from "@/lib/utils";

export function EvaluationBar({ symbol }: { symbol: string }) {
  const sym = symbol.toUpperCase();
  const setTarget = usePriceTargets((s) => s.setTarget);
  const current = usePriceTargets((s) => s.targets[sym]);

  const { data, isLoading } = useQuery({
    queryKey: ["eval-candles", sym],
    queryFn: async (): Promise<Candle[]> => {
      const res = await fetch(`/api/charts?symbol=${sym}&tf=6M`);
      if (!res.ok) throw new Error("candles");
      const json = await res.json();
      return json.data ?? [];
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const evalResult = useMemo(() => (data && data.length ? computeEvaluation(data) : null), [data]);

  if (isLoading || !evalResult) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
        <Gauge className="h-4 w-4 shrink-0 text-muted" />
        <Skeleton className="h-2 w-32 rounded-full" />
      </div>
    );
  }

  const { score, label, target } = evalResult;
  const pct = ((score + 1) / 2) * 100; // needle position 0–100%
  const positive = score >= 0;
  const labelColor =
    score > 0.15 ? "text-positive" : score < -0.15 ? "text-negative" : "text-muted";

  const applied = current != null && Math.abs(current - target) < 0.01;

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2">
      <Gauge className="h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wide text-muted">Evaluation</span>
          <span className={cn("text-xs font-bold", labelColor)}>{label}</span>
        </div>
        {/* Sell ↔ Buy gauge */}
        <div className="relative mt-1 h-1.5 w-36 rounded-full">
          <div
            className="absolute inset-0 rounded-full opacity-70"
            style={{ background: "linear-gradient(to right, #FF3B5C, #A0A0A0, #00C853)" }}
          />
          <div
            className="absolute top-1/2 h-3 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground shadow"
            style={{ left: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 border-l border-border pl-3">
        <div className="text-right">
          <div className="text-[10px] text-muted">Suggested</div>
          <div className="tabular text-sm font-bold">{formatPrice(target)}</div>
        </div>
        <button
          onClick={() => setTarget(sym, target)}
          disabled={applied}
          className={cn(
            "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold transition-colors",
            applied
              ? "cursor-default bg-positive/15 text-positive"
              : positive
                ? "bg-accent text-black hover:bg-accent-dim"
                : "bg-negative/15 text-negative hover:bg-negative/25",
          )}
          title="Set this as the price target"
        >
          {applied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Set
            </>
          ) : (
            "Set target"
          )}
        </button>
      </div>
    </div>
  );
}
