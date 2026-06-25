"use client";

import { TradingViewWidget } from "@/components/tradingview/tv-widget";

export function Heatmap() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <TradingViewWidget
        widget="stock-heatmap"
        height={400}
        config={{
          dataSource: "SPX500",
          blockSize: "market_cap_basic",
          blockColor: "change",
          grouping: "sector",
          locale: "en",
          symbolUrl: "",
          colorTheme: "dark",
          hasTopBar: false,
          isDataSetEnabled: false,
          isZoomEnabled: true,
          hasSymbolTooltip: true,
          isMonoSize: false,
          width: "100%",
          height: "100%",
        }}
      />
    </div>
  );
}
