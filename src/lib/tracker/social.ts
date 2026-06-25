import type { RawFeedItem, SocialAccount, SocialCategory } from "./types";

/* ─────────────────────── Server-side cache ──────────────────────────── */

interface CacheEntry { items: RawFeedItem[]; expiresAt: number }
const cache = new Map<string, CacheEntry>();

function fromCache(key: string): RawFeedItem[] | null {
  const e = cache.get(key);
  return e && Date.now() < e.expiresAt ? e.items : null;
}
function toCache(key: string, items: RawFeedItem[], ttlMs: number) {
  cache.set(key, { items, expiresAt: Date.now() + ttlMs });
}

/* ─────────────────────── RSS XML mini-parser ────────────────────────── */

function stripCDATA(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}
function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? stripCDATA(m[1]).trim() : "";
}
function extractAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i"));
  return m ? m[1].trim() : "";
}

function parseRSS(
  xml: string,
  sourceName: string,
  handle: string,
  category: SocialCategory,
  displayName?: string,
): RawFeedItem[] {
  const items: RawFeedItem[] = [];
  const matches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  for (const m of matches) {
    const block = m[1];
    let title = stripHtml(stripCDATA(extractTag(block, "title")))
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/^@\w+:\s*/, "") // Nitter prefix
      .trim();
    const link = extractTag(block, "link") || extractAttr(block, "link", "href");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "updated") || extractTag(block, "dc:date");
    const description = stripHtml(stripCDATA(
      extractTag(block, "description") || extractTag(block, "summary")
    )).replace(/&amp;/g, "&").slice(0, 500).trim();

    if (!title || title.length < 3) continue;
    items.push({
      title,
      link: link || `https://truthsocial.com/@${handle}`,
      pubDate,
      description: description || title,
      sourceName,
      presetSourceType: "social",
      socialHandle: handle,
      socialDisplayName: displayName || sourceName,
      socialCategory: category,
    });
  }
  return items;
}

/* ═══════════════════════ SOURCE 1 — StockTwits ══════════════════════ */
// Free public API, no auth required. Per-ticker stream of trader posts.
// Docs: https://api.stocktwits.com/developers/docs/api#streams-symbol

interface StockTwitsMsg {
  id: number;
  body: string;
  created_at: string;
  user?: { username?: string; name?: string };
  entities?: { sentiment?: { basic?: string } };
}

async function fetchStockTwits(ticker: string): Promise<RawFeedItem[]> {
  const key = `stocktwits:${ticker}`;
  const cached = fromCache(key);
  if (cached) return cached;

  try {
    const res = await fetch(
      `https://api.stocktwits.com/api/2/streams/symbol/${ticker}.json`,
      { headers: { "User-Agent": "AlphaEdge/1.0" }, signal: AbortSignal.timeout(5000) },
    );
    if (!res.ok) { toCache(key, [], 30_000); return []; }

    const json = await res.json();
    const messages: StockTwitsMsg[] = json?.messages ?? [];

    const items: RawFeedItem[] = messages.slice(0, 20).map((m) => ({
      title: m.body,
      link: `https://stocktwits.com/${m.user?.username ?? "unknown"}/message/${m.id}`,
      pubDate: m.created_at,
      description: m.body,
      sourceName: `@${m.user?.username ?? "stocktwits"}`,
      presetSourceType: "social" as const,
      socialHandle: m.user?.username ?? "stocktwits",
      socialDisplayName: m.user?.name ?? m.user?.username ?? "StockTwits",
      socialCategory: "analyst" as const,
    }));

    toCache(key, items, 90_000); // 90s cache
    return items;
  } catch {
    toCache(key, [], 30_000);
    return [];
  }
}

/* ═══════════════════════ SOURCE 2 — Reddit ══════════════════════════ */
// Reddit JSON API is free and requires no auth.
// We search across finance subreddits for each tracked ticker.

const FINANCE_SUBREDDITS = ["wallstreetbets", "stocks", "investing", "options", "StockMarket", "SecurityAnalysis"];

interface RedditPost {
  data: {
    title?: string;
    selftext?: string;
    url?: string;
    permalink?: string;
    author?: string;
    subreddit?: string;
    created_utc?: number;
    score?: number;
    num_comments?: number;
  };
}

async function fetchRedditTicker(ticker: string): Promise<RawFeedItem[]> {
  const key = `reddit:${ticker}`;
  const cached = fromCache(key);
  if (cached) return cached;

  try {
    // Search across all Reddit for ticker mentions posted in the last 24h
    const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(`${ticker} stock`)}&sort=new&limit=15&t=day&type=link`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AlphaEdge News Aggregator 1.0 (learning project)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) { toCache(key, [], 60_000); return []; }

    const json = await res.json();
    const posts: RedditPost[] = json?.data?.children ?? [];

    const items: RawFeedItem[] = posts
      .filter((p) => p.data.title && p.data.permalink)
      .slice(0, 12)
      .map((p) => {
        const d = p.data;
        const handle = d.author ?? "reddit";
        return {
          title: d.title ?? "",
          link: `https://reddit.com${d.permalink}`,
          pubDate: d.created_utc ? new Date(d.created_utc * 1000).toUTCString() : "",
          description: ((d.selftext ?? "").slice(0, 300) || d.title) ?? "",
          sourceName: `r/${d.subreddit ?? "reddit"}`,
          presetSourceType: "social" as const,
          socialHandle: handle,
          socialDisplayName: `u/${handle} · r/${d.subreddit ?? "reddit"}`,
          socialCategory: "analyst" as const,
        };
      });

    toCache(key, items, 120_000); // 2min cache
    return items;
  } catch {
    toCache(key, [], 60_000);
    return [];
  }
}

async function fetchRedditGeneral(): Promise<RawFeedItem[]> {
  const key = "reddit:general";
  const cached = fromCache(key);
  if (cached) return cached;

  try {
    // Combine hot posts from top finance subreddits
    const subreddit = "wallstreetbets+stocks+investing+StockMarket";
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=20`;
    const res = await fetch(url, {
      headers: { "User-Agent": "AlphaEdge News Aggregator 1.0 (learning project)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) { toCache(key, [], 60_000); return []; }

    const json = await res.json();
    const posts: RedditPost[] = json?.data?.children ?? [];

    const items: RawFeedItem[] = posts
      .filter((p) => p.data.title)
      .map((p) => {
        const d = p.data;
        const handle = d.author ?? "reddit";
        return {
          title: d.title ?? "",
          link: `https://reddit.com${d.permalink}`,
          pubDate: d.created_utc ? new Date(d.created_utc * 1000).toUTCString() : "",
          description: ((d.selftext ?? "").slice(0, 300) || d.title) ?? "",
          sourceName: `r/${d.subreddit ?? "reddit"}`,
          presetSourceType: "social" as const,
          socialHandle: handle,
          socialDisplayName: `u/${handle} · r/${d.subreddit ?? "reddit"}`,
          socialCategory: "analyst" as const,
        };
      });

    toCache(key, items, 120_000);
    return items;
  } catch {
    toCache(key, [], 60_000);
    return [];
  }
}

/* ═══════════════════════ SOURCE 3 — Truth Social RSS ════════════════ */
// Truth Social exposes public RSS feeds for accounts.
// Works for: @realDonaldTrump, @POTUS45, and many political/financial accounts.
// URL: https://truthsocial.com/@{handle}.rss

async function fetchTruthSocial(handle: string, displayName: string, category: SocialCategory): Promise<RawFeedItem[]> {
  const key = `truthsocial:${handle}`;
  const cached = fromCache(key);
  if (cached) return cached;

  try {
    const url = `https://truthsocial.com/@${handle}.rss`;
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; RSS Reader/1.0)",
        Accept: "application/rss+xml, application/xml, text/xml",
      },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) { toCache(key, [], 60_000); return []; }

    const text = await res.text();
    if (!text.includes("<item>")) { toCache(key, [], 60_000); return []; }

    const items = parseRSS(text, `@${handle}`, handle, category, displayName);
    toCache(key, items, 90_000);
    return items;
  } catch {
    toCache(key, [], 30_000);
    return [];
  }
}

/* ═══════════════════════ SOURCE 4 — Nitter (fallback) ═══════════════ */
// Nitter is mostly dead since X's 2024 API changes.
// We still try it last-resort — some self-hosted instances work for non-controversial accounts.

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.unixfox.eu",
  "https://nitter.net",
];

async function fetchNitter(handle: string, displayName: string, category: SocialCategory): Promise<RawFeedItem[]> {
  const key = `nitter:${handle}`;
  const cached = fromCache(key);
  if (cached) return cached;

  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`${instance}/${handle}/rss`, {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) continue;
      const text = await res.text();
      if (!text.includes("<item>")) continue;

      const items = parseRSS(text, `@${handle}`, handle, category, displayName);
      if (items.length > 0) {
        toCache(key, items, 90_000);
        return items;
      }
    } catch {
      continue;
    }
  }

  toCache(key, [], 30_000); // 30s retry delay
  return [];
}

/* ═══════════════════ Per-account fetch (tries all sources) ══════════ */

// Known Truth Social accounts (handle → TS handle if different)
const TRUTH_SOCIAL_HANDLES: Record<string, string> = {
  "realDonaldTrump": "realDonaldTrump",
  "donaldtrump":     "realDonaldTrump",
  "trump":           "realDonaldTrump",
  "POTUS45":         "POTUS45",
  "DonaldJTrumpJr":  "DonaldJTrumpJr",
};

async function fetchAccountFeed(account: SocialAccount): Promise<RawFeedItem[]> {
  const handle = account.handle;
  const displayName = account.displayName;
  const category = account.category;

  // Check if this is a Truth Social account
  const tsHandle = TRUTH_SOCIAL_HANDLES[handle] || TRUTH_SOCIAL_HANDLES[handle.toLowerCase()];
  if (tsHandle) {
    const items = await fetchTruthSocial(tsHandle, displayName, category);
    if (items.length > 0) return items;
  }

  // Try Nitter for X/Twitter
  const nitterItems = await fetchNitter(handle, displayName, category);
  if (nitterItems.length > 0) return nitterItems;

  // Try Truth Social with the original handle (many accounts exist there)
  if (!tsHandle) {
    const tsItems = await fetchTruthSocial(handle, displayName, category);
    if (tsItems.length > 0) return tsItems;
  }

  return [];
}

/* ═══════════════════════════ Main export ════════════════════════════ */

/**
 * Fetch all social content:
 * 1. StockTwits per tracked ticker (always works, financial-specific)
 * 2. Reddit finance subreddits + per-ticker search (always works)
 * 3. Truth Social RSS for matching accounts
 * 4. Nitter fallback for X/Twitter (unreliable, best-effort)
 */
export async function fetchSocialFeeds(
  accounts: SocialAccount[],
  tickers: string[] = [],
): Promise<RawFeedItem[]> {
  const promises: Promise<RawFeedItem[]>[] = [];

  // StockTwits — one request per tracked ticker
  for (const ticker of tickers.slice(0, 8)) { // cap at 8 to avoid rate limits
    promises.push(fetchStockTwits(ticker));
  }

  // Reddit — general finance feed + per-ticker search
  promises.push(fetchRedditGeneral());
  for (const ticker of tickers.slice(0, 5)) {
    promises.push(fetchRedditTicker(ticker));
  }

  // Tracked social accounts (Truth Social + Nitter fallback)
  const enabled = accounts.filter((a) => a.enabled);
  for (const account of enabled.slice(0, 15)) { // cap at 15 accounts
    promises.push(fetchAccountFeed(account));
  }

  const results = await Promise.allSettled(promises);
  const all: RawFeedItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Deduplicate by link
  const seen = new Set<string>();
  const deduped: RawFeedItem[] = [];
  for (const item of all) {
    const key = item.link.split("?")[0];
    if (!seen.has(key) && item.title.length > 3) {
      seen.add(key);
      deduped.push(item);
    }
  }

  // Sort newest first
  deduped.sort((a, b) => {
    const da = a.pubDate ? Date.parse(a.pubDate) : 0;
    const db = b.pubDate ? Date.parse(b.pubDate) : 0;
    return db - da;
  });

  return deduped;
}

/* ─────────── Default social accounts ─────────────────────────────── */

export const DEFAULT_SOCIAL_ACCOUNTS: SocialAccount[] = [
  // Truth Social (confirmed working RSS)
  { id: "realDonaldTrump", handle: "realDonaldTrump", displayName: "Donald Trump",      category: "executive",  linkedTickers: ["DJT"],          enabled: true,  addedAt: 0 },
  // X/Twitter via Nitter (best-effort)
  { id: "elonmusk",        handle: "elonmusk",        displayName: "Elon Musk",          category: "executive",  linkedTickers: ["TSLA", "MSTR"], enabled: true,  addedAt: 0 },
  { id: "nvidia",          handle: "nvidia",           displayName: "NVIDIA",             category: "company",    linkedTickers: ["NVDA"],          enabled: true,  addedAt: 0 },
  { id: "Tesla",           handle: "Tesla",            displayName: "Tesla",              category: "company",    linkedTickers: ["TSLA"],          enabled: true,  addedAt: 0 },
  { id: "SECGov",          handle: "SECGov",           displayName: "SEC Gov",            category: "regulator",  linkedTickers: [],                enabled: true,  addedAt: 0 },
  { id: "federalreserve",  handle: "federalreserve",   displayName: "Federal Reserve",    category: "macro",      linkedTickers: ["SPY", "TLT"],    enabled: true,  addedAt: 0 },
  { id: "OpenAI",          handle: "OpenAI",           displayName: "OpenAI",             category: "company",    linkedTickers: ["MSFT"],          enabled: false, addedAt: 0 },
  { id: "chamath",         handle: "chamath",          displayName: "Chamath",            category: "analyst",    linkedTickers: [],                enabled: false, addedAt: 0 },
  { id: "unusual_whales",  handle: "unusual_whales",   displayName: "Unusual Whales",     category: "analyst",    linkedTickers: [],                enabled: false, addedAt: 0 },
];
