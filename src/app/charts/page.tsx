"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { COMPANIES } from "@/lib/mock-data";
import { TickerChart } from "@/components/charts/ticker-chart";
import { PriceTarget } from "@/components/charts/price-target";
import { EvaluationBar } from "@/components/charts/evaluation-bar";
import { TradingViewWidget } from "@/components/tradingview/tv-widget";
import { tvSymbol } from "@/lib/tradingview";
import { cn } from "@/lib/utils";

export default function ChartsPage() {
  return (
    <Suspense fallback={null}>
      <ChartsInner />
    </Suspense>
  );
}

function ChartsInner() {
  const params = useSearchParams();
  const [symbol, setSymbol] = useState((params.get("symbol") || "AAPL").toUpperCase());

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col px-4 py-4 sm:px-6">
      {/* Header: real-time ticker + symbol picker */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="w-full max-w-xs">
          <TradingViewWidget
            widget="single-quote"
            height={72}
            config={{ symbol: tvSymbol(symbol), isTransparent: true, width: "100%" }}
          />
        </div>

        <EvaluationBar symbol={symbol} />
        <PriceTarget symbol={symbol} />

        <div className="no-scrollbar ml-auto flex items-center gap-1.5 overflow-x-auto">
          {COMPANIES.slice(0, 10).map((c) => (
            <button
              key={c.symbol}
              onClick={() => setSymbol(c.symbol)}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors",
                symbol === c.symbol
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border bg-card text-muted hover:text-foreground",
              )}
            >
              {c.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* Full real-time TradingView chart with native indicators + drawing tools */}
      <div className="min-h-0 flex-1">
        <TickerChart symbol={symbol} height="100%" compact={false} />
      </div>
    </div>
  );
}
