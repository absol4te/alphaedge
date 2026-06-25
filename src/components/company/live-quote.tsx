"use client";

import { useQuery } from "@tanstack/react-query";
import { cn, formatPrice, formatPercent, changeColor } from "@/lib/utils";

interface QuoteData {
  price: number;
  change: number;
  changePercent: number;
}

/**
 * Renders the live price/change for a symbol. Seeds from the server-rendered
 * mock quote, then upgrades to live data from /api/quote (Finnhub) when a key
 * is configured. A small "LIVE" dot appears once real data arrives.
 */
export function LiveQuote({
  symbol,
  initial,
}: {
  symbol: string;
  initial: QuoteData;
}) {
  const { data } = useQuery({
    queryKey: ["quote", symbol],
    queryFn: async (): Promise<{ data: QuoteData; live: boolean }> => {
      const res = await fetch(`/api/quote/${symbol}`);
      if (!res.ok) throw new Error("quote fetch failed");
      return res.json();
    },
    initialData: { data: initial, live: false },
    refetchInterval: 15_000,
    staleTime: 10_000,
  });

  const q = data.data;
  const pos = q.changePercent >= 0;

  return (
    <div className="mt-3 flex items-baseline gap-3">
      <span className="tabular text-3xl font-bold">{formatPrice(q.price)}</span>
      <span className={cn("tabular text-base font-semibold", changeColor(q.changePercent))}>
        {pos ? "+" : ""}
        {q.change.toFixed(2)} ({formatPercent(q.changePercent)})
      </span>
      {data.live && (
        <span className="flex items-center gap-1 text-[11px] font-medium text-positive">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-positive" />
          LIVE
        </span>
      )}
    </div>
  );
}
