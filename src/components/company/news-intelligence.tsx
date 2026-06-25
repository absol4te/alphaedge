"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import {
  Newspaper,
  Wand2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  Rocket,
  Sparkles,
  Search,
  ArrowUpRight,
  Globe,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Sentiment = "bullish" | "neutral" | "bearish";
type Impact = "Low" | "Medium" | "High" | "Critical";

interface Article {
  headline: string;
  source: string;
  date: string;
  sentiment: Sentiment;
  impact: Impact;
  category: string;
  summary: string;
  url: string;
}
interface Brief {
  overallSentiment: Sentiment;
  sentimentScore: number;
  trend7d: string;
  trend30d: string;
  sentimentHistory?: { date: string; score: number }[];
  brief: string;
  themes: string[];
  emergingRisks: string[];
  emergingOpportunities: string[];
  forwardLook: { revenue: string; earnings: string; cashFlow: string; valuation: string };
  statementImpact: { statement: string; note: string }[];
  articles: Article[];
  timeline: { date: string; title: string; type: string }[];
}

const sentimentMeta: Record<Sentiment, { cls: string; Icon: typeof TrendingUp; label: string }> = {
  bullish: { cls: "bg-positive/10 text-positive", Icon: TrendingUp, label: "Bullish" },
  bearish: { cls: "bg-negative/10 text-negative", Icon: TrendingDown, label: "Bearish" },
  neutral: { cls: "bg-muted/10 text-muted", Icon: Minus, label: "Neutral" },
};
const impactMeta: Record<Impact, string> = {
  Low: "bg-muted/10 text-muted",
  Medium: "bg-info/10 text-info",
  High: "bg-warning/15 text-warning",
  Critical: "bg-negative/15 text-negative",
};

export function NewsIntelligence({
  symbol,
  name,
  exchange,
}: {
  symbol: string;
  name: string;
  exchange: string;
}) {
  const [started, setStarted] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["news-analysis", symbol],
    queryFn: async (): Promise<{ available: boolean; sourced?: string; data?: Brief }> => {
      const res = await fetch(`/api/news-analysis/${symbol}?name=${encodeURIComponent(name)}`);
      return res.json();
    },
    enabled: started,
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  const header = (
    <div className="flex items-center gap-2 border-b border-border px-4 py-3">
      <Newspaper className="h-4 w-4 text-accent" />
      <h2 className="text-sm font-semibold">News Intelligence</h2>
      {data?.sourced && (
        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted">
          {data.sourced === "web" ? "Live web sources" : "Model knowledge"}
        </span>
      )}
      <span className="ml-auto text-[10px] text-muted">Claude · Sonnet 4.5</span>
    </div>
  );

  return (
    <Card className="overflow-hidden">
      {header}

      {!started && (
        <CardContent className="flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:text-left">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
            <Wand2 className="h-5 w-5 text-accent" />
          </div>
          <p className="flex-1 text-sm text-muted">
            Aggregate recent coverage of <span className="font-medium text-foreground">{name}</span> from Reuters,
            AP, BBC, the Guardian, NPR, DW &amp; France24 into a research brief — sentiment, impact scoring,
            themes, risks, statement impact and a forward read.
          </p>
          <button
            onClick={() => setStarted(true)}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-dim active:scale-[0.98]"
          >
            <Wand2 className="h-4 w-4" /> Analyze News
          </button>
        </CardContent>
      )}

      {started && isLoading && (
        <CardContent className="flex items-center gap-3 p-6 text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          Reading recent coverage across Reuters, AP, BBC, the Guardian, NPR, DW &amp; France24…
        </CardContent>
      )}

      {started && (isError || (data && !data.available)) && (
        <CardContent className="p-6 text-sm text-muted">
          Couldn&rsquo;t complete the news analysis. Ensure <code className="rounded bg-surface px-1.5 py-0.5 text-xs text-foreground">ANTHROPIC_API_KEY</code> is set, then try again.
          <button onClick={() => setStarted(false)} className="ml-2 font-medium text-accent hover:underline">
            Reset
          </button>
        </CardContent>
      )}

      {started && data?.available && data.data && (
        <Result brief={data.data} symbol={symbol} exchange={exchange} />
      )}
    </Card>
  );
}

function Result({ brief, symbol, exchange }: { brief: Brief; symbol: string; exchange: string }) {
  const [sent, setSent] = useState<"all" | Sentiment>("all");
  const [imp, setImp] = useState<"all" | Impact>("all");
  const [src, setSrc] = useState("all");
  const [cat, setCat] = useState("all");
  const [kw, setKw] = useState("");

  const sources = useMemo(
    () => ["all", ...Array.from(new Set(brief.articles.map((a) => a.source)))],
    [brief.articles],
  );
  const categories = useMemo(
    () => ["all", ...Array.from(new Set(brief.articles.map((a) => a.category).filter(Boolean)))],
    [brief.articles],
  );
  const filtered = brief.articles.filter(
    (a) =>
      (sent === "all" || a.sentiment === sent) &&
      (imp === "all" || a.impact === imp) &&
      (src === "all" || a.source === src) &&
      (cat === "all" || a.category === cat) &&
      (!kw || `${a.headline} ${a.summary}`.toLowerCase().includes(kw.toLowerCase())),
  );

  const om = sentimentMeta[brief.overallSentiment];
  const score = Math.max(0, Math.min(100, brief.sentimentScore));

  return (
    <CardContent className="space-y-5 p-5">
      {/* Sentiment + brief */}
      <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="text-[11px] uppercase tracking-wide text-muted">Overall sentiment</div>
          <div className={cn("mt-1 flex items-center gap-1.5 text-lg font-bold", om.cls.split(" ")[1])}>
            <om.Icon className="h-5 w-5" /> {om.label}
          </div>
          <div className="relative mt-3 h-2 rounded-full">
            <div
              className="absolute inset-0 rounded-full opacity-70"
              style={{ background: "linear-gradient(to right,#FF3B5C,#A0A0A0,#00C853)" }}
            />
            <div
              className="absolute top-1/2 h-3.5 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-foreground"
              style={{ left: `${score}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-muted">
            <span>Bearish</span>
            <span className="tabular font-semibold text-foreground">{score}/100</span>
            <span>Bullish</span>
          </div>
          <div className="mt-3 flex gap-2 text-[11px]">
            <Trend label="7D" v={brief.trend7d} />
            <Trend label="30D" v={brief.trend30d} />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> Research Brief
          </h3>
          <p className="text-sm leading-relaxed text-muted">{brief.brief}</p>
        </div>
      </div>

      {/* Sentiment history */}
      {brief.sentimentHistory && brief.sentimentHistory.length > 1 && (
        <SentimentHistory points={brief.sentimentHistory} />
      )}

      {/* Themes / Risks / Opportunities */}
      <div className="grid gap-4 md:grid-cols-3">
        <Listing icon={Sparkles} color="text-accent" title="Recurring Themes" items={brief.themes} />
        <Listing icon={AlertTriangle} color="text-warning" title="Emerging Risks" items={brief.emergingRisks} />
        <Listing icon={Rocket} color="text-info" title="Opportunities" items={brief.emergingOpportunities} />
      </div>

      {/* Forward look */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">Forward Read</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(["revenue", "earnings", "cashFlow", "valuation"] as const).map((k) => (
            <div key={k} className="rounded-lg border border-border bg-surface p-3">
              <div className="text-[10px] uppercase tracking-wide text-accent">
                {k === "cashFlow" ? "Cash Flow" : k}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted">{brief.forwardLook[k]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Statement impact */}
      {brief.statementImpact?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Financial Statement Impact</h3>
          <div className="space-y-2">
            {brief.statementImpact.map((s, i) => (
              <Link
                key={i}
                href={`/statements?symbol=${encodeURIComponent(symbol)}&ex=${encodeURIComponent(exchange)}`}
                className="flex items-start gap-2.5 rounded-lg border border-info/25 bg-info/[0.06] p-3 transition-colors hover:border-info/40"
              >
                <span className="mt-0.5 rounded bg-info/15 px-1.5 py-0.5 text-[10px] font-semibold text-info">
                  {s.statement}
                </span>
                <span className="flex-1 text-xs text-muted">{s.note}</span>
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-info" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      {brief.timeline?.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Event Timeline</h3>
          <div className="relative space-y-3 border-l border-border pl-4">
            {brief.timeline.map((t, i) => (
              <div key={i} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-accent" />
                <div className="text-[11px] text-muted">{t.date}</div>
                <div className="text-sm">{t.title}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Articles + filters */}
      <div>
        {/* Category tabs */}
        {categories.length > 1 && (
          <div className="no-scrollbar mb-3 flex gap-1.5 overflow-x-auto border-b border-border pb-2">
            {categories.map((c) => {
              const count = c === "all" ? brief.articles.length : brief.articles.filter((a) => a.category === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={cn(
                    "flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors",
                    cat === c
                      ? "bg-accent text-black"
                      : "border border-border bg-card text-muted hover:text-foreground",
                  )}
                >
                  {c === "all" ? "All News" : c}
                  <span className={cn("rounded px-1 text-[10px]", cat === c ? "bg-black/15" : "bg-surface")}>{count}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h3 className="text-sm font-semibold">Articles</h3>
          <span className="rounded bg-surface px-1.5 text-[10px] text-muted">{filtered.length}</span>
          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <Select value={sent} onChange={(v) => setSent(v as typeof sent)} opts={["all", "bullish", "neutral", "bearish"]} />
            <Select value={imp} onChange={(v) => setImp(v as typeof imp)} opts={["all", "Low", "Medium", "High", "Critical"]} />
            <Select value={src} onChange={setSrc} opts={sources} />
            <div className="flex items-center gap-1 rounded-md border border-border bg-surface px-2">
              <Search className="h-3 w-3 text-muted" />
              <input
                value={kw}
                onChange={(e) => setKw(e.target.value)}
                placeholder="keyword"
                className="w-20 bg-transparent py-1 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {filtered.map((a, i) => {
            const sm = sentimentMeta[a.sentiment];
            return (
              <a
                key={i}
                href={a.url || undefined}
                target={a.url ? "_blank" : undefined}
                rel="noreferrer"
                className={cn(
                  "block rounded-xl border border-border bg-card p-3 transition-colors",
                  a.url && "hover:border-[#3a3a3a]",
                )}
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className="flex items-center gap-1 text-xs font-semibold text-accent">
                    <Globe className="h-3 w-3" /> {a.source}
                  </span>
                  <span className="text-[11px] text-muted">· {a.date}</span>
                  <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted">{a.category}</span>
                  <span className={cn("ml-auto rounded px-1.5 py-0.5 text-[10px] font-medium", sm.cls)}>
                    {sm.label}
                  </span>
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-semibold", impactMeta[a.impact])}>
                    {a.impact}
                  </span>
                </div>
                <div className="text-sm font-semibold leading-snug">{a.headline}</div>
                <p className="mt-0.5 text-xs text-muted">{a.summary}</p>
              </a>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">No articles match these filters.</p>
          )}
        </div>
      </div>
    </CardContent>
  );
}

function SentimentHistory({ points }: { points: { date: string; score: number }[] }) {
  const W = 1000;
  const H = 120;
  const PAD = 8;
  const n = points.length;
  const xs = (i: number) => PAD + (i / (n - 1)) * (W - 2 * PAD);
  const ys = (s: number) => H - PAD - (Math.max(0, Math.min(100, s)) / 100) * (H - 2 * PAD);
  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(1)},${ys(p.score).toFixed(1)}`).join(" ");
  const area = `${line} L${xs(n - 1).toFixed(1)},${H - PAD} L${xs(0).toFixed(1)},${H - PAD} Z`;
  const last = points[n - 1].score;
  const first = points[0].score;
  const color = last >= first ? "#00C853" : "#FF3B5C";
  const mid = ys(50);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Sentiment History</h3>
        <span className="tabular text-xs text-muted">
          {first.toFixed(0)} → <span className="font-semibold text-foreground">{last.toFixed(0)}</span> / 100
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-28 w-full">
        <defs>
          <linearGradient id="sent-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* neutral midline */}
        <line x1={PAD} x2={W - PAD} y1={mid} y2={mid} stroke="#A0A0A0" strokeWidth="1" strokeDasharray="4 4" opacity="0.4" />
        <path d={area} fill="url(#sent-grad)" />
        <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        <circle cx={xs(n - 1)} cy={ys(last)} r="4" fill={color} stroke="#0A0A0A" strokeWidth="2" />
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-muted">
        <span>{points[0].date}</span>
        <span className="text-muted/70">— neutral (50) —</span>
        <span>{points[n - 1].date}</span>
      </div>
    </div>
  );
}

function Trend({ label, v }: { label: string; v: string }) {
  const up = /improv/i.test(v);
  const down = /deterior/i.test(v);
  return (
    <span
      className={cn(
        "flex items-center gap-1 rounded px-1.5 py-0.5 font-medium",
        up ? "bg-positive/10 text-positive" : down ? "bg-negative/10 text-negative" : "bg-muted/10 text-muted",
      )}
    >
      {label} {up ? "▲" : down ? "▼" : "▬"}
    </span>
  );
}

function Listing({
  icon: Icon,
  color,
  title,
  items,
}: {
  icon: typeof Sparkles;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h4 className={cn("mb-2 flex items-center gap-1.5 text-xs font-semibold", color)}>
        <Icon className="h-3.5 w-3.5" /> {title}
      </h4>
      <ul className="space-y-1.5">
        {(items ?? []).map((t, i) => (
          <li key={i} className="flex gap-2 text-xs text-muted">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
            {t}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Select({
  value,
  onChange,
  opts,
}: {
  value: string;
  onChange: (v: string) => void;
  opts: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs capitalize text-muted focus:outline-none"
    >
      {opts.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}
