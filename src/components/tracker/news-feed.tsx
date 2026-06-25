"use client";

import { useRef, useEffect, useState } from "react";
import { ExternalLink, ChevronDown, ChevronUp, Zap, Twitter, FileText, Radio, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import { tickerColor } from "./company-panel";
import type { NewsItem, SourceType, TrackedCompany } from "@/lib/tracker/types";

interface Props {
  items: NewsItem[];
  watchlist: TrackedCompany[];
  isLoading: boolean;
  compact?: boolean;
}

/* ─────────── Impact / Sentiment / Source config ────────────────────── */

const IMPACT_CONFIG = {
  Critical: { label: "CRIT", cls: "bg-red-500/20 text-red-400 border-red-500/40" },
  High:     { label: "HIGH", cls: "bg-orange-500/20 text-orange-400 border-orange-500/40" },
  Medium:   { label: "MED",  cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" },
  Low:      { label: "LOW",  cls: "bg-muted/20 text-muted border-border" },
} as const;

const SENTIMENT_CONFIG = {
  Bullish: { symbol: "▲", cls: "text-positive" },
  Bearish: { symbol: "▼", cls: "text-negative" },
  Neutral: { symbol: "●", cls: "text-muted" },
} as const;

const SOURCE_TYPE_CONFIG: Record<SourceType, {
  label: string;
  icon: React.FC<{ className?: string }>;
  cls: string;
  rowCls: string;
}> = {
  news:          { label: "NEWS",  icon: Radio,     cls: "bg-card text-muted border-border",                  rowCls: "" },
  social:        { label: "POST",  icon: Twitter,   cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",   rowCls: "bg-blue-500/3" },
  sec:           { label: "SEC",   icon: FileText,  cls: "bg-orange-500/20 text-orange-400 border-orange-500/30", rowCls: "bg-orange-500/3" },
  press_release: { label: "PR",    icon: Building,  cls: "bg-purple-500/20 text-purple-400 border-purple-500/30", rowCls: "bg-purple-500/3" },
  regulatory:    { label: "REG",   icon: FileText,  cls: "bg-red-500/20 text-red-400 border-red-500/30",     rowCls: "bg-red-500/3" },
  announcement:  { label: "ANN",   icon: Building,  cls: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",  rowCls: "bg-cyan-500/3" },
};

const CATEGORY_LABELS: Record<string, string> = {
  earnings: "Earnings", guidance: "Guidance", acquisition: "M&A",
  merger: "M&A", leadership: "Leadership", regulatory: "Regulatory",
  legal: "Legal", product: "Product", analyst: "Analyst",
  macro: "Macro", general: "",
};

/* ─────────── Time formatting ─────────── */

function formatTime(ms: number): string {
  return new Date(ms).toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  });
}

function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  if (d < 60_000)     return `${Math.floor(d / 1000)}s`;
  if (d < 3600_000)   return `${Math.floor(d / 60_000)}m`;
  if (d < 86_400_000) return `${Math.floor(d / 3600_000)}h`;
  return `${Math.floor(d / 86_400_000)}d`;
}

/* ─────────── Source type badge ─────────── */

function SourceBadge({ sourceType }: { sourceType: SourceType }) {
  const cfg = SOURCE_TYPE_CONFIG[sourceType ?? "news"];
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-0.5 rounded border px-1 py-0 text-[9px] font-bold", cfg.cls)}>
      <Icon className="h-2.5 w-2.5" />
      {cfg.label}
    </span>
  );
}

/* ─────────── Social post row (special layout) ─────────── */

function SocialRow({ item, compact }: { item: NewsItem; compact: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const impact = IMPACT_CONFIG[item.impact];
  const sentiment = SENTIMENT_CONFIG[item.sentiment];
  const isRecent = Date.now() - item.publishedAt < 5 * 60_000;

  return (
    <div
      className={cn(
        "group relative border-b border-border/50 px-3 py-2 transition-colors bg-blue-500/3",
        item.isBreaking && "border-l-2 border-l-blue-500/70",
        item.isNew && "ring-1 ring-blue-400/30",
        !compact && "hover:bg-blue-500/5",
      )}
    >
      {/* Row 1: meta */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">{formatTime(item.publishedAt)}</span>
        <SourceBadge sourceType="social" />

        {/* Breaking */}
        {item.isBreaking && (
          <span className="flex shrink-0 items-center gap-0.5 rounded border border-blue-500/40 bg-blue-500/20 px-1 py-0 text-[9px] font-bold uppercase text-blue-400">
            <Zap className="h-2.5 w-2.5" />
            Breaking
          </span>
        )}

        {/* Handle */}
        <span className="shrink-0 text-[11px] font-semibold text-blue-300">
          @{item.socialHandle ?? item.source.replace(/^@/, "")}
        </span>

        {/* Display name */}
        {item.socialDisplayName && item.socialDisplayName !== `@${item.socialHandle}` && (
          <span className="truncate text-[10px] text-muted">{item.socialDisplayName}</span>
        )}

        {/* Ticker tags (if auto-matched) */}
        {item.tickers.slice(0, 3).map((ticker) => {
          const idx = 0;
          return (
            <span key={ticker} className={cn("shrink-0 rounded border px-1 py-0 text-[9px] font-bold", tickerColor(ticker, idx))}>
              {ticker}
            </span>
          );
        })}

        {/* Impact + sentiment */}
        <span className={cn("shrink-0 rounded border px-1 py-0 text-[9px] font-bold", impact.cls)}>{impact.label}</span>
        <span className={cn("shrink-0 text-[11px] font-bold", sentiment.cls)}>{sentiment.symbol}</span>

        {isRecent && <span className="shrink-0 rounded bg-blue-400/20 px-1 text-[9px] font-bold text-blue-300">NEW</span>}

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <span className="text-[10px] text-muted">{timeAgo(item.publishedAt)}</span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted opacity-0 transition-opacity hover:text-blue-400 group-hover:opacity-100"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Row 2: Post text */}
      <div
        className="mt-1.5 cursor-pointer"
        onClick={() => setExpanded((v) => !v)}
      >
        <p className={cn(
          "text-[12px] leading-relaxed text-foreground/90",
          !expanded && compact && "line-clamp-2",
          !expanded && !compact && "line-clamp-3",
        )}>
          {item.headline}
        </p>
        {!compact && item.headline.length > 200 && (
          <button className="mt-0.5 text-[10px] text-muted hover:text-blue-400">
            {expanded ? "Show less ↑" : "Show more ↓"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────── News / filing / PR row ─────────── */

function NewsRow({ item, watchlist, compact }: { item: NewsItem; watchlist: TrackedCompany[]; compact: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const impact = IMPACT_CONFIG[item.impact];
  const sentiment = SENTIMENT_CONFIG[item.sentiment];
  const sourceType = item.sourceType ?? "news";
  const srcCfg = SOURCE_TYPE_CONFIG[sourceType];
  const categoryLabel = CATEGORY_LABELS[item.category] ?? "";
  const isRecent = Date.now() - item.publishedAt < 5 * 60_000;

  return (
    <div
      className={cn(
        "group relative border-b border-border/50 px-3 py-2 transition-colors",
        srcCfg.rowCls,
        item.isBreaking && "border-l-2 border-l-red-500/70",
        item.isNew && "ring-1 ring-accent/30",
        !compact && "hover:bg-card/50",
      )}
    >
      {/* Row 1 */}
      <div className="flex items-center gap-2">
        <span className="shrink-0 font-mono text-[10px] tabular-nums text-muted">{formatTime(item.publishedAt)}</span>

        {/* Source type badge (hide "NEWS" for cleanliness) */}
        {sourceType !== "news" && <SourceBadge sourceType={sourceType} />}

        {item.isBreaking && (
          <span className="flex shrink-0 items-center gap-0.5 rounded border border-red-500/40 bg-red-500/20 px-1 py-0 text-[9px] font-bold uppercase text-red-400">
            <Zap className="h-2.5 w-2.5" />
            Breaking
          </span>
        )}

        {/* Ticker badges */}
        {item.tickers.slice(0, compact ? 2 : 4).map((ticker) => {
          const idx = watchlist.findIndex((c) => c.ticker === ticker);
          return (
            <span key={ticker} className={cn("shrink-0 rounded border px-1.5 py-0 text-[9px] font-bold", tickerColor(ticker, idx >= 0 ? idx : 0))}>
              {ticker}
            </span>
          );
        })}
        {item.tickers.length > (compact ? 2 : 4) && (
          <span className="text-[10px] text-muted">+{item.tickers.length - (compact ? 2 : 4)}</span>
        )}

        <span className={cn("shrink-0 rounded border px-1.5 py-0 text-[9px] font-bold", impact.cls)}>{impact.label}</span>
        <span className={cn("shrink-0 text-[11px] font-bold", sentiment.symbol, sentiment.cls)}>{sentiment.symbol}</span>
        {categoryLabel && <span className="shrink-0 text-[10px] text-muted/70">{categoryLabel}</span>}
        {isRecent && <span className="shrink-0 rounded bg-accent/20 px-1 text-[9px] font-bold text-accent">NEW</span>}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <span className="text-[10px] text-muted/70">
            {item.source}
            {item.sourceCount > 1 && <span className="ml-1 text-muted">+{item.sourceCount - 1}</span>}
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-muted opacity-0 transition-opacity hover:text-accent group-hover:opacity-100"
          >
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Row 2: Headline */}
      <div className="mt-1 flex cursor-pointer items-start gap-1.5" onClick={() => setExpanded((v) => !v)}>
        <p className={cn(
          "flex-1 text-[12px] font-medium leading-snug text-foreground",
          item.impact === "Critical" && "text-red-100",
          item.impact === "High" && "text-orange-100",
          compact && "line-clamp-1",
          !compact && !expanded && "line-clamp-2",
        )}>
          {item.headline}
        </p>
        {!compact && item.summary && (
          <button className="mt-0.5 shrink-0 text-muted hover:text-foreground">
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
        )}
      </div>

      {/* Row 3: Summary (expanded) */}
      {!compact && expanded && item.summary && (
        <p className="mt-1 text-[11px] leading-relaxed text-muted">{item.summary}</p>
      )}
    </div>
  );
}

/* ─────────── Skeleton loader ─────────── */

function SkeletonRow() {
  return (
    <div className="border-b border-border/50 px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="h-3 w-12 rounded bg-card" />
        <div className="h-3 w-8 rounded bg-card" />
        <div className="h-3 w-10 rounded bg-card" />
        <div className="ml-auto h-3 w-16 rounded bg-card" />
      </div>
      <div className="mt-1.5 h-4 w-3/4 rounded bg-card" />
    </div>
  );
}

/* ─────────── Main feed ─────────── */

export function NewsFeed({ items, watchlist, isLoading, compact = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [items.length, autoScroll]);

  function handleScroll() {
    if (!containerRef.current) return;
    setAutoScroll(containerRef.current.scrollTop < 80);
  }

  const pinnedItems  = items.filter((i) => i.isPinned || i.isBreaking);
  const regularItems = items.filter((i) => !i.isPinned && !i.isBreaking);

  // Count by source type for footer
  const socialCount = items.filter((i) => i.sourceType === "social").length;
  const newsCount   = items.filter((i) => !i.sourceType || i.sourceType === "news").length;
  const secCount    = items.filter((i) => i.sourceType === "sec" || i.sourceType === "press_release").length;

  return (
    <div className="relative flex h-full flex-col">
      {!autoScroll && items.length > 0 && (
        <button
          onClick={() => { setAutoScroll(true); containerRef.current?.scrollTo({ top: 0, behavior: "smooth" }); }}
          className="absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-accent/90 px-3 py-1 text-[10px] font-semibold text-black shadow-lg"
        >
          ↑ Jump to latest
        </button>
      )}

      <div ref={containerRef} onScroll={handleScroll} className="min-h-0 flex-1 overflow-y-auto">
        {isLoading && items.length === 0 && (
          <div className="py-2">
            {Array.from({ length: compact ? 20 : 12 }).map((_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium text-foreground">No items match your filters</p>
            <p className="mt-1 text-xs text-muted">Try adjusting filters or add more companies / accounts</p>
          </div>
        )}

        {/* Breaking pinned at top */}
        {pinnedItems.length > 0 && (
          <>
            <div className="sticky top-0 z-10 border-b border-red-500/30 bg-red-500/10 px-3 py-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">⚡ Breaking / Pinned</span>
            </div>
            {pinnedItems.map((item) =>
              item.sourceType === "social"
                ? <SocialRow key={item.id} item={item} compact={compact} />
                : <NewsRow key={item.id} item={item} watchlist={watchlist} compact={compact} />
            )}
            {regularItems.length > 0 && (
              <div className="border-b border-border/30 bg-surface px-3 py-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">Recent</span>
              </div>
            )}
          </>
        )}

        {/* Regular items */}
        {regularItems.map((item) =>
          item.sourceType === "social"
            ? <SocialRow key={item.id} item={item} compact={compact} />
            : <NewsRow key={item.id} item={item} watchlist={watchlist} compact={compact} />
        )}

        {items.length > 0 && <div className="h-6" />}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <div className="shrink-0 border-t border-border/50 px-3 py-1 text-right text-[10px] text-muted">
          {items.length} items
          {pinnedItems.length > 0 && ` · ${pinnedItems.length} breaking`}
          {newsCount > 0 && ` · ${newsCount} news`}
          {socialCount > 0 && ` · ${socialCount} social`}
          {secCount > 0 && ` · ${secCount} filings/PR`}
        </div>
      )}
    </div>
  );
}
