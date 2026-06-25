import { NextRequest, NextResponse } from "next/server";
import { fetchAllFeeds } from "@/lib/tracker/rss";
import { scoreRawItem, hashId, isSimilarHeadline, TICKER_NAMES } from "@/lib/tracker/scoring";
import { DEFAULT_SOCIAL_ACCOUNTS } from "@/lib/tracker/social";
import type { NewsItem, TrackedCompany, SocialAccount, FeedResponse } from "@/lib/tracker/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Tickers: "NVDA,TSLA,AAPL"
  const tickersParam = searchParams.get("tickers") ?? "";
  const tickers = tickersParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  // Social handles: "elonmusk,nvidia,SECGov"
  const accountsParam = searchParams.get("accounts") ?? "";
  const handles = accountsParam
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  if (tickers.length === 0 && handles.length === 0) {
    return NextResponse.json({ items: [], fetchedAt: Date.now(), sources: [] } satisfies FeedResponse);
  }

  // Build TrackedCompany array
  const tracked: TrackedCompany[] = tickers.map((ticker) => ({
    id: ticker,
    ticker,
    name: TICKER_NAMES[ticker] ?? ticker,
    addedAt: 0,
  }));

  // Build SocialAccount array (merge client handles with default metadata)
  const socialAccounts: SocialAccount[] = handles.map((handle) => {
    const known = DEFAULT_SOCIAL_ACCOUNTS.find((a) => a.handle.toLowerCase() === handle);
    return known ?? {
      id: handle,
      handle,
      displayName: `@${handle}`,
      category: "other" as const,
      linkedTickers: [],
      enabled: true,
      addedAt: 0,
    };
  });

  const fetchedAt = Date.now();
  const rawItems = await fetchAllFeeds(tickers, socialAccounts);

  // Score each raw item
  const scored = rawItems.map((raw) => {
    const base = scoreRawItem(raw, tracked, fetchedAt);
    return {
      id: hashId(raw.link, raw.title),
      isPinned: base.isBreaking,
      sourceCount: 1,
      isNew: false,
      ...base,
    } satisfies NewsItem;
  });

  // Keep relevant items:
  // - matched tickers, OR
  // - social posts (always show all from tracked accounts), OR
  // - macro news
  const relevant = scored.filter(
    (item) =>
      item.tickers.length > 0 ||
      item.relevanceScore > 0 ||
      item.category === "macro" ||
      item.sourceType === "social",
  );

  // Deduplicate similar headlines (skip social posts — they're unique by nature)
  const deduped: NewsItem[] = [];
  const sourceCount: Record<string, number> = {};

  for (const item of relevant) {
    if (item.sourceType === "social") {
      deduped.push(item);
      continue;
    }
    const similar = deduped.find(
      (d) => d.sourceType !== "social" && isSimilarHeadline(d.headline, item.headline),
    );
    if (similar) {
      similar.sourceCount += 1;
      sourceCount[similar.id] = (sourceCount[similar.id] ?? 1) + 1;
      const order = { Critical: 4, High: 3, Medium: 2, Low: 1 } as const;
      if (order[item.impact] > order[similar.impact]) {
        similar.impact = item.impact;
        similar.isBreaking = item.isBreaking || similar.isBreaking;
        similar.isPinned = similar.isBreaking;
      }
    } else {
      deduped.push(item);
    }
  }

  for (const item of deduped) {
    if (sourceCount[item.id]) item.sourceCount = sourceCount[item.id];
  }

  // Sort: breaking first → social posts interleaved by publishedAt
  deduped.sort((a, b) => {
    if (a.isBreaking && !b.isBreaking) return -1;
    if (!a.isBreaking && b.isBreaking) return 1;
    return b.publishedAt - a.publishedAt;
  });

  const sources = [...new Set(rawItems.map((r) => r.sourceName))];

  return NextResponse.json({
    items: deduped.slice(0, 250),
    fetchedAt,
    sources,
  } satisfies FeedResponse);
}
