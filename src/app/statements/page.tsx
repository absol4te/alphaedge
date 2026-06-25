"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileSpreadsheet, FileText, ArrowUpRight, Database } from "lucide-react";
import { COMPANIES } from "@/lib/mock-data";
import { TradingViewWidget } from "@/components/tradingview/tv-widget";
import { tvSymbol } from "@/lib/tradingview";
import { CompanyPicker } from "@/components/company/company-picker";
import { useDocStore } from "@/store/documents";
import { Card } from "@/components/ui/card";
import { cn, timeAgo } from "@/lib/utils";

export default function StatementsPage() {
  return (
    <Suspense fallback={null}>
      <StatementsInner />
    </Suspense>
  );
}

function StatementsInner() {
  const params = useSearchParams();
  const initSymbol = (params.get("symbol") ?? "AAPL").toUpperCase();
  const initEx = params.get("ex") ?? COMPANIES.find((c) => c.symbol === initSymbol)?.exchange ?? "NASDAQ";

  const [symbol, setSymbol] = useState(initSymbol);
  const [exchange, setExchange] = useState(initEx);

  const allDocs = useDocStore((s) => s.documents);
  const docs = useMemo(
    () =>
      allDocs
        .filter((d) => d.symbol.toUpperCase() === symbol.toUpperCase())
        .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    [allDocs, symbol],
  );

  const tv = exchange ? `${exchange}:${symbol}` : tvSymbol(symbol);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileSpreadsheet className="h-6 w-6 text-accent" /> Financial Statements
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Real-time fundamentals for any company, merged with your uploaded documents.
          </p>
        </div>
        <div className="w-full sm:w-80">
          <CompanyPicker
            placeholder="Jump to any company…"
            onSelect={(c) => {
              setSymbol(c.symbol.toUpperCase());
              setExchange(c.exchange);
            }}
          />
        </div>
      </div>

      {/* Popular quick-picks */}
      <div className="no-scrollbar mb-5 flex items-center gap-1.5 overflow-x-auto">
        {COMPANIES.map((c) => (
          <button
            key={c.symbol}
            onClick={() => {
              setSymbol(c.symbol);
              setExchange(c.exchange);
            }}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-1.5 text-sm font-semibold transition-colors",
              symbol === c.symbol
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-card text-muted hover:text-foreground",
            )}
          >
            {c.symbol}
          </button>
        ))}
      </div>

      {/* ── SECTION B: USER UPLOADED DOCUMENTS (supplementary) ── */}
      <DocumentSourceSection symbol={symbol} docs={docs} />

      {/* ── SECTION A: REPORTED (OFFICIAL) — API baseline ── */}
      <div className="mb-2 flex items-center gap-2">
        <Database className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold">Reported (Official)</h2>
        <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-medium text-muted">
          API · Income · Balance Sheet · Cash Flow · 10Y / 40Q / TTM
        </span>
      </div>
      <Card className="overflow-hidden">
        <TradingViewWidget
          widget="financials"
          height={830}
          config={{ symbol: tv, displayMode: "regular", largeChartUrl: "", width: "100%" }}
        />
      </Card>
    </div>
  );
}

function DocumentSourceSection({
  symbol,
  docs,
}: {
  symbol: string;
  docs: ReturnType<typeof useDocStore.getState>["documents"];
}) {
  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center gap-2">
        <FileText className="h-4 w-4 text-info" />
        <h2 className="text-sm font-semibold">Source: User Uploaded Documents</h2>
        <span className="rounded bg-info/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-info">
          Document Source
        </span>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-info/30 bg-info/[0.04] px-4 py-5 text-sm text-muted">
          No documents linked to <span className="font-medium text-foreground">{symbol}</span> yet.{" "}
          <Link href="/documents" className="font-medium text-info hover:underline">
            Upload one in the Scanner
          </Link>{" "}
          and it will appear here, separate from the official financials below.
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => (
            <div
              key={d.id}
              className="rounded-xl border border-info/30 bg-info/[0.06] p-4 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.06)]"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-info/15">
                    <FileText className="h-4.5 w-4.5 h-[18px] w-[18px] text-info" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{d.analysis.fileName}</div>
                    <div className="text-[11px] text-muted">
                      Uploaded {timeAgo(d.uploadedAt)} · {d.analysis.period}
                    </div>
                  </div>
                </div>
                <Link
                  href="/documents"
                  className="flex items-center gap-1 text-xs font-medium text-info hover:underline"
                >
                  Open in Scanner <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>

              {/* Extracted metrics — labeled "From Uploaded Document" */}
              {d.analysis.metrics.length > 0 && (
                <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                  {d.analysis.metrics.map((m) => (
                    <div key={m.label} className="rounded-lg border border-info/20 bg-background/40 p-2.5">
                      <div className="text-[10px] uppercase tracking-wide text-info/80">{m.label}</div>
                      <div className="tabular mt-0.5 text-sm font-semibold">{m.value}</div>
                      {m.change && <div className="tabular text-[11px] text-positive">{m.change}</div>}
                    </div>
                  ))}
                </div>
              )}

              {d.analysis.executiveSummary && (
                <p className="line-clamp-3 text-xs leading-relaxed text-muted">
                  <span className="font-medium text-foreground">Extracted commentary: </span>
                  {d.analysis.executiveSummary}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
