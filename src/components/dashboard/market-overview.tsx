"use client";

import { TradingViewWidget } from "@/components/tradingview/tv-widget";
import { TV_OVERVIEW_TABS } from "@/lib/tradingview";

export function MarketOverview() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <TradingViewWidget
        widget="market-overview"
        height={420}
        config={{
          colorTheme: "dark",
          dateRange: "1D",
          showChart: true,
          width: "100%",
          height: "100%",
          isTransparent: true,
          showSymbolLogo: true,
          plotLineColorGrowing: "#00C853",
          plotLineColorFalling: "#FF3B5C",
          gridLineColor: "rgba(42, 42, 42, 0.4)",
          scaleFontColor: "#A0A0A0",
          belowLineFillColorGrowing: "rgba(0, 200, 83, 0.12)",
          belowLineFillColorFalling: "rgba(255, 59, 92, 0.12)",
          symbolActiveColor: "rgba(0, 200, 83, 0.12)",
          tabs: TV_OVERVIEW_TABS,
        }}
      />
    </div>
  );
}
