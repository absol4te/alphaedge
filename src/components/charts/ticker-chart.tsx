"use client";

import { TradingViewWidget } from "@/components/tradingview/tv-widget";
import { tvSymbol } from "@/lib/tradingview";

/**
 * Real-time TradingView Advanced Chart. Used on both the company profile
 * (compact) and the full Charts page (full toolbar + drawing tools).
 */
export function TickerChart({
  symbol,
  height = 400,
  compact = false,
}: {
  symbol: string;
  height?: number | string;
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card" style={{ height }}>
      <TradingViewWidget
        widget="advanced-chart"
        height="100%"
        config={{
          autosize: true,
          symbol: tvSymbol(symbol),
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1", // candlesticks
          backgroundColor: "#0A0A0A",
          gridColor: "rgba(42, 42, 42, 0.4)",
          allow_symbol_change: !compact,
          hide_side_toolbar: compact,
          hide_top_toolbar: false,
          withdateranges: !compact,
          details: !compact,
          hotlist: !compact,
          calendar: false,
          studies: compact ? [] : ["STD;SMA", "STD;RSI"],
          support_host: "https://www.tradingview.com",
        }}
      />
    </div>
  );
}
