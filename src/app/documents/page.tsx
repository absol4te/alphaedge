"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  UploadCloud,
  FileText,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  X,
  ArrowRight,
  Trash2,
  FolderOpen,
} from "lucide-react";
import { SAMPLE_ANALYSIS } from "@/lib/financials";
import { DocumentAnalysis } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { LogoBadge } from "@/components/ui/logo-badge";
import { CompanyPicker, PickedCompany } from "@/components/company/company-picker";
import { useDocStore, SavedDocument } from "@/store/documents";
import { cn, colorFromString, timeAgo } from "@/lib/utils";

type Phase = "idle" | "analyzing" | "done" | "error";

const STEPS = ["Uploading document", "Parsing financials", "Running Claude analysis", "Generating insights"];

export default function DocumentsPage() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState("");
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<Omit<DocumentAnalysis, "fileName"> | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [company, setCompany] = useState<PickedCompany | null>(null);
  const [linked, setLinked] = useState<PickedCompany | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const documents = useDocStore((s) => s.documents);
  const addDocument = useDocStore((s) => s.addDocument);
  const removeDocument = useDocStore((s) => s.removeDocument);

  const analysis: DocumentAnalysis = {
    ...(result ?? SAMPLE_ANALYSIS),
    fileName: fileName || SAMPLE_ANALYSIS.fileName,
  };

  // Animate the step indicator while the request is in flight (independent of latency).
  const animateSteps = () => {
    setStep(0);
    let s = 0;
    const interval = setInterval(() => {
      s += 1;
      setStep(Math.min(s, STEPS.length - 1));
      if (s >= STEPS.length - 1) clearInterval(interval);
    }, 650);
    return interval;
  };

  const runAnalysis = async (name: string, file?: File) => {
    setFileName(name);
    setPhase("analyzing");
    const interval = animateSteps();
    try {
      const body = new FormData();
      if (file) body.append("file", file);
      const res = await fetch("/api/analyze", { method: "POST", body });
      const json = await res.json();
      clearInterval(interval);
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      setResult(json.data);
      setStep(STEPS.length - 1);
      setPhase("done");

      // Link the document to a company: explicit pick, else auto-detect the
      // ticker from the extracted company name (Step 7 — auto-attachment).
      let target = company;
      if (!target) {
        const guess = (json.data.company || name.replace(/\.[^.]+$/, "")).trim();
        try {
          const sr = await fetch(`/api/search?q=${encodeURIComponent(guess)}`).then((r) => r.json());
          const top = sr.data?.[0];
          if (top) target = { symbol: top.symbol, name: top.name, exchange: top.exchange };
        } catch {
          /* keep null — saved as unlinked */
        }
        if (target) setCompany(target);
      }

      const saved: SavedDocument = {
        id: `doc-${Date.now()}`,
        symbol: target?.symbol ?? "—",
        companyName: target?.name ?? json.data.company ?? "Unknown",
        exchange: target?.exchange ?? "",
        uploadedAt: new Date().toISOString(),
        analysis: { ...json.data, fileName: name || SAMPLE_ANALYSIS.fileName },
      };
      addDocument(saved);
      setLinked(target);
    } catch (e) {
      clearInterval(interval);
      setErrorMsg(e instanceof Error ? e.message : "Something went wrong");
      setPhase("error");
    }
  };

  const onFiles = (files: FileList | null) => {
    if (files && files[0]) runAnalysis(files[0].name, files[0]);
  };

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-5 sm:px-6">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-accent" /> Document Scanner
        </h1>
        <p className="mt-0.5 text-sm text-muted">
          Upload 10-Ks, 10-Qs, earnings reports or investor decks for instant AI-powered analysis.
        </p>
      </div>

      {phase === "idle" && (
        <>
          {/* Step 2 — specify the company this document belongs to */}
          <div className="mb-4">
            <label className="mb-1.5 block text-xs font-medium text-muted">
              Link to company <span className="text-muted/60">(optional — auto-detected from the document if blank)</span>
            </label>
            <CompanyPicker
              value={company}
              onSelect={setCompany}
              onClear={() => setCompany(null)}
            />
          </div>

          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              onFiles(e.dataTransfer.files);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-16 text-center transition-colors",
              dragging ? "border-accent bg-accent/5" : "border-border bg-card hover:border-[#3a3a3a]",
            )}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => onFiles(e.target.files)}
            />
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <UploadCloud className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">Drop your document here</h3>
            <p className="mt-1 text-sm text-muted">or click to browse · PDF up to 32MB · analyzed by Claude</p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {["10-K", "10-Q", "Annual Report", "Earnings", "Investor Deck"].map((t) => (
                <span key={t} className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-muted">
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={() => runAnalysis(SAMPLE_ANALYSIS.fileName)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
            >
              <FileText className="h-4 w-4" /> Try with a sample 10-K
            </button>
          </div>

          {/* Your documents — cross-linked library */}
          {documents.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <FolderOpen className="h-4 w-4 text-accent" /> Your Documents
                <span className="rounded bg-surface px-1.5 text-[10px] text-muted">{documents.length}</span>
              </h2>
              <div className="space-y-1.5">
                {documents.map((d) => (
                  <div
                    key={d.id}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-negative/10">
                      <FileText className="h-4.5 w-4.5 h-[18px] w-[18px] text-negative" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{d.analysis.fileName}</div>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted">
                        <span>{timeAgo(d.uploadedAt)}</span>
                        <span>·</span>
                        <span>{d.analysis.period}</span>
                      </div>
                    </div>
                    {d.symbol !== "—" ? (
                      <Link
                        href={`/statements?symbol=${encodeURIComponent(d.symbol)}&ex=${encodeURIComponent(d.exchange)}`}
                        className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs font-medium transition-colors hover:border-accent/40 hover:text-accent"
                      >
                        <LogoBadge symbol={d.symbol} color={colorFromString(d.symbol)} size={18} />
                        {d.symbol}
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="rounded-lg bg-surface px-2.5 py-1 text-xs text-muted">Unlinked</span>
                    )}
                    <button
                      onClick={() => removeDocument(d.id)}
                      className="rounded p-1.5 text-muted opacity-0 transition-opacity hover:text-negative group-hover:opacity-100"
                      title="Remove"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {phase === "analyzing" && (
        <Card>
          <CardContent className="flex flex-col items-center py-16">
            <Loader2 className="mb-4 h-10 w-10 animate-spin text-accent" />
            <h3 className="text-lg font-semibold">Analyzing {fileName}</h3>
            <div className="mt-6 w-full max-w-sm space-y-2.5">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-3 text-sm">
                  {i < step ? (
                    <CheckCircle2 className="h-4 w-4 text-accent" />
                  ) : i === step ? (
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border border-border" />
                  )}
                  <span className={cn(i <= step ? "text-foreground" : "text-muted")}>{s}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {phase === "error" && (
        <Card className="border-negative/30">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-negative/10">
              <AlertTriangle className="h-6 w-6 text-negative" />
            </div>
            <h3 className="text-lg font-semibold">Couldn&rsquo;t analyze that file</h3>
            <p className="mt-1 max-w-sm text-sm text-muted">{errorMsg}</p>
            <button
              onClick={() => setPhase("idle")}
              className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-dim"
            >
              Try again
            </button>
          </CardContent>
        </Card>
      )}

      {phase === "done" && (
        <AnalysisResult
          analysis={analysis}
          linked={linked}
          onReset={() => {
            setResult(null);
            setLinked(null);
            setCompany(null);
            setPhase("idle");
          }}
        />
      )}
    </div>
  );
}

function AnalysisResult({
  analysis,
  linked,
  onReset,
}: {
  analysis: DocumentAnalysis;
  linked: PickedCompany | null;
  onReset: () => void;
}) {
  return (
    <div className="space-y-5">
      {/* Linked-to-company banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent/[0.07] px-4 py-3">
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle2 className="h-4 w-4 text-accent" />
          {linked ? (
            <span>
              Saved &amp; linked to <span className="font-semibold">{linked.symbol}</span> — {linked.name}
            </span>
          ) : (
            <span className="text-muted">Saved to your library (no company match — link it manually anytime)</span>
          )}
        </div>
        {linked && (
          <Link
            href={`/statements?symbol=${encodeURIComponent(linked.symbol)}&ex=${encodeURIComponent(linked.exchange)}`}
            className="flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-black transition-colors hover:bg-accent-dim"
          >
            View in Financials <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {/* File header */}
      <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-negative/10">
            <FileText className="h-5 w-5 text-negative" />
          </div>
          <div>
            <div className="text-sm font-semibold">{analysis.fileName}</div>
            <div className="text-xs text-muted">
              {analysis.company} · {analysis.period}
            </div>
          </div>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" /> New scan
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {analysis.metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-card p-3">
            <div className="text-[11px] text-muted">{m.label}</div>
            <div className="tabular mt-1 text-base font-semibold">{m.value}</div>
            {m.change && <div className="tabular mt-0.5 text-xs text-positive">{m.change}</div>}
          </div>
        ))}
      </div>

      {/* Executive summary */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-accent" /> Executive Summary
          </h3>
          <p className="text-sm leading-relaxed text-muted">{analysis.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* Takeaways */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 text-sm font-semibold">Key Takeaways</h3>
          <ul className="space-y-2">
            {analysis.keyTakeaways.map((t, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-muted">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {t}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Bull / Bear */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-positive/20">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-positive">
              <TrendingUp className="h-4 w-4" /> Bull Case
            </h3>
            <ul className="space-y-2">
              {analysis.bullCase.map((t, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-positive" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
        <Card className="border-negative/20">
          <CardContent className="p-5">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-negative">
              <TrendingDown className="h-4 w-4" /> Bear Case
            </h3>
            <ul className="space-y-2">
              {analysis.bearCase.map((t, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-muted">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-negative" />
                  {t}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Risks */}
      <Card>
        <CardContent className="p-5">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertTriangle className="h-4 w-4" /> Risk Factors
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {analysis.riskFactors.map((t, i) => (
              <div key={i} className="flex gap-2.5 rounded-lg bg-surface px-3 py-2 text-sm text-muted">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                {t}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
