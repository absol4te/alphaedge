"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BadgeDollarSign, Loader2, TrendingUp, TrendingDown, CalendarClock, FileText } from "lucide-react";
import { CompanyPicker, PickedCompany } from "@/components/company/company-picker";
import { EARNINGS } from "@/lib/mock-data";
import { LogoBadge } from "@/components/ui/logo-badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn, colorFromString } from "@/lib/utils";

interface Report {
  reportType: "Q1" | "Q2" | "Q3" | "Q4" | "Annual";
  fiscalPeriod: string;
  dateReleased: string;
  revenue: string;
  revenueExpected: string;
  eps: string;
  epsExpected: string;
  netIncome: string;
  guidance: string;
  keyHighlights: string[];
  marketReaction: string;
  source: string;
  impactScore: number;
}
interface EarningsData {
  company: string;
  ticker: string;
  reports: Report[];
}

const POPULAR = [
  { symbol: "AAPL", name: "Apple Inc.", exchange: "NASDAQ" },
  { symbol: "NVDA", name: "NVIDIA Corporation", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corporation", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com, Inc.", exchange: "NASDAQ" },
  { symbol: "TSLA", name: "Tesla, Inc.", exchange: "NASDAQ" },
];

function num(s: string): number | null {
  const m = (s || "").replace(/[, ]/g, "").match(/-?\$?([\d.]+)/);
  return m ? parseFloat(m[1]) : null;
}
function epsSurprise(actual: string, expected: string): number | null {
  const a = num(actual);
  const e = num(expected);
  if (a == null || e == null || e === 0) return null;
  return ((a - e) / Math.abs(e)) * 100;
}

export default function EarningsPage() {
  return (
    <Suspense fallback={null}>
      <EarningsInner />
    </Suspense>
  );
}

function EarningsInner() {
  const params = useSearchParams();
  const initSym = params.get("symbol");
  const [company, setCompany] = useState<PickedCompany | null>(
    initSym
      ? { symbol: initSym.toUpperCase(), name: params.get("name") || initSym.toUpperCase(), exchange: "" }
      : null,
  );
  const [year, setYear] = useState("all");
  const [quarter, setQuarter] = useState("all");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["earnings", company?.symbol],
    enabled: !!company,
    staleTime: 60 * 60 * 1000,
    retry: false,
    queryFn: async (): Promise<{ available: boolean; reason?: string; sourced?: string; data?: EarningsData }> => {
      const res = await fetch(`/api/earnings/${company!.symbol}?name=${encodeURIComponent(company!.name)}`);
      return res.json();
    },
  });

  const errorMsg =
    data?.reason === "credits"
      ? "Anthropic API credit balance is too low. Add credits in Plans & Billing, then pick the company again."
      : data?.reason === "ratelimit"
        ? "Hit the Anthropic API rate limit. Wait a moment and pick the company again."
        : data?.reason === "nokey"
          ? "Set ANTHROPIC_API_KEY in .env.local to enable earnings extraction."
          : "Couldn't extract earnings — try the company again.";

  const reports = useMemo(() => {
    const r = data?.data?.reports ?? [];
    return [...r].sort(
      (a, b) =>
        +new Date(b.dateReleased) - +new Date(a.dateReleased) || (b.impactScore ?? 0) - (a.impactScore ?? 0),
    );
  }, [data]);

  const years = useMemo(
    () => ["all", ...Array.from(new Set(reports.map((r) => (r.dateReleased || "").slice(0, 4)).filter(Boolean)))],
    [reports],
  );
  const filtered = reports.filter(
    (r) =>
      (year === "all" || (r.dateReleased || "").startsWith(year)) &&
      (quarter === "all" || r.reportType === quarter),
  );

  return (
    <div className="mx-auto max-w-[1100px] px-4 py-5 sm:px-6">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <BadgeDollarSign className="h-6 w-6 text-accent" /> Earnings
        </h1>
        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted">
          Reported results only
        </span>
      </div>
      <p className="mb-4 text-sm text-muted">
        A clean, structured earnings database. Search any company for its reported quarterly &amp; annual results —
        no previews, no opinion, no general news.
      </p>

      {/* Search */}
      <div className="mb-3 max-w-md">
        <CompanyPicker
          value={company}
          onSelect={(c) => {
            setCompany(c);
            setYear("all");
            setQuarter("all");
          }}
          onClear={() => setCompany(null)}
          placeholder="Search a company's earnings…"
        />
      </div>
      {!company && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Popular:</span>
          {POPULAR.map((p) => (
            <button
              key={p.symbol}
              onClick={() => setCompany(p)}
              className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted transition-colors hover:text-foreground"
            >
              {p.symbol}
            </button>
          ))}
        </div>
      )}

      {/* Empty state: upcoming earnings calendar */}
      {!company && (
        <div>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <CalendarClock className="h-4 w-4 text-accent" /> Upcoming Earnings
          </h2>
          <div className="divide-y divide-border/60 rounded-xl border border-border bg-card">
            {EARNINGS.map((e) => (
              <button
                key={e.symbol}
                onClick={() => setCompany({ symbol: e.symbol, name: e.name, exchange: "NASDAQ" })}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
              >
                <LogoBadge symbol={e.symbol} color={e.logoColor} size={30} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{e.symbol}</div>
                  <div className="text-[11px] text-muted">{e.name}</div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-medium">{e.date}</div>
                  <div className="text-muted">EPS est. ${e.epsEstimate.toFixed(2)}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {company && isLoading && (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-6 text-sm text-muted">
          <Loader2 className="h-5 w-5 animate-spin text-accent" />
          Detecting &amp; extracting {company.name}&rsquo;s reported earnings…
        </div>
      )}

      {/* Error / unavailable */}
      {company && !isLoading && (isError || (data && !data.available)) && (
        <div className="rounded-xl border border-warning/30 bg-warning/[0.06] p-6 text-sm text-muted">
          {errorMsg}
        </div>
      )}

      {/* Results */}
      {company && !isLoading && data?.available && (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-base font-semibold">
              {data.data?.company} <span className="text-muted">({data.data?.ticker})</span> · Earnings History
            </h2>
            {data.sourced && (
              <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] text-muted">
                {data.sourced === "web" ? "Live sources" : "Model knowledge"}
              </span>
            )}
            <div className="ml-auto flex items-center gap-1.5">
              <Filter value={quarter} onChange={setQuarter} opts={["all", "Q1", "Q2", "Q3", "Q4", "Annual"]} />
              <Filter value={year} onChange={setYear} opts={years} />
            </div>
          </div>

          <div className="space-y-3">
            {filtered.map((r, i) => (
              <ReportCard key={`${r.fiscalPeriod}-${i}`} r={r} />
            ))}
            {filtered.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center text-sm text-muted">
                No reported earnings match these filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function ReportCard({ r }: { r: Report }) {
  const surprise = epsSurprise(r.eps, r.epsExpected);
  const beat = surprise != null && surprise >= 0;
  const prominent = (r.impactScore ?? 0) > 60;

  return (
    <Card className={cn("overflow-hidden", prominent && "border-accent/30")}>
      <CardContent className="p-4">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-accent/15 px-2 py-0.5 text-xs font-bold text-accent">
            {r.reportType === "Annual" ? "Annual" : r.reportType}
          </span>
          <span className="text-sm font-semibold">{r.fiscalPeriod}</span>
          <span className="text-xs text-muted">· Released {r.dateReleased}</span>
          {r.impactScore != null && (
            <span
              className={cn(
                "tabular ml-auto rounded px-1.5 py-0.5 text-[11px] font-bold",
                r.impactScore >= 80 ? "bg-positive/15 text-positive" : r.impactScore > 60 ? "bg-info/15 text-info" : "bg-muted/10 text-muted",
              )}
              title="Impact score (0–100)"
            >
              Impact {r.impactScore}
              {r.impactScore > 80 && " · Market Moving"}
            </span>
          )}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metric label="Revenue" value={r.revenue} sub={r.revenueExpected ? `est. ${r.revenueExpected}` : undefined} />
          <Metric
            label="EPS"
            value={r.eps}
            sub={r.epsExpected ? `est. ${r.epsExpected}` : undefined}
            badge={
              surprise != null
                ? { text: `${beat ? "Beat" : "Miss"} ${surprise >= 0 ? "+" : ""}${surprise.toFixed(1)}%`, beat }
                : undefined
            }
          />
          <Metric label="Net Income" value={r.netIncome || "—"} />
        </div>

        {r.guidance && (
          <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
            <span className="font-semibold text-foreground">Guidance: </span>
            {r.guidance}
          </p>
        )}

        {r.keyHighlights?.length > 0 && (
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
            {r.keyHighlights.map((h, i) => (
              <li key={i} className="flex gap-2 text-xs text-muted">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {h}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted">
          {r.marketReaction && (
            <span className="flex items-center gap-1">
              {/beat|up|\+|surg|jump|rose|gain/i.test(r.marketReaction) ? (
                <TrendingUp className="h-3 w-3 text-positive" />
              ) : (
                <TrendingDown className="h-3 w-3 text-negative" />
              )}
              {r.marketReaction}
            </span>
          )}
          {r.source && (
            <span className="ml-auto flex items-center gap-1">
              <FileText className="h-3 w-3" /> {r.source}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  sub,
  badge,
}: {
  label: string;
  value: string;
  sub?: string;
  badge?: { text: string; beat: boolean };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="tabular mt-0.5 text-lg font-bold">{value || "—"}</div>
      <div className="flex items-center gap-2">
        {sub && <span className="text-[10px] text-muted">{sub}</span>}
        {badge && (
          <span className={cn("rounded px-1 text-[10px] font-semibold", badge.beat ? "bg-positive/10 text-positive" : "bg-negative/10 text-negative")}>
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}

function Filter({ value, onChange, opts }: { value: string; onChange: (v: string) => void; opts: string[] }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-muted focus:outline-none"
    >
      {opts.map((o) => (
        <option key={o} value={o}>
          {o === "all" ? "All" : o}
        </option>
      ))}
    </select>
  );
}
