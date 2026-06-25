import type { RawFeedItem, SocialAccount } from "./types";
import { fetchSocialFeeds } from "./social";

/* ──────────────────────── RSS/Atom XML parser ───────────────────────── */

function stripCDATA(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function extractTag(xml: string, tag: string): string {
  // Handles both self-closing and value tags, with optional CDATA
  const m =
    xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i")) ??
    xml.match(new RegExp(`<${tag}[^/]*/>`, "i"));
  if (!m) return "";
  return stripCDATA(m[1] ?? "").trim();
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*\\s${attr}="([^"]*)"`, "i"));
  return m ? m[1].trim() : "";
}

function parseRSSItems(xml: string, fallbackSource: string): RawFeedItem[] {
  const items: RawFeedItem[] = [];
  const channelTitle = extractTag(xml, "title") || fallbackSource;

  // RSS 2.0 — <item> blocks
  const rssMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
  for (const m of rssMatches) {
    const block = m[1];
    const title = stripCDATA(extractTag(block, "title")).replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    const link = extractTag(block, "link") || extractAttr(block, "link", "href");
    const pubDate = extractTag(block, "pubDate") || extractTag(block, "dc:date") || extractTag(block, "updated");
    const description = stripCDATA(extractTag(block, "description") || extractTag(block, "summary"))
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const sourceTag = extractTag(block, "source") || channelTitle;
    if (title && link) {
      items.push({ title, link, pubDate, description, sourceName: sourceTag || fallbackSource });
    }
  }

  // Atom — <entry> blocks
  const atomMatches = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)];
  for (const m of atomMatches) {
    const block = m[1];
    const title = stripCDATA(extractTag(block, "title")).replace(/&amp;/g, "&");
    const link = extractAttr(block, "link", "href") || extractTag(block, "link");
    const pubDate = extractTag(block, "updated") || extractTag(block, "published");
    const description = stripCDATA(extractTag(block, "summary") || extractTag(block, "content"))
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (title && link) {
      items.push({ title, link, pubDate, description, sourceName: fallbackSource });
    }
  }

  return items;
}

/* ──────────────────────────── Feed sources ─────────────────────────── */

/** Per-ticker RSS from Yahoo Finance */
function yahooTickerUrl(ticker: string): string {
  return `https://finance.yahoo.com/rss/headline?s=${ticker}`;
}

/** General financial news feeds (always fetched regardless of tickers) */
const GENERAL_FEEDS: Array<{ url: string; name: string }> = [
  { url: "https://feeds.content.dowjones.io/public/rss/mw_realtimeheadlines", name: "MarketWatch" },
  { url: "https://feeds.content.dowjones.io/public/rss/mw_topstories", name: "MarketWatch" },
  { url: "https://feeds.reuters.com/reuters/businessNews", name: "Reuters" },
  { url: "https://feeds.reuters.com/reuters/technologyNews", name: "Reuters" },
  { url: "https://www.cnbc.com/id/15839069/device/rss/rss.html", name: "CNBC" },
  { url: "https://www.cnbc.com/id/10001147/device/rss/rss.html", name: "CNBC Earnings" },
  { url: "https://www.cnbc.com/id/100727362/device/rss/rss.html", name: "CNBC Tech" },
  { url: "https://feed.businesswire.com/rss/home/?rss=G1", name: "Business Wire" },
  { url: "https://www.prnewswire.com/rss/news-releases-list.rss", name: "PR Newswire" },
  { url: "https://seekingalpha.com/market_currents.xml", name: "Seeking Alpha" },
  { url: "https://www.benzinga.com/feeds/news", name: "Benzinga" },
  {
    url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&dateb=&owner=include&count=20&search_text=&output=atom",
    name: "SEC EDGAR",
  },
];

/* ─────────────────────── In-memory server cache ─────────────────────── */

interface CacheEntry {
  items: RawFeedItem[];
  expiresAt: number;
}
const feedCache = new Map<string, CacheEntry>();
const FEED_TTL = 90 * 1000; // 90 seconds

async function fetchFeed(url: string, sourceName: string, signal?: AbortSignal): Promise<RawFeedItem[]> {
  const cached = feedCache.get(url);
  if (cached && Date.now() < cached.expiresAt) return cached.items;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; NewsAggregator/1.0)",
        Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml",
      },
      signal: signal ?? AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    const items = parseRSSItems(text, sourceName);
    feedCache.set(url, { items, expiresAt: Date.now() + FEED_TTL });
    return items;
  } catch {
    return [];
  }
}

/* ──────────────────────── Main aggregate function ───────────────────── */

/**
 * Fetch all news for the given tickers + social accounts.
 * Returns raw feed items, newest-first, deduped by URL.
 */
export async function fetchAllFeeds(
  tickers: string[],
  socialAccounts: SocialAccount[] = [],
): Promise<RawFeedItem[]> {
  const signal = AbortSignal.timeout(10000);

  // Kick off ticker-specific Yahoo feeds + general feeds + social feeds in parallel
  const tickerFeeds = tickers.map((t) =>
    fetchFeed(yahooTickerUrl(t), "Yahoo Finance", signal),
  );
  const generalFeeds = GENERAL_FEEDS.map((f) =>
    fetchFeed(f.url, f.name, signal),
  );
  const socialFeedsPromise = fetchSocialFeeds(socialAccounts, tickers);

  const results = await Promise.allSettled([...tickerFeeds, ...generalFeeds, socialFeedsPromise]);

  const all: RawFeedItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
  }

  // Deduplicate by link
  const seen = new Set<string>();
  const deduped: RawFeedItem[] = [];
  for (const item of all) {
    const key = item.link.split("?")[0]; // strip query params
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  // Sort newest first (parse pubDate or fallback to array order)
  deduped.sort((a, b) => {
    const da = a.pubDate ? Date.parse(a.pubDate) : 0;
    const db = b.pubDate ? Date.parse(b.pubDate) : 0;
    return db - da;
  });

  return deduped.slice(0, 400); // cap at 400 raw items
}
