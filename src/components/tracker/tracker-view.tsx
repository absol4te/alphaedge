"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Radio, Minimize2, Maximize2, Bell, BellOff, Wifi, WifiOff } from "lucide-react";
import { CompanyPanel } from "./company-panel";
import { SocialPanel } from "./social-panel";
import { NewsFeed } from "./news-feed";
import { FilterPanel } from "./filter-panel";
import { TICKER_NAMES } from "@/lib/tracker/scoring";
import { DEFAULT_SOCIAL_ACCOUNTS } from "@/lib/tracker/social";
import { cn } from "@/lib/utils";
import type {
  TrackedCompany,
  SocialAccount,
  NewsItem,
  FilterState,
  AlertSettings,
  SavedWatchlist,
  SavedSocialList,
  SourceType,
  SSEFrame,
} from "@/lib/tracker/types";

/* ─────────────── localStorage keys ─────────────────────── */

const LS_WATCHLIST    = "alphaedge_tracker_watchlist";
const LS_SAVED        = "alphaedge_tracker_saved";
const LS_SOCIAL       = "alphaedge_tracker_social";
const LS_SOCIAL_SAVED = "alphaedge_tracker_social_saved";
const LS_HISTORY      = "alphaedge_tracker_history";
const LS_ALERTS       = "alphaedge_tracker_alerts";

/* ─────────────── localStorage helpers ──────────────────── */

function ls<T>(key: string, fallback: T): T {
  try { const r = localStorage.getItem(key); return r ? (JSON.parse(r) as T) : fallback; } catch { return fallback; }
}
function lsSave(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

/* ─────────────────────── Defaults ──────────────────────── */

const DEFAULT_WATCHLIST: TrackedCompany[] = [
  { id: "NVDA", ticker: "NVDA", name: "NVIDIA",      addedAt: 0 },
  { id: "TSLA", ticker: "TSLA", name: "Tesla",       addedAt: 0 },
  { id: "AAPL", ticker: "AAPL", name: "Apple",       addedAt: 0 },
  { id: "MSFT", ticker: "MSFT", name: "Microsoft",   addedAt: 0 },
  { id: "META", ticker: "META", name: "Meta",        addedAt: 0 },
  { id: "SPY",  ticker: "SPY",  name: "S&P 500",     addedAt: 0 },
  { id: "QQQ",  ticker: "QQQ",  name: "Nasdaq 100",  addedAt: 0 },
];

const DEFAULT_FILTERS: FilterState = {
  impact: ["Critical", "High", "Medium", "Low"],
  sentiment: ["Bullish", "Bearish", "Neutral"],
  tickers: [],
  sourceTypes: [],          // empty = show all
  timeRange: "today",
  showBreakingOnly: false,
  searchQuery: "",
};

const DEFAULT_ALERTS: AlertSettings = {
  soundEnabled: true,
  browserNotifications: false,
  triggers: {
    critical: true,
    earnings: true,
    acquisitions: true,
    regulatory: false,
    guidance: true,
    leadership: false,
    socialBreaking: true,
  },
};

/* ─────────────── Alert sound (Web Audio API) ────────────── */

function playAlert(type: "critical" | "high" | "general") {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    if (type === "critical") {
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.frequency.value = type === "high" ? 880 : 660;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch {}
}

/* ─────────────── Apply filters to news items ───────────────────────── */

function applyFilters(items: NewsItem[], filters: FilterState): NewsItem[] {
  const now = Date.now();
  const cutoffs: Record<FilterState["timeRange"], number> = {
    "1h":  60 * 60 * 1000,
    "4h":  4 * 60 * 60 * 1000,
    today: now - new Date(new Date(now).setHours(0, 0, 0, 0)).getTime(),
    week:  7 * 24 * 60 * 60 * 1000,
    all:   Infinity,
  };
  const cutoff = cutoffs[filters.timeRange];

  return items.filter((item) => {
    const isSocial = item.sourceType === "social";

    // ── If user has explicitly hidden social posts, obey that ──
    if (filters.sourceTypes.length > 0 && !filters.sourceTypes.includes(item.sourceType ?? "news")) return false;

    // ── Social posts from tracked accounts: only apply search query ──
    // All other filters (time range, impact, sentiment, breaking-only, ticker focus)
    // are bypassed — if you track a handle you see EVERY post.
    if (isSocial) {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        return (
          item.headline.toLowerCase().includes(q) ||
          (item.socialHandle?.toLowerCase().includes(q) ?? false) ||
          (item.socialDisplayName?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    }

    // ── News / filings / PRs: apply all filters ──
    if (!filters.impact.includes(item.impact)) return false;
    if (!filters.sentiment.includes(item.sentiment)) return false;
    if (filters.tickers.length > 0 && !item.tickers.some((t) => filters.tickers.includes(t))) return false;
    if (cutoff !== Infinity && now - item.publishedAt > cutoff) return false;
    if (filters.showBreakingOnly && !item.isBreaking) return false;
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      if (
        !item.headline.toLowerCase().includes(q) &&
        !item.source.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });
}

/* ─────────────────────── Main component ────────────────────────────── */

export function TrackerView() {
  const [watchlist, setWatchlist]           = useState<TrackedCompany[]>(DEFAULT_WATCHLIST);
  const [savedLists, setSavedLists]         = useState<SavedWatchlist[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>(DEFAULT_SOCIAL_ACCOUNTS);
  const [socialSaved, setSocialSaved]       = useState<SavedSocialList[]>([]);
  const [news, setNews]                     = useState<NewsItem[]>([]);
  const [filters, setFilters]               = useState<FilterState>(DEFAULT_FILTERS);
  const [alerts, setAlerts]                 = useState<AlertSettings>(DEFAULT_ALERTS);
  const [trackerMode, setTrackerMode]       = useState(false);
  const [connected, setConnected]           = useState(false);
  const [lastUpdate, setLastUpdate]         = useState<number | null>(null);
  const [isLoading, setIsLoading]           = useState(true);
  const [newCount, setNewCount]             = useState(0);

  const seenIds  = useRef<Set<string>>(new Set());
  const esRef    = useRef<EventSource | null>(null);
  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;

  /* ── Load from localStorage on mount ── */
  useEffect(() => {
    setWatchlist(ls(LS_WATCHLIST, DEFAULT_WATCHLIST));
    setSavedLists(ls(LS_SAVED, []));
    setSocialAccounts(ls(LS_SOCIAL, DEFAULT_SOCIAL_ACCOUNTS));
    setSocialSaved(ls(LS_SOCIAL_SAVED, []));
    setAlerts(ls(LS_ALERTS, DEFAULT_ALERTS));
    const history = ls<NewsItem[]>(LS_HISTORY, []);
    if (history.length > 0) {
      setNews(history);
      history.forEach((i) => seenIds.current.add(i.id));
    }
  }, []);

  /* ── Persist on change ── */
  useEffect(() => { lsSave(LS_WATCHLIST, watchlist); }, [watchlist]);
  useEffect(() => { lsSave(LS_SOCIAL, socialAccounts); }, [socialAccounts]);
  useEffect(() => { lsSave(LS_ALERTS, alerts); }, [alerts]);

  /* ── Trigger alerts for new items ── */
  const triggerAlerts = useCallback((items: NewsItem[]) => {
    const a = alertsRef.current;
    for (const item of items) {
      const shouldAlert =
        (a.triggers.critical      && item.impact === "Critical") ||
        (a.triggers.earnings      && item.category === "earnings") ||
        (a.triggers.acquisitions  && (item.category === "acquisition" || item.category === "merger")) ||
        (a.triggers.regulatory    && (item.category === "regulatory" || item.sourceType === "regulatory")) ||
        (a.triggers.guidance      && item.category === "guidance") ||
        (a.triggers.leadership    && item.category === "leadership") ||
        (a.triggers.socialBreaking && item.sourceType === "social" && item.isBreaking);

      if (!shouldAlert) continue;

      if (a.soundEnabled) {
        playAlert(item.impact === "Critical" ? "critical" : item.impact === "High" ? "high" : "general");
      }
      if (a.browserNotifications && "Notification" in window && Notification.permission === "granted") {
        const prefix = item.sourceType === "social" ? `@${item.socialHandle}` : (item.primaryTicker ?? "MARKET");
        new Notification(`[${item.impact}] ${prefix}`, {
          body: item.headline,
          icon: "/favicon.ico",
        });
      }
    }
  }, []);

  /* ── Merge incoming items ── */
  const mergeItems = useCallback((incoming: NewsItem[], markNew = false) => {
    const truly = incoming.filter((i) => !seenIds.current.has(i.id));
    if (truly.length === 0) return;
    truly.forEach((i) => {
      seenIds.current.add(i.id);
      if (markNew) i.isNew = true;
    });
    setNews((prev) => {
      const merged = [...truly, ...prev].slice(0, 500);
      lsSave(LS_HISTORY, merged);
      return merged;
    });
    if (markNew) {
      setNewCount((c) => c + truly.length);
      triggerAlerts(truly.filter((i) => i.isBreaking || i.impact === "Critical" || i.impact === "High"));
      setTimeout(() => {
        setNews((prev) => prev.map((i) => ({ ...i, isNew: false })));
        setNewCount(0);
      }, 4000);
    }
  }, [triggerAlerts]);

  /* ── SSE connection — reconnects when watchlist OR social accounts change ── */
  useEffect(() => {
    const tickers = watchlist.map((c) => c.ticker).join(",");
    const accounts = socialAccounts.filter((a) => a.enabled).map((a) => a.handle).join(",");

    if (!tickers && !accounts) return;

    if (esRef.current) { esRef.current.close(); esRef.current = null; }

    setIsLoading(true);
    setConnected(false);

    const params = new URLSearchParams();
    if (tickers)  params.set("tickers",  tickers);
    if (accounts) params.set("accounts", accounts);
    const url = `/api/news-tracker/stream?${params.toString()}`;

    const es = new EventSource(url);
    esRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const frame = JSON.parse(event.data) as SSEFrame;
        if (frame.type === "initial") {
          setIsLoading(false);
          setConnected(true);
          setLastUpdate(frame.fetchedAt);
          mergeItems(frame.items, false);
        } else if (frame.type === "update") {
          setLastUpdate(frame.fetchedAt);
          mergeItems(frame.items, true);
        }
      } catch {}
    };

    es.onerror = () => setConnected(false);

    return () => { es.close(); esRef.current = null; setConnected(false); };
  }, [watchlist, socialAccounts, mergeItems]);

  /* ── Watchlist management ── */
  const addCompany = useCallback((ticker: string) => {
    const t = ticker.toUpperCase().trim();
    if (!t || watchlist.find((c) => c.id === t)) return;
    setWatchlist((prev) => [...prev, { id: t, ticker: t, name: TICKER_NAMES[t] ?? t, addedAt: Date.now() }]);
  }, [watchlist]);

  const removeCompany = useCallback((ticker: string) => {
    setWatchlist((prev) => prev.filter((c) => c.id !== ticker));
  }, []);

  const reorderCompany = useCallback((from: number, to: number) => {
    setWatchlist((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }, []);

  const saveCompanyList = useCallback((name: string) => {
    const entry: SavedWatchlist = { id: Date.now().toString(), name, tickers: watchlist.map((c) => c.ticker), createdAt: Date.now() };
    setSavedLists((prev) => { const next = [...prev, entry]; lsSave(LS_SAVED, next); return next; });
  }, [watchlist]);

  const loadCompanyList = useCallback((list: SavedWatchlist) => {
    setWatchlist(list.tickers.map((t) => ({ id: t, ticker: t, name: TICKER_NAMES[t] ?? t, addedAt: Date.now() })));
  }, []);

  const deleteCompanyList = useCallback((id: string) => {
    setSavedLists((prev) => { const next = prev.filter((l) => l.id !== id); lsSave(LS_SAVED, next); return next; });
  }, []);

  /* ── Social account management ── */
  const addSocial = useCallback((handle: string) => {
    const h = handle.toLowerCase().replace(/^@/, "").trim();
    if (!h || socialAccounts.find((a) => a.id === h)) return;
    const account: SocialAccount = { id: h, handle: h, displayName: `@${h}`, category: "other", linkedTickers: [], enabled: true, addedAt: Date.now() };
    setSocialAccounts((prev) => [...prev, account]);
  }, [socialAccounts]);

  const removeSocial = useCallback((handle: string) => {
    setSocialAccounts((prev) => prev.filter((a) => a.handle.toLowerCase() !== handle.toLowerCase()));
  }, []);

  const toggleSocial = useCallback((handle: string) => {
    setSocialAccounts((prev) =>
      prev.map((a) => a.handle.toLowerCase() === handle.toLowerCase() ? { ...a, enabled: !a.enabled } : a)
    );
  }, []);

  const saveSocialList = useCallback((name: string) => {
    const entry: SavedSocialList = {
      id: Date.now().toString(), name,
      handles: socialAccounts.filter((a) => a.enabled).map((a) => a.handle),
      createdAt: Date.now(),
    };
    setSocialSaved((prev) => { const next = [...prev, entry]; lsSave(LS_SOCIAL_SAVED, next); return next; });
  }, [socialAccounts]);

  const loadSocialList = useCallback((list: SavedSocialList) => {
    setSocialAccounts((prev) => {
      const existing = prev.filter((a) => !list.handles.includes(a.handle));
      const loaded: SocialAccount[] = list.handles.map((h) => {
        const known = prev.find((a) => a.handle === h);
        return known ? { ...known, enabled: true } : { id: h, handle: h, displayName: `@${h}`, category: "other" as const, linkedTickers: [], enabled: true, addedAt: Date.now() };
      });
      return [...loaded, ...existing];
    });
  }, []);

  const deleteSocialList = useCallback((id: string) => {
    setSocialSaved((prev) => { const next = prev.filter((l) => l.id !== id); lsSave(LS_SOCIAL_SAVED, next); return next; });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ("Notification" in window) {
      const perm = await Notification.requestPermission();
      if (perm === "granted") setAlerts((prev) => ({ ...prev, browserNotifications: true }));
    }
  }, []);

  const filtered = applyFilters(news, filters);

  /* ── Source type quick-filter shortcuts ── */
  const activeSourceFilter = filters.sourceTypes.length === 1 ? filters.sourceTypes[0] : null;

  function setSourceQuickFilter(type: SourceType | null) {
    setFilters((prev) => ({ ...prev, sourceTypes: type ? [type] : [] }));
  }

  /* ────────────── Tracker Mode overlay ──────────────────────────────── */
  if (trackerMode) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex h-9 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            LIVE
          </span>
          <span className="text-xs text-muted">|</span>
          <div className="flex items-center gap-1.5 overflow-hidden">
            {watchlist.slice(0, 8).map((c) => (
              <span key={c.id} className="shrink-0 rounded bg-card px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                {c.ticker}
              </span>
            ))}
            {socialAccounts.filter((a) => a.enabled).slice(0, 4).map((a) => (
              <span key={a.id} className="shrink-0 rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                @{a.handle}
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            {connected ? <Wifi className="h-3.5 w-3.5 text-positive" /> : <WifiOff className="h-3.5 w-3.5 text-negative animate-pulse" />}
            {newCount > 0 && (
              <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">
                +{newCount}
              </span>
            )}
            <button onClick={() => setTrackerMode(false)} className="rounded p-1 text-muted hover:bg-card hover:text-foreground" title="Exit Tracker Mode">
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <NewsFeed items={filtered} watchlist={watchlist} isLoading={isLoading} compact />
        </div>
      </div>
    );
  }

  /* ────────────── Normal 3-panel layout ─────────────────────────────── */
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Top bar */}
      <div className="flex h-11 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
        <div className="flex items-center gap-2">
          <Radio className={cn("h-4 w-4", connected ? "text-positive animate-pulse" : "text-muted")} />
          <span className="text-sm font-semibold text-foreground">News Tracker</span>
          {connected ? (
            <span className="rounded-full bg-positive/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-positive">Live</span>
          ) : (
            <span className="rounded-full bg-negative/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-negative animate-pulse">Reconnecting</span>
          )}
        </div>

        {lastUpdate && (
          <span className="text-[11px] text-muted">Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
        )}
        {newCount > 0 && (
          <span className="rounded bg-accent/20 px-2 py-0.5 text-xs font-bold text-accent">+{newCount} new</span>
        )}

        {/* Quick source-type filters */}
        <div className="ml-4 flex items-center gap-1">
          {(
            [
              { label: "All",    type: null        as SourceType | null },
              { label: "News",   type: "news"      as SourceType },
              { label: "Social", type: "social"    as SourceType },
              { label: "SEC",    type: "sec"        as SourceType },
              { label: "PR",     type: "press_release" as SourceType },
            ] as { label: string; type: SourceType | null }[]
          ).map(({ label, type }) => (
            <button
              key={label}
              onClick={() => setSourceQuickFilter(type)}
              className={cn(
                "rounded px-2 py-0.5 text-[10px] font-medium transition-colors",
                (type === null ? !activeSourceFilter : activeSourceFilter === type)
                  ? "bg-accent/20 text-accent"
                  : "bg-card text-muted hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setAlerts((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
            className={cn(
              "flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium transition-colors",
              alerts.soundEnabled ? "bg-accent/15 text-accent" : "bg-card text-muted hover:text-foreground",
            )}
          >
            {alerts.soundEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {alerts.soundEnabled ? "Sound On" : "Muted"}
          </button>
          <button
            onClick={() => setTrackerMode(true)}
            className="flex items-center gap-1.5 rounded bg-card px-2.5 py-1 text-xs font-medium text-muted transition-colors hover:bg-accent/15 hover:text-accent"
          >
            <Minimize2 className="h-3.5 w-3.5" />
            Tracker Mode
          </button>
        </div>
      </div>

      {/* 3-column body */}
      <div className="flex min-h-0 flex-1 divide-x divide-border overflow-hidden">
        {/* Left: Company + Social panels (scrollable together) */}
        <div className="w-56 shrink-0 overflow-y-auto bg-surface">
          <CompanyPanel
            watchlist={watchlist}
            savedLists={savedLists}
            onAdd={addCompany}
            onRemove={removeCompany}
            onReorder={reorderCompany}
            onSaveList={saveCompanyList}
            onLoadList={loadCompanyList}
            onDeleteList={deleteCompanyList}
            filters={filters}
            onFiltersChange={setFilters}
          />
          <SocialPanel
            accounts={socialAccounts}
            savedLists={socialSaved}
            onAdd={addSocial}
            onRemove={removeSocial}
            onToggle={toggleSocial}
            onSaveList={saveSocialList}
            onLoadList={loadSocialList}
            onDeleteList={deleteSocialList}
          />
        </div>

        {/* Center: Unified live feed */}
        <div className="min-w-0 flex-1 overflow-hidden bg-background">
          <NewsFeed items={filtered} watchlist={watchlist} isLoading={isLoading} compact={false} />
        </div>

        {/* Right: Filters & Alerts */}
        <div className="w-56 shrink-0 overflow-y-auto bg-surface">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            alerts={alerts}
            onAlertsChange={setAlerts}
            watchlist={watchlist}
            onRequestNotifications={requestNotificationPermission}
          />
        </div>
      </div>
    </div>
  );
}
