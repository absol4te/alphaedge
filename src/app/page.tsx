import {
  Newspaper,
  Flame,
  CalendarClock,
  Grid3x3,
  BarChart3,
  Rocket,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { MarketOverview } from "@/components/dashboard/market-overview";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { Movers } from "@/components/dashboard/movers";
import { Heatmap } from "@/components/dashboard/heatmap";
import { EconomicCalendar, EarningsList, IPOList } from "@/components/dashboard/calendars";
import { SectionHeader } from "@/components/dashboard/section-header";
import { Card, CardContent } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-[1600px] px-4 py-5 sm:px-6">
      {/* Hero */}
      <div className="mb-5">
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Markets Overview</h1>
            <p className="mt-0.5 text-sm text-muted">
              Live snapshot across equities, crypto &amp; commodities ·{" "}
              <span className="text-positive">Markets open</span>
            </p>
          </div>
        </div>
        <MarketOverview />
      </div>

      {/* Featured analysis banner */}
      <Card className="mb-5 overflow-hidden border-accent/20 bg-gradient-to-r from-accent/[0.07] to-transparent">
        <CardContent className="flex flex-col items-start gap-4 p-5 sm:flex-row sm:items-center">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15">
            <Sparkles className="h-5 w-5 text-accent" />
          </div>
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                Featured Analysis
              </span>
              <span className="text-[11px] text-muted">AlphaEdge Research</span>
            </div>
            <h3 className="text-base font-semibold">
              AI Capex Super-Cycle: Why semiconductor demand has further to run in 2026
            </h3>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted">
              Hyperscaler buildouts, sovereign AI and inference economics point to durable
              accelerator demand despite stretched valuations.
            </p>
          </div>
          <Link
            href="/company/NVDA"
            className="flex shrink-0 items-center gap-1 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-accent-dim"
          >
            Read <ArrowUpRight className="h-4 w-4" />
          </Link>
        </CardContent>
      </Card>

      {/* Main grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Left + center: news */}
        <div className="lg:col-span-2">
          <SectionHeader icon={Newspaper} title="Breaking News" />
          <NewsFeed />
        </div>

        {/* Right rail */}
        <div className="space-y-5">
          <section>
            <SectionHeader icon={Flame} title="Trending" />
            <Movers />
          </section>

          <section>
            <SectionHeader icon={Grid3x3} title="Market Heatmap" />
            <Card>
              <CardContent className="p-3">
                <Heatmap />
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionHeader icon={CalendarClock} title="Economic Calendar" />
            <Card>
              <CardContent className="p-3">
                <EconomicCalendar />
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionHeader icon={BarChart3} title="Upcoming Earnings" />
            <Card>
              <CardContent className="p-3">
                <EarningsList />
              </CardContent>
            </Card>
          </section>

          <section>
            <SectionHeader icon={Rocket} title="IPO Calendar" />
            <Card>
              <CardContent className="p-3">
                <IPOList />
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
