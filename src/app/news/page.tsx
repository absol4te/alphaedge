"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Newspaper,
  RefreshCw,
  Radio,
  Briefcase,
  Cpu,
  Globe2,
  Flame,
  Search,
  ShieldCheck,
} from "lucide-react";
import type { Story } from "@/lib/news/aggregate";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, timeAgo } from "@/lib/utils";

interface Feed {
  updatedAt: string;
  live: boolean;
  sections: { top: Story[]; breaking: Story[]; business: Story[]; technology: Story[]; world: Story[] };
}

const tierLabel = (t: number) => (t === 1 ? "Tier 1" : t === 2 ? "Tier 2" : "Tier 3");
const tierDot = (t: number) => (t === 1 ? "bg-positive" : t === 2 ? "bg-info" : "bg-muted");

export default function NewsPage() {
  const { data, isLoading, isFetching, dataUpdatedAt, refetch } = useQuery({
    queryKey: ["world-news"],
    queryFn: async (): Promise<Feed> => {
      const res = await fetch("/api/world-news");
      if (!res.ok) throw new Error("news fetch failed");
      return res.json();
    },
    refetchInterval: 90_000, // continuously re-rank & refresh
    refetchOnWindowFocus: true,
    staleTime: 45_000,
  });

  const s = data?.sections;

  return (
    <div className="mx-auto max-w-[1300px] px-4 py-5 sm:px-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Newspaper className="h-6 w-6 text-accent" /> Newsroom
          </h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <span className={cn("h-1.5 w-1.5 rounded-full", data?.live ? "animate-pulse-dot bg-positive" : "bg-muted")} />
              {data?.live ? "Live · Reuters-grade ranking" : "Sample feed"}
            </span>
            {dataUpdatedAt > 0 && <span>· updated {timeAgo(new Date(dataUpdatedAt))}</span>}
            <span className="flex items-center gap-1 text-[11px]">
              <ShieldCheck className="h-3 w-3 text-positive" /> BBC · DW · Guardian · NPR · France 24
            </span>
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
        >
          <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} /> Refresh
        </button>
      </div>

      {isLoading && <LoadingGrid />}

      {!isLoading && s && (
        <div className="space-y-7">
          {/* SECTION 1 — Top Stories */}
          <section>
            <SectionTitle icon={Flame} title="Top Stories" note="Ranked by global, economic & political significance" />
            {s.top.length > 0 ? (
              <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
                <FeatureStory story={s.top[0]} rank={1} />
                <div className="divide-y divide-border/60 rounded-xl border border-border bg-card">
                  {s.top.slice(1).map((st, i) => (
                    <RankedRow key={st.id} story={st} rank={i + 2} />
                  ))}
                </div>
              </div>
            ) : (
              <Empty />
            )}
          </section>

          {/* SECTION 2 — Breaking */}
          <section>
            <SectionTitle icon={Radio} title="Breaking News" note="Developing in the last 24 hours · stale stories auto-removed" />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {s.breaking.map((st) => (
                <StoryCard key={st.id} story={st} breaking />
              ))}
            </div>
          </section>

          {/* SECTIONS 3-5 */}
          <div className="grid gap-6 lg:grid-cols-3">
            <ColumnSection icon={Briefcase} title="Business & Markets" stories={s.business} />
            <ColumnSection icon={Cpu} title="Technology" stories={s.technology} />
            <ColumnSection icon={Globe2} title="World" stories={s.world} />
          </div>

          {/* SECTION 6 — Company-specific */}
          <Link
            href="/search"
            className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-card p-4 transition-colors hover:border-accent/40"
          >
            <Search className="h-5 w-5 text-accent" />
            <div className="flex-1">
              <div className="text-sm font-semibold">Company-specific news</div>
              <div className="text-xs text-muted">
                Search any company for its earnings, filings, analyst updates and AI news intelligence.
              </div>
            </div>
            <span className="text-sm font-medium text-accent">Search →</span>
          </Link>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ icon: Icon, title, note }: { icon: typeof Flame; title: string; note: string }) {
  return (
    <div className="mb-3 flex items-baseline gap-2">
      <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
        <Icon className="h-4 w-4 text-accent" /> {title}
      </h2>
      <span className="hidden text-[11px] text-muted sm:inline">· {note}</span>
    </div>
  );
}

function SourceLine({ story }: { story: Story }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
      <span className={cn("h-1.5 w-1.5 rounded-full", tierDot(story.source.tier))} title={tierLabel(story.source.tier)} />
      <span className="font-semibold text-accent">{story.source.name}</span>
      {story.confirming.length > 0 && (
        <span className="text-muted" title={story.confirming.join(", ")}>
          +{story.confirming.length} confirming
        </span>
      )}
      <span className="text-muted">· {timeAgo(story.publishedAt)}</span>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "tabular rounded px-1.5 py-0.5 text-[10px] font-bold",
        score >= 85 ? "bg-positive/15 text-positive" : score >= 75 ? "bg-info/15 text-info" : "bg-warning/15 text-warning",
      )}
      title="Relevance score (0–100)"
    >
      {score}
    </span>
  );
}

function FeatureStory({ story, rank }: { story: Story; rank: number }) {
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-[#3a3a3a]"
    >
      <div className="mb-2 flex items-center justify-between">
        <SourceLine story={story} />
        <div className="flex items-center gap-1.5">
          <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">#{rank}</span>
          <ScoreBadge score={story.score} />
        </div>
      </div>
      <h3 className="text-xl font-bold leading-tight group-hover:text-accent">{story.headline}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{story.summary}</p>
      <div className="mt-3 rounded-lg bg-surface px-3 py-2 text-xs text-muted">
        <span className="font-semibold text-foreground">Why it matters: </span>
        {story.whyItMatters}
      </div>
    </a>
  );
}

function RankedRow({ story, rank }: { story: Story; rank: number }) {
  return (
    <a href={story.url} target="_blank" rel="noreferrer" className="group flex gap-3 p-3 transition-colors hover:bg-surface">
      <span className="text-lg font-bold tabular text-muted">{rank}</span>
      <div className="min-w-0 flex-1">
        <SourceLine story={story} />
        <h4 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug group-hover:text-accent">{story.headline}</h4>
      </div>
      <ScoreBadge score={story.score} />
    </a>
  );
}

function StoryCard({ story, breaking }: { story: Story; breaking?: boolean }) {
  return (
    <a
      href={story.url}
      target="_blank"
      rel="noreferrer"
      className={cn(
        "group flex flex-col rounded-xl border bg-card p-3 transition-colors hover:border-[#3a3a3a]",
        breaking ? "border-negative/20" : "border-border",
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        <SourceLine story={story} />
        <ScoreBadge score={story.score} />
      </div>
      <h4 className="line-clamp-2 text-sm font-semibold leading-snug group-hover:text-accent">{story.headline}</h4>
      <p className="mt-1 line-clamp-2 text-xs text-muted">{story.summary}</p>
    </a>
  );
}

function ColumnSection({ icon, title, stories }: { icon: typeof Flame; title: string; stories: Story[] }) {
  return (
    <section>
      <h2 className="mb-3 flex items-center gap-2 text-base font-semibold tracking-tight">
        {(() => {
          const Icon = icon;
          return <Icon className="h-4 w-4 text-accent" />;
        })()}
        {title}
      </h2>
      <div className="space-y-2">
        {stories.length > 0 ? (
          stories.map((st) => <StoryCard key={st.id} story={st} />)
        ) : (
          <Empty />
        )}
      </div>
    </section>
  );
}

function Empty() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 text-center text-sm text-muted">
      No qualifying stories right now.
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-3 rounded-xl border border-border bg-card p-3">
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
