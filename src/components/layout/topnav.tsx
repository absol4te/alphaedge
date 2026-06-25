"use client";

import { Sun, Moon } from "lucide-react";
import { SearchCommand } from "./search-command";
import { NotificationsMenu } from "./notifications-menu";
import { TradingViewWidget } from "@/components/tradingview/tv-widget";
import { TV_MARKET_SYMBOLS } from "@/lib/tradingview";
import { useTheme } from "@/store/theme";

export function TopNav() {
  const theme = useTheme((s) => s.theme);
  const toggle = useTheme((s) => s.toggle);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      {/* Real-time ticker tape — noNavigation prevents clicks from opening TradingView */}
      <div className="hidden border-b border-border/60 md:block">
        <TradingViewWidget
          widget="ticker-tape"
          height={46}
          noNavigation
          config={{
            symbols: TV_MARKET_SYMBOLS,
            showSymbolLogo: true,
            displayMode: "adaptive",
            locale: "en",
          }}
        />
      </div>

      <div className="flex h-14 items-center gap-3 px-3 sm:px-4">
        <div className="flex flex-1 justify-start">
          <SearchCommand />
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-card hover:text-foreground"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
          </button>

          <NotificationsMenu />

          <button className="ml-1 flex items-center gap-2 rounded-lg border border-border bg-card px-1.5 py-1 pr-3 transition-colors hover:border-[#3a3a3a]">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-gradient text-xs font-bold text-black">
              VP
            </div>
            <span className="hidden text-sm font-medium sm:inline">V. Petrov</span>
          </button>
        </div>
      </div>
    </header>
  );
}
