"use client";

import Link from "next/link";
import { EARNINGS, IPOS } from "@/lib/mock-data";
import { LogoBadge } from "@/components/ui/logo-badge";
import { TradingViewWidget } from "@/components/tradingview/tv-widget";
import { cn, formatMarketCap, changeColor } from "@/lib/utils";

export function EconomicCalendar() {
  return (
    <TradingViewWidget
      widget="events"
      height={420}
      config={{
        colorTheme: "dark",
        isTransparent: true,
        width: "100%",
        height: "100%",
        locale: "en",
        importanceFilter: "0,1",
        countryFilter: "us,eu,gb,jp,cn",
      }}
    />
  );
}

export function EarningsList() {
  return (
    <div className="divide-y divide-border/60">
      {EARNINGS.map((e) => (
        <Link
          key={e.symbol}
          href={`/company/${e.symbol}`}
          className="flex items-center gap-2.5 px-1 py-2.5 transition-colors hover:bg-surface"
        >
          <LogoBadge symbol={e.symbol} color={e.logoColor} size={30} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{e.symbol}</div>
            <div className="text-[11px] text-muted">
              {e.date} · {e.time === "BMO" ? "Before Open" : "After Close"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-muted">EPS Est.</div>
            <div className="tabular text-sm font-medium">
              ${e.epsEstimate.toFixed(2)}
              {e.epsActual != null && (
                <span className={cn("ml-1", changeColor(e.epsActual - e.epsEstimate))}>
                  ({e.epsActual >= e.epsEstimate ? "beat" : "miss"})
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export function IPOList() {
  return (
    <div className="divide-y divide-border/60">
      {IPOS.map((ipo) => (
        <Link
          key={ipo.symbol}
          href={`/company/${encodeURIComponent(ipo.symbol)}`}
          className="flex items-center gap-2.5 px-1 py-2.5 transition-colors hover:bg-surface"
        >
          <LogoBadge symbol={ipo.symbol} color={ipo.logoColor} size={30} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold">{ipo.name}</div>
            <div className="text-[11px] text-muted">
              {ipo.exchange} · {ipo.date}
            </div>
          </div>
          <div className="text-right">
            <div className="tabular text-sm font-medium">
              ${ipo.priceRange[0]}–{ipo.priceRange[1]}
            </div>
            <div className="text-[11px] text-muted">{formatMarketCap(ipo.valuation)} val.</div>
          </div>
        </Link>
      ))}
    </div>
  );
}
