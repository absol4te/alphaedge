"use client";

import { useState } from "react";
import {
  Building2, Users, CalendarDays, BarChart3, Newspaper,
  Package, Network, AlertTriangle, FlaskConical, Globe,
  FileText, ChevronDown, ExternalLink,
  Twitter, Linkedin, Github, Youtube, Instagram,
  TrendingUp, TrendingDown, Minus, Award, DollarSign,
  Handshake, Tag, Shield, Star, Zap,
} from "lucide-react";
import type { ResearchData, TimelineEvent, Risk } from "@/app/api/research/[query]/route";
import { cn } from "@/lib/utils";

/* ──────────────────── Shared helpers ───────────────────────── */

function Section({
  id, title, icon: Icon, children, defaultOpen = true,
}: {
  id: string;
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section id={id} className="scroll-mt-16 overflow-hidden rounded-xl border border-border bg-card">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-surface"
      >
        <h2 className="flex items-center gap-2.5 text-base font-semibold">
          <Icon className="h-5 w-5 text-accent" />
          {title}
        </h2>
        <ChevronDown
          className={cn("h-4 w-4 text-muted transition-transform duration-200", !open && "-rotate-90")}
        />
      </button>
      {open && <div className="border-t border-border px-5 py-4">{children}</div>}
    </section>
  );
}

function Empty({ label }: { label: string }) {
  return <p className="py-4 text-sm text-muted">{label}</p>;
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("rounded-md px-2 py-0.5 text-[11px] font-medium", className)}>
      {children}
    </span>
  );
}

/* ──────────────── 1. Overview ───────────────────────────────── */

export function OverviewSection({ data }: { data: ResearchData }) {
  const c = data.company;
  return (
    <Section id="overview" title="Company Overview" icon={Building2}>
      {c.description && (
        <p className="mb-4 text-sm leading-relaxed text-foreground/90">{c.description}</p>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "Full Name", value: c.name },
          { label: "Industry", value: c.industry },
          { label: "Sector", value: c.sector },
          { label: "Headquarters", value: c.hq },
          { label: "Founded", value: c.founded },
          { label: "Employees", value: c.employees },
          { label: "Ownership", value: c.type },
          ...(c.ticker ? [{ label: "Ticker", value: `${c.ticker}${c.exchange ? ` · ${c.exchange}` : ""}` }] : []),
          ...(c.website ? [{ label: "Website", value: c.website, link: true }] : []),
        ].map(({ label, value, link }) => (
          <div key={label} className="rounded-lg bg-surface px-3 py-2.5">
            <p className="mb-0.5 text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
            {link ? (
              <a
                href={value.startsWith("http") ? value : `https://${value}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {value.replace(/^https?:\/\//, "")}
                <ExternalLink className="h-3 w-3" />
              </a>
            ) : (
              <p className="text-sm font-medium">{value}</p>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ──────────────── 2. Leadership ─────────────────────────────── */

export function LeadershipSection({ data }: { data: ResearchData }) {
  if (!data.leadership.length) return null;
  return (
    <Section id="leadership" title="Founders & Leadership" icon={Users}>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.leadership.map((l, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4">
            {/* Avatar placeholder */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                {l.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="font-semibold leading-tight">{l.name}</p>
                <p className="text-xs text-muted">{l.role}</p>
              </div>
            </div>

            {l.bio && (
              <p className="text-xs leading-relaxed text-foreground/80 line-clamp-4">{l.bio}</p>
            )}

            {l.previous.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {l.previous.map((p) => (
                  <Badge key={p} className="bg-card text-muted">{p}</Badge>
                ))}
              </div>
            )}

            {l.education && (
              <p className="text-[11px] text-muted">{l.education}</p>
            )}

            {l.achievements.length > 0 && (
              <ul className="space-y-0.5">
                {l.achievements.slice(0, 3).map((a, j) => (
                  <li key={j} className="flex items-start gap-1.5 text-[11px] text-muted">
                    <Star className="mt-px h-3 w-3 shrink-0 text-accent/60" />
                    {a}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ──────────────── 3. Timeline ───────────────────────────────── */

const TIMELINE_CONFIG: Record<
  TimelineEvent["type"],
  { color: string; bg: string; icon: React.ElementType }
> = {
  founding:    { color: "text-positive",  bg: "bg-positive/10",  icon: Star },
  funding:     { color: "text-info",      bg: "bg-info/10",      icon: DollarSign },
  ipo:         { color: "text-purple-400", bg: "bg-purple-400/10", icon: TrendingUp },
  acquisition: { color: "text-orange-400", bg: "bg-orange-400/10", icon: Handshake },
  product:     { color: "text-cyan-400",  bg: "bg-cyan-400/10",  icon: Package },
  scandal:     { color: "text-negative",  bg: "bg-negative/10",  icon: AlertTriangle },
  leadership:  { color: "text-muted",     bg: "bg-surface",      icon: Users },
  milestone:   { color: "text-accent",    bg: "bg-accent/10",    icon: Award },
};

export function TimelineSection({ data }: { data: ResearchData }) {
  if (!data.timeline.length) return null;
  const events = [...data.timeline].sort((a, b) => a.year.localeCompare(b.year));
  return (
    <Section id="timeline" title="Company History Timeline" icon={CalendarDays}>
      <div className="relative pl-8">
        {/* Vertical line */}
        <div className="absolute left-3 top-1 h-full w-px bg-border" />

        <div className="space-y-5">
          {events.map((e, i) => {
            const cfg = TIMELINE_CONFIG[e.type] ?? TIMELINE_CONFIG.milestone;
            const Icon = cfg.icon;
            return (
              <div key={i} className="relative">
                {/* Icon dot */}
                <div
                  className={cn(
                    "absolute -left-5 flex h-6 w-6 items-center justify-center rounded-full",
                    cfg.bg,
                  )}
                >
                  <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                </div>

                <div className="flex items-start gap-3">
                  <span className="shrink-0 rounded bg-surface px-1.5 py-0.5 text-[11px] font-bold text-muted tabular-nums">
                    {e.year}
                  </span>
                  <div>
                    <p className="text-sm">{e.event}</p>
                    <Badge className={cn("mt-1", cfg.bg, cfg.color)}>
                      {e.type.charAt(0).toUpperCase() + e.type.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

/* ──────────────── 4. Financials ─────────────────────────────── */

export function FinancialsSection({ data }: { data: ResearchData }) {
  const { funding, shareholders } = data;
  const isPublic = data.company.type === "Public";

  const hasMetrics = funding.marketCap || funding.enterpriseValue || funding.shareCount || funding.debtLevel;
  const hasRounds = funding.rounds.length > 0;
  const hasValuation = funding.latestValuation || funding.totalRaised;

  return (
    <Section id="financials" title={isPublic ? "Financials & Ownership" : "Funding & Capital"} icon={BarChart3}>
      {/* Public company key metrics */}
      {isPublic && hasMetrics && (
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Market Cap", value: funding.marketCap },
            { label: "Enterprise Value", value: funding.enterpriseValue },
            { label: "Shares Outstanding", value: funding.shareCount },
            { label: "Total Debt", value: funding.debtLevel },
          ].filter((x) => x.value).map(({ label, value }) => (
            <div key={label} className="rounded-lg bg-surface px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
              <p className="mt-0.5 text-lg font-bold">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Private company valuations */}
      {!isPublic && hasValuation && (
        <div className="mb-5 flex flex-wrap gap-3">
          {funding.latestValuation && (
            <div className="rounded-lg bg-surface px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muted">Latest Valuation</p>
              <p className="mt-0.5 text-lg font-bold">{funding.latestValuation}</p>
            </div>
          )}
          {funding.totalRaised && (
            <div className="rounded-lg bg-surface px-3 py-2.5">
              <p className="text-[11px] uppercase tracking-wide text-muted">Total Raised</p>
              <p className="mt-0.5 text-lg font-bold">{funding.totalRaised}</p>
            </div>
          )}
        </div>
      )}

      <div className={cn("grid gap-5", shareholders.length > 0 ? "lg:grid-cols-2" : "")}>
        {/* Funding rounds */}
        {hasRounds && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Funding Rounds
            </h3>
            <div className="space-y-2">
              {funding.rounds.map((r, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-info/10">
                    <DollarSign className="h-3.5 w-3.5 text-info" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{r.name}</span>
                      <span className="text-xs text-muted">{r.date}</span>
                    </div>
                    {r.investors.length > 0 && (
                      <p className="truncate text-[11px] text-muted">{r.investors.join(", ")}</p>
                    )}
                  </div>
                  {r.amount && (
                    <span className="shrink-0 text-sm font-bold text-positive">{r.amount}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shareholders */}
        {shareholders.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              {isPublic ? "Major Shareholders" : "Key Investors"}
            </h3>
            <div className="space-y-2">
              {shareholders.slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface border border-border text-xs font-bold text-muted">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    <Badge
                      className={cn(
                        s.type === "institutional" ? "bg-info/10 text-info" :
                        s.type === "insider" ? "bg-accent/10 text-accent" :
                        s.type === "vc" ? "bg-purple-400/10 text-purple-400" :
                        "bg-surface text-muted"
                      )}
                    >
                      {s.type}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-sm font-bold">{s.stake}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Acquisitions */}
      {data.acquisitions.length > 0 && (
        <div className="mt-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Acquisitions & Subsidiaries
          </h3>
          <div className="grid gap-2 sm:grid-cols-2">
            {data.acquisitions.map((a, i) => (
              <div key={i} className="flex items-start gap-3 rounded-lg bg-surface px-3 py-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-400/10">
                  <Handshake className="h-3.5 w-3.5 text-orange-400" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{a.company}</span>
                    <span className="text-xs text-muted">{a.year}</span>
                    {a.value && <span className="text-xs font-medium text-positive">{a.value}</span>}
                  </div>
                  {a.notes && <p className="text-[11px] text-muted">{a.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!hasMetrics && !hasRounds && !hasValuation && shareholders.length === 0 && (
        <Empty label="Financial data not available for this company." />
      )}
    </Section>
  );
}

/* ──────────────── 5. News ───────────────────────────────────── */

export function NewsSection({ data }: { data: ResearchData }) {
  if (!data.news.length) return null;
  return (
    <Section id="news" title="Latest News" icon={Newspaper}>
      <div className="divide-y divide-border/60">
        {data.news.map((n, i) => (
          <div key={i} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <a
                  href={n.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold leading-snug hover:text-accent"
                >
                  {n.title}
                </a>
                {n.summary && n.summary !== n.title && (
                  <p className="mt-0.5 text-xs text-muted line-clamp-2">{n.summary}</p>
                )}
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
                  <span className="font-medium">{n.source}</span>
                  {n.date && <span>· {n.date}</span>}
                </div>
              </div>
              {n.url && n.url !== "#" && (
                <a href={n.url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted hover:text-accent">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ──────────────── 6. Products ───────────────────────────────── */

export function ProductsSection({ data }: { data: ResearchData }) {
  if (!data.products.length) return null;
  return (
    <Section id="products" title="Products & Services" icon={Package}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {data.products.map((p, i) => (
          <div key={i} className="rounded-xl border border-border bg-surface p-3.5">
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent/10">
                <Package className="h-3.5 w-3.5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold">{p.name}</p>
                <Badge className="bg-card text-muted">{p.category}</Badge>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-muted">{p.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ──────────────── 7. Competitors ────────────────────────────── */

export function CompetitorsSection({ data }: { data: ResearchData }) {
  if (!data.competitors.length) return null;
  const direct = data.competitors.filter((c) => c.type === "Direct");
  const indirect = data.competitors.filter((c) => c.type === "Indirect");

  const CompetitorCard = ({ c }: { c: ResearchData["competitors"][0] }) => (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card text-xs font-bold text-muted border border-border">
        {c.name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold">{c.name}</span>
          {c.ticker && <span className="text-xs text-muted">({c.ticker})</span>}
          <Badge
            className={cn(
              c.size === "Large" ? "bg-info/10 text-info" :
              c.size === "Medium" ? "bg-accent/10 text-accent" :
              c.size === "Small" ? "bg-surface text-muted" :
              "bg-purple-400/10 text-purple-400"
            )}
          >
            {c.size}
          </Badge>
          <Badge
            className={cn(
              c.type === "Direct" ? "bg-negative/10 text-negative" : "bg-surface text-muted"
            )}
          >
            {c.type}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-muted">{c.description}</p>
      </div>
    </div>
  );

  return (
    <Section id="competitors" title="Competitor Analysis" icon={Network}>
      {direct.length > 0 && (
        <div className="mb-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Direct Competitors
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {direct.map((c, i) => <CompetitorCard key={i} c={c} />)}
          </div>
        </div>
      )}
      {indirect.length > 0 && (
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
            Indirect Competitors
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            {indirect.map((c, i) => <CompetitorCard key={i} c={c} />)}
          </div>
        </div>
      )}
    </Section>
  );
}

/* ──────────────── 8. Risks ──────────────────────────────────── */

const RISK_CONFIG: Record<Risk["severity"], { bg: string; border: string; badge: string; icon: string }> = {
  Critical: { bg: "bg-red-500/5",     border: "border-red-500/30",   badge: "bg-red-500/15 text-red-400",    icon: "text-red-400" },
  High:     { bg: "bg-orange-500/5",  border: "border-orange-500/30", badge: "bg-orange-500/15 text-orange-400", icon: "text-orange-400" },
  Medium:   { bg: "bg-yellow-500/5",  border: "border-yellow-500/20", badge: "bg-yellow-500/15 text-yellow-400", icon: "text-yellow-400" },
  Low:      { bg: "bg-surface",        border: "border-border",         badge: "bg-surface text-muted",           icon: "text-muted" },
};

export function RisksSection({ data }: { data: ResearchData }) {
  if (!data.risks.length) return null;
  const ordered: Risk["severity"][] = ["Critical", "High", "Medium", "Low"];
  const sorted = [...data.risks].sort(
    (a, b) => ordered.indexOf(a.severity) - ordered.indexOf(b.severity),
  );

  return (
    <Section id="risks" title="Risks & Red Flags" icon={AlertTriangle}>
      <div className="grid gap-3 sm:grid-cols-2">
        {sorted.map((r, i) => {
          const cfg = RISK_CONFIG[r.severity];
          return (
            <div
              key={i}
              className={cn("rounded-xl border p-4", cfg.bg, cfg.border)}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("h-4 w-4 shrink-0", cfg.icon)} />
                  <span className="text-sm font-semibold">{r.title}</span>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <Badge className={cfg.badge}>{r.severity}</Badge>
                  <Badge className="bg-surface text-muted">{r.category}</Badge>
                </div>
              </div>
              <p className="text-xs leading-relaxed text-muted">{r.description}</p>
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/* ──────────────── 9. Patents & Market ───────────────────────── */

export function PatentsMarketSection({ data }: { data: ResearchData }) {
  const { patents, market } = data;
  const hasPatents = patents.count && patents.count !== "Unknown";
  const hasMarket = market.share && market.share !== "Unknown";

  if (!hasPatents && !hasMarket) return null;

  return (
    <Section id="patents" title="Patents, IP & Market Position" icon={FlaskConical}>
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Patents */}
        {hasPatents && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Intellectual Property
            </h3>
            <div className="rounded-xl bg-surface p-4">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <FlaskConical className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-xl font-bold">{patents.count}</p>
                  <p className="text-xs text-muted">Estimated patents</p>
                </div>
              </div>
              {patents.key.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-[11px] font-medium uppercase text-muted">Key Patents & Technologies</p>
                  <ul className="space-y-1">
                    {patents.key.map((k, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Zap className="mt-px h-3 w-3 shrink-0 text-accent/60" />
                        {k}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {patents.trademarks.length > 0 && (
                <div>
                  <p className="mb-1.5 text-[11px] font-medium uppercase text-muted">Trademarks</p>
                  <div className="flex flex-wrap gap-1.5">
                    {patents.trademarks.map((t) => (
                      <Badge key={t} className="bg-card text-muted">
                        <span className="flex items-center gap-1">
                          <Tag className="h-2.5 w-2.5" /> {t}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Market position */}
        {hasMarket && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Market Position
            </h3>
            <div className="space-y-3">
              {(market.share !== "Unknown" || market.rank !== "Unknown") && (
                <div className="grid grid-cols-2 gap-3">
                  {market.share !== "Unknown" && (
                    <div className="rounded-xl bg-surface p-3.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted">Market Share</p>
                      <p className="mt-0.5 text-base font-bold">{market.share}</p>
                    </div>
                  )}
                  {market.rank !== "Unknown" && (
                    <div className="rounded-xl bg-surface p-3.5">
                      <p className="text-[11px] uppercase tracking-wide text-muted">Industry Rank</p>
                      <p className="mt-0.5 text-base font-bold">{market.rank}</p>
                    </div>
                  )}
                </div>
              )}

              {market.advantages.length > 0 && (
                <div className="rounded-xl bg-positive/5 border border-positive/20 p-3.5">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-positive">
                    <TrendingUp className="h-3 w-3" /> Competitive Advantages
                  </p>
                  <ul className="space-y-1">
                    {market.advantages.map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Shield className="mt-px h-3 w-3 shrink-0 text-positive/60" />
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {market.weaknesses.length > 0 && (
                <div className="rounded-xl bg-negative/5 border border-negative/20 p-3.5">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-negative">
                    <TrendingDown className="h-3 w-3" /> Competitive Weaknesses
                  </p>
                  <ul className="space-y-1">
                    {market.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        <Minus className="mt-px h-3 w-3 shrink-0 text-negative/60" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}

/* ──────────────── 10. Social ────────────────────────────────── */

const SOCIAL_LINKS = [
  {
    key: "website" as const,
    label: "Website",
    icon: Globe,
    format: (v: string) => (v.startsWith("http") ? v : `https://${v}`),
    display: (v: string) => v.replace(/^https?:\/\//, ""),
  },
  {
    key: "twitter" as const,
    label: "X / Twitter",
    icon: Twitter,
    format: (v: string) => `https://x.com/${v.replace(/^@/, "")}`,
    display: (v: string) => v.startsWith("@") ? v : `@${v}`,
  },
  {
    key: "linkedin" as const,
    label: "LinkedIn",
    icon: Linkedin,
    format: (v: string) => v.startsWith("http") ? v : `https://linkedin.com/company/${v}`,
    display: (v: string) => v,
  },
  {
    key: "github" as const,
    label: "GitHub",
    icon: Github,
    format: (v: string) => v.startsWith("http") ? v : `https://github.com/${v}`,
    display: (v: string) => v,
  },
  {
    key: "youtube" as const,
    label: "YouTube",
    icon: Youtube,
    format: (v: string) => v.startsWith("http") ? v : `https://youtube.com/@${v}`,
    display: (v: string) => v,
  },
  {
    key: "instagram" as const,
    label: "Instagram",
    icon: Instagram,
    format: (v: string) => v.startsWith("http") ? v : `https://instagram.com/${v.replace(/^@/, "")}`,
    display: (v: string) => v.startsWith("@") ? v : `@${v}`,
  },
];

export function SocialSection({ data }: { data: ResearchData }) {
  const { social } = data;
  const visible = SOCIAL_LINKS.filter(({ key }) => social[key]);
  if (!visible.length) return null;

  return (
    <Section id="social" title="Web & Social Presence" icon={Globe}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map(({ key, label, icon: Icon, format, display }) => {
          const val = social[key] as string;
          const href = format(val);
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors hover:border-accent/40 hover:bg-card"
            >
              <Icon className="h-5 w-5 shrink-0 text-muted" />
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-muted">{label}</p>
                <p className="truncate text-sm font-medium">{display(val)}</p>
              </div>
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted/50" />
            </a>
          );
        })}
      </div>
    </Section>
  );
}

/* ──────────────── 11. AI Research Summary ───────────────────── */

export function SummarySection({ data }: { data: ResearchData }) {
  const { summary } = data;
  if (!summary.what && !summary.strengths.length) return null;

  return (
    <Section id="summary" title="AI Research Summary" icon={FileText}>
      {/* What / Why */}
      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        {summary.what && (
          <div className="rounded-xl bg-surface p-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              What They Do
            </p>
            <p className="text-sm leading-relaxed">{summary.what}</p>
          </div>
        )}
        {summary.why && (
          <div className="rounded-xl bg-surface p-4">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
              Why It Matters
            </p>
            <p className="text-sm leading-relaxed">{summary.why}</p>
          </div>
        )}
      </div>

      {/* SWOT grid */}
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        {[
          {
            label: "Strengths",
            items: summary.strengths,
            color: "text-positive",
            bg: "bg-positive/5 border-positive/20",
            icon: TrendingUp,
          },
          {
            label: "Weaknesses",
            items: summary.weaknesses,
            color: "text-negative",
            bg: "bg-negative/5 border-negative/20",
            icon: TrendingDown,
          },
          {
            label: "Opportunities",
            items: summary.opportunities,
            color: "text-info",
            bg: "bg-info/5 border-info/20",
            icon: Zap,
          },
          {
            label: "Key Risks",
            items: summary.risks,
            color: "text-orange-400",
            bg: "bg-orange-400/5 border-orange-400/20",
            icon: AlertTriangle,
          },
        ].filter((q) => q.items.length > 0).map(({ label, items, color, bg, icon: Icon }) => (
          <div key={label} className={cn("rounded-xl border p-4", bg)}>
            <p className={cn("mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide", color)}>
              <Icon className="h-3 w-3" /> {label}
            </p>
            <ul className="space-y-1.5">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                  <span className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", color.replace("text-", "bg-"))} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Recent developments */}
      {summary.developments && (
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">
            Recent Developments
          </p>
          <p className="text-sm leading-relaxed">{summary.developments}</p>
        </div>
      )}
    </Section>
  );
}
