"use client";

import { memo, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/store/theme";

interface Props {
  /** The embed script name, e.g. "advanced-chart", "ticker-tape". */
  widget: string;
  /** JSON config passed to the TradingView embed script. */
  config: Record<string, unknown>;
  height?: number | string;
  className?: string;
  /**
   * When true, a transparent overlay is rendered over the iframe so that
   * clicks do NOT reach TradingView's iframe content (prevents external
   * TradingView navigation while the widget still renders normally).
   * Use for purely informational/decorative widgets (ticker tape, heatmap).
   */
  noNavigation?: boolean;
}

/**
 * Generic wrapper around TradingView's free embeddable widgets.
 * Injects the official embed script with a JSON config and renders the
 * resulting real-time iframe. Rebuilds when the widget or config changes.
 */
function TradingViewWidgetBase({ widget, config, height = "100%", className, noNavigation = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme((s) => s.theme);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    setLoading(true);

    // Reset (handles re-renders + React strict-mode double invoke).
    container.innerHTML = "";
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const light = theme === "light";
    // Theme-driven overrides applied LAST so every widget follows the app theme.
    // (isTransparent:false avoids the white-surface bug on list/card widgets;
    // backgroundColor is only overridden when the config already set one — e.g. the chart.)
    const themed: Record<string, unknown> = {
      colorTheme: light ? "light" : "dark",
      theme: light ? "light" : "dark",
      isTransparent: false,
    };
    if ("backgroundColor" in config) themed.backgroundColor = light ? "#FFFFFF" : "#0A0A0A";

    const script = document.createElement("script");
    script.src = `https://s3.tradingview.com/external-embedding/embed-widget-${widget}.js`;
    script.type = "text/javascript";
    script.async = true;
    script.innerHTML = JSON.stringify({ locale: "en", ...config, ...themed });
    script.onload = () => setLoading(false);
    container.appendChild(script);

    // Fallback: hide the loader even if onload doesn't fire (iframe widgets).
    const t = setTimeout(() => setLoading(false), 2500);

    return () => {
      clearTimeout(t);
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [widget, JSON.stringify(config), theme]);

  return (
    <div className={cn("relative", className)} style={{ height, width: "100%" }}>
      {loading && (
        <div className="skeleton absolute inset-0 z-0 rounded-xl" aria-hidden />
      )}
      <div
        ref={containerRef}
        className="tradingview-widget-container relative z-10"
        style={{ height: "100%", width: "100%" }}
      />
      {/* Click-capture overlay: prevents iframe from receiving pointer events so
          TradingView cannot navigate to tradingview.com on symbol click. */}
      {noNavigation && (
        <div className="absolute inset-0 z-20 cursor-default" aria-hidden />
      )}
    </div>
  );
}

export const TradingViewWidget = memo(TradingViewWidgetBase);
