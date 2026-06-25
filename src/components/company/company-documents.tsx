"use client";

import { useMemo } from "react";
import Link from "next/link";
import { FileText, Plus, ArrowUpRight } from "lucide-react";
import { useDocStore } from "@/store/documents";
import { Card } from "@/components/ui/card";
import { timeAgo } from "@/lib/utils";

export function CompanyDocuments({ symbol, exchange }: { symbol: string; exchange: string }) {
  const all = useDocStore((s) => s.documents);
  const docs = useMemo(
    () =>
      all
        .filter((d) => d.symbol.toUpperCase() === symbol.toUpperCase())
        .sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt)),
    [all, symbol],
  );

  const statementsHref = `/statements?symbol=${encodeURIComponent(symbol)}&ex=${encodeURIComponent(exchange)}`;
  const latest = docs[0];

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm font-semibold">
        <FileText className="h-4 w-4 text-info" /> Documents
        <span className="rounded bg-surface px-1.5 text-[10px] text-muted">{docs.length}</span>
        <Link href="/documents" className="ml-auto text-muted transition-colors hover:text-accent" title="Add document">
          <Plus className="h-4 w-4" />
        </Link>
      </div>

      {latest ? (
        <div className="p-3">
          <Link
            href={statementsHref}
            className="flex items-center gap-2.5 rounded-lg border border-info/25 bg-info/[0.06] p-2.5 transition-colors hover:border-info/40"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-info/15">
              <FileText className="h-4 w-4 text-info" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{latest.analysis.fileName}</div>
              <div className="text-[10px] text-muted">Uploaded {timeAgo(latest.uploadedAt)}</div>
            </div>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-info" />
          </Link>
          {docs.length > 1 && (
            <Link
              href={statementsHref}
              className="mt-2 block text-center text-[11px] text-muted hover:text-foreground"
            >
              View all {docs.length} documents in Financials
            </Link>
          )}
        </div>
      ) : (
        <div className="p-4 text-xs text-muted">
          No documents yet.{" "}
          <Link href="/documents" className="font-medium text-info hover:underline">
            Upload one
          </Link>{" "}
          to attach analyst notes, filings or reports to {symbol}.
        </div>
      )}
    </Card>
  );
}
