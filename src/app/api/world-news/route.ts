import { NextResponse } from "next/server";
import { SOURCES } from "@/lib/news/sources";
import { buildStories, parseFeed, RawArticle, Story } from "@/lib/news/aggregate";

export const runtime = "nodejs";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchFeed(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 7000);
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
      signal: ctrl.signal,
      next: { revalidate: 120 },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

const HOMEPAGE_MIN = 70; // only stories scoring above 70 reach the curated sections

// GET /api/world-news — tier-ranked, deduped, scored, sectioned news
export async function GET() {
  const jobs = SOURCES.filter((s) => s.active).flatMap((s) =>
    s.feeds.map(async (f) => {
      const xml = await fetchFeed(f.url);
      return xml ? parseFeed(xml, s, f.category) : [];
    }),
  );

  const settled = await Promise.allSettled(jobs);
  const articles: RawArticle[] = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));

  if (articles.length === 0) {
    return NextResponse.json({
      updatedAt: new Date().toISOString(),
      live: false,
      sections: { top: [], breaking: [], business: [], technology: [], world: [] },
    });
  }

  const stories = buildStories(articles);
  const byScore = (a: Story, b: Story) => b.score - a.score;
  const byTime = (a: Story, b: Story) => +new Date(b.publishedAt) - +new Date(a.publishedAt);
  const dayAgo = Date.now() - 24 * 3.6e6;
  const inCat = (c: string) => stories.filter((s) => s.category === c && s.score >= HOMEPAGE_MIN);

  const sections = {
    top: [...stories].filter((s) => s.score >= HOMEPAGE_MIN).sort(byScore).slice(0, 5),
    breaking: [...stories]
      .filter((s) => +new Date(s.publishedAt) >= dayAgo) // auto-remove stale
      .sort(byTime)
      .slice(0, 8),
    business: inCat("business").sort(byScore).slice(0, 6),
    technology: inCat("technology").sort(byScore).slice(0, 6),
    world: [...inCat("world"), ...inCat("top")].sort(byScore).slice(0, 6),
  };

  return NextResponse.json({ updatedAt: new Date().toISOString(), live: true, sections });
}
