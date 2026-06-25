import { NextRequest } from "next/server";
import { fetchAllFeeds } from "@/lib/tracker/rss";
import { scoreRawItem, hashId, isSimilarHeadline, TICKER_NAMES } from "@/lib/tracker/scoring";
import { DEFAULT_SOCIAL_ACCOUNTS } from "@/lib/tracker/social";
import type { NewsItem, TrackedCompany, SocialAccount, SSEFrame } from "@/lib/tracker/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ─────────────────────── Shared helpers ─────────────────────────────── */

function buildTracked(tickers: string[]): TrackedCompany[] {
  return tickers.map((ticker) => ({
    id: ticker,
    ticker,
    name: TICKER_NAMES[ticker] ?? ticker,
    addedAt: 0,
  }));
}

function buildSocialAccounts(handles: string[]): SocialAccount[] {
  return handles.map((handle) => {
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
}

async function buildNewsItems(
  tickers: string[],
  handles: string[],
): Promise<NewsItem[]> {
  const tracked = buildTracked(tickers);
  const socialAccounts = buildSocialAccounts(handles);
  const fetchedAt = Date.now();
  const rawItems = await fetchAllFeeds(tickers, socialAccounts);

  const scored = rawItems.map((raw) => {
    const base = scoreRawItem(raw, tracked, fetchedAt);
    return {
      id: hashId(raw.link, raw.title),
      isPinned: base.isBreaking,
      sourceCount: 1,
      isNew: false,
      ...base,
    } as NewsItem;
  });

  const relevant = scored.filter(
    (item) =>
      item.tickers.length > 0 ||
      item.relevanceScore > 0 ||
      item.category === "macro" ||
      item.sourceType === "social",
  );

  const deduped: NewsItem[] = [];
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

  deduped.sort((a, b) => {
    if (a.isBreaking && !b.isBreaking) return -1;
    if (!a.isBreaking && b.isBreaking) return 1;
    return b.publishedAt - a.publishedAt;
  });

  return deduped.slice(0, 250);
}

/* ─────────────────────── SSE GET handler ───────────────────────────── */

export async function GET(req: NextRequest) {
  const tickersParam = req.nextUrl.searchParams.get("tickers") ?? "";
  const tickers = tickersParam
    .split(",")
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);

  const accountsParam = req.nextUrl.searchParams.get("accounts") ?? "";
  const handles = accountsParam
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;

      function send(frame: SSEFrame) {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(frame)}\n\n`));
        } catch {
          closed = true;
        }
      }

      // Reconnect hint
      try { controller.enqueue(encoder.encode("retry: 5000\n\n")); } catch {}

      // Initial batch
      try {
        const initial = await buildNewsItems(tickers, handles);
        send({ type: "initial", items: initial, fetchedAt: Date.now() });
      } catch (err) {
        console.error("[SSE] initial fetch error:", err);
      }

      let seenIds = new Set<string>();

      // News refreshes every 45s; social refreshes more often (2-min cache anyway)
      const pollInterval = setInterval(async () => {
        if (closed) { clearInterval(pollInterval); clearInterval(pingInterval); return; }
        try {
          const latest = await buildNewsItems(tickers, handles);
          const newItems = latest.filter((item) => !seenIds.has(item.id));
          if (newItems.length > 0) {
            newItems.forEach((item) => { item.isNew = true; seenIds.add(item.id); });
            send({ type: "update", items: newItems, fetchedAt: Date.now() });
          }
          if (seenIds.size > 2000) seenIds = new Set(latest.map((i) => i.id));
        } catch (err) {
          console.error("[SSE] poll error:", err);
        }
      }, 30000); // 30s — matches Nitter 2-min cache, news feeds have their own 90s server cache

      // Keep-alive ping every 20s
      const pingInterval = setInterval(() => { send({ type: "ping", time: Date.now() }); }, 20000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(pollInterval);
        clearInterval(pingInterval);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
