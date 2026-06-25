"use client";

import { Bell, BellOff, Volume2, VolumeX, Search, X, Clock, Radio, Twitter, FileText, Building } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterState, AlertSettings, TrackedCompany, Impact, Sentiment, SourceType } from "@/lib/tracker/types";

interface Props {
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  alerts: AlertSettings;
  onAlertsChange: (a: AlertSettings) => void;
  watchlist: TrackedCompany[];
  onRequestNotifications: () => void;
}

/* ─── Checkbox ─── */
function Check({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 py-0.5">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          "flex h-3.5 w-3.5 items-center justify-center rounded-sm border text-[8px] transition-colors",
          checked ? "border-accent bg-accent/20 text-accent" : "border-border bg-transparent text-transparent",
        )}
      >
        ✓
      </div>
      <span className="text-[11px] text-foreground/80">{label}</span>
    </label>
  );
}

/* ─── Section header ─── */
function SectionHead({ label }: { label: string }) {
  return (
    <div className="border-b border-border px-3 pb-1.5 pt-3">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</span>
    </div>
  );
}

export function FilterPanel({ filters, onFiltersChange, alerts, onAlertsChange, watchlist, onRequestNotifications }: Props) {

  function toggleImpact(v: Impact) {
    const next = filters.impact.includes(v) ? filters.impact.filter((i) => i !== v) : [...filters.impact, v];
    onFiltersChange({ ...filters, impact: next });
  }

  function toggleSentiment(v: Sentiment) {
    const next = filters.sentiment.includes(v) ? filters.sentiment.filter((s) => s !== v) : [...filters.sentiment, v];
    onFiltersChange({ ...filters, sentiment: next });
  }

  function toggleSourceType(v: SourceType) {
    const next = filters.sourceTypes.includes(v) ? filters.sourceTypes.filter((s) => s !== v) : [...filters.sourceTypes, v];
    onFiltersChange({ ...filters, sourceTypes: next });
  }

  function toggleTrigger(key: keyof AlertSettings["triggers"]) {
    onAlertsChange({ ...alerts, triggers: { ...alerts.triggers, [key]: !alerts.triggers[key] } });
  }

  const TIME_OPTIONS: { value: FilterState["timeRange"]; label: string }[] = [
    { value: "1h", label: "1 Hour" }, { value: "4h", label: "4 Hours" },
    { value: "today", label: "Today" }, { value: "week", label: "This Week" },
    { value: "all", label: "All Time" },
  ];

  const IMPACT_OPTIONS: { value: Impact; label: string; dot: string }[] = [
    { value: "Critical", label: "Critical", dot: "bg-red-400" },
    { value: "High",     label: "High",     dot: "bg-orange-400" },
    { value: "Medium",   label: "Medium",   dot: "bg-yellow-400" },
    { value: "Low",      label: "Low",      dot: "bg-muted" },
  ];

  const SENTIMENT_OPTIONS: { value: Sentiment; label: string; sym: string; cls: string }[] = [
    { value: "Bullish", label: "Bullish", sym: "▲", cls: "text-positive" },
    { value: "Bearish", label: "Bearish", sym: "▼", cls: "text-negative" },
    { value: "Neutral", label: "Neutral", sym: "●", cls: "text-muted" },
  ];

  const SOURCE_OPTIONS: { value: SourceType; label: string; icon: React.FC<{ className?: string }>; cls: string }[] = [
    { value: "news",          label: "News",          icon: Radio,    cls: "text-muted" },
    { value: "social",        label: "Social (X)",    icon: Twitter,  cls: "text-blue-400" },
    { value: "sec",           label: "SEC Filings",   icon: FileText, cls: "text-orange-400" },
    { value: "press_release", label: "Press Releases",icon: Building, cls: "text-purple-400" },
    { value: "regulatory",    label: "Regulatory",    icon: FileText, cls: "text-red-400" },
  ];

  const allSourcesOn = filters.sourceTypes.length === 0;

  return (
    <div className="flex h-full flex-col text-sm">
      <div className="border-b border-border px-3 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">Filters & Alerts</span>
      </div>

      {/* Search */}
      <div className="border-b border-border px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted" />
          <input
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search headlines, handles…"
            className="h-7 w-full rounded bg-card pl-6 pr-6 text-[11px] text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-accent/50"
          />
          {filters.searchQuery && (
            <button onClick={() => onFiltersChange({ ...filters, searchQuery: "" })} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Source Type */}
        <SectionHead label="Source Type" />
        <div className="px-3 py-1.5">
          <button
            onClick={() => onFiltersChange({ ...filters, sourceTypes: [] })}
            className={cn(
              "mb-1.5 flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] transition-colors",
              allSourcesOn ? "bg-accent/15 text-accent" : "bg-card text-muted hover:text-foreground",
            )}
          >
            All Sources
          </button>
          {SOURCE_OPTIONS.map(({ value, label, icon: Icon, cls }) => (
            <div key={value} className="flex items-center gap-2 py-0.5">
              <Check
                checked={allSourcesOn || filters.sourceTypes.includes(value)}
                onChange={() => {
                  if (allSourcesOn) {
                    // First click: enable all except this one (inverted — show only this)
                    onFiltersChange({ ...filters, sourceTypes: [value] });
                  } else {
                    toggleSourceType(value);
                  }
                }}
                label=""
              />
              <Icon className={cn("h-3 w-3 shrink-0", cls)} />
              <span className="text-[11px] text-foreground/80">{label}</span>
            </div>
          ))}
        </div>

        {/* Impact */}
        <SectionHead label="Impact" />
        <div className="px-3 py-1.5">
          {IMPACT_OPTIONS.map(({ value, label, dot }) => (
            <div key={value} className="flex items-center gap-2 py-0.5">
              <Check checked={filters.impact.includes(value)} onChange={() => toggleImpact(value)} label="" />
              <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", dot)} />
              <span className="text-[11px] text-foreground/80">{label}</span>
            </div>
          ))}
          <button
            onClick={() => onFiltersChange({ ...filters, showBreakingOnly: !filters.showBreakingOnly })}
            className={cn(
              "mt-2 flex w-full items-center gap-2 rounded px-2 py-1 text-[10px] font-medium transition-colors",
              filters.showBreakingOnly ? "bg-red-500/20 text-red-400" : "bg-card text-muted hover:text-foreground",
            )}
          >
            ⚡ Breaking only
          </button>
        </div>

        {/* Sentiment */}
        <SectionHead label="Sentiment" />
        <div className="px-3 py-1.5">
          {SENTIMENT_OPTIONS.map(({ value, label, sym, cls }) => (
            <div key={value} className="flex items-center gap-2 py-0.5">
              <Check checked={filters.sentiment.includes(value)} onChange={() => toggleSentiment(value)} label="" />
              <span className={cn("text-[11px] font-bold shrink-0", cls)}>{sym}</span>
              <span className="text-[11px] text-foreground/80">{label}</span>
            </div>
          ))}
        </div>

        {/* Time Range */}
        <SectionHead label="Time Range" />
        <div className="px-3 py-1.5">
          {TIME_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => onFiltersChange({ ...filters, timeRange: value })}
              className={cn(
                "flex w-full items-center gap-2 rounded px-2 py-1 text-[11px] transition-colors",
                filters.timeRange === value ? "bg-accent/15 text-accent" : "text-foreground/70 hover:bg-card hover:text-foreground",
              )}
            >
              <Clock className="h-3 w-3 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Alerts */}
        <SectionHead label="Alerts" />
        <div className="space-y-1.5 px-3 py-2">
          <button
            onClick={() => onAlertsChange({ ...alerts, soundEnabled: !alerts.soundEnabled })}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] font-medium transition-colors",
              alerts.soundEnabled ? "bg-accent/15 text-accent" : "bg-card text-muted hover:text-foreground",
            )}
          >
            {alerts.soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            {alerts.soundEnabled ? "Sound On" : "Sound Off"}
          </button>
          <button
            onClick={() => {
              if (!alerts.browserNotifications) { onRequestNotifications(); }
              else { onAlertsChange({ ...alerts, browserNotifications: false }); }
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] font-medium transition-colors",
              alerts.browserNotifications ? "bg-accent/15 text-accent" : "bg-card text-muted hover:text-foreground",
            )}
          >
            {alerts.browserNotifications ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
            {alerts.browserNotifications ? "Notifications On" : "Notify Me"}
          </button>
        </div>

        {/* Alert triggers */}
        <div className="px-3 pb-1">
          <p className="mb-1 text-[10px] text-muted">Alert me for:</p>
          {(
            [
              { key: "critical",      label: "Critical news" },
              { key: "earnings",      label: "Earnings" },
              { key: "acquisitions",  label: "M&A / Acquisitions" },
              { key: "guidance",      label: "Guidance changes" },
              { key: "regulatory",    label: "Regulatory / SEC" },
              { key: "leadership",    label: "Leadership changes" },
              { key: "socialBreaking",label: "Breaking social posts" },
            ] as { key: keyof AlertSettings["triggers"]; label: string }[]
          ).map(({ key, label }) => (
            <Check key={key} checked={alerts.triggers[key]} onChange={() => toggleTrigger(key)} label={label} />
          ))}
        </div>

        {/* Reset */}
        <div className="border-t border-border px-3 py-3">
          <button
            onClick={() => onFiltersChange({
              impact: ["Critical", "High", "Medium", "Low"],
              sentiment: ["Bullish", "Bearish", "Neutral"],
              tickers: [],
              sourceTypes: [],
              timeRange: "today",
              showBreakingOnly: false,
              searchQuery: "",
            })}
            className="w-full rounded bg-card px-3 py-1.5 text-[11px] text-muted transition-colors hover:bg-card/80 hover:text-foreground"
          >
            Reset All Filters
          </button>
        </div>
      </div>
    </div>
  );
}
