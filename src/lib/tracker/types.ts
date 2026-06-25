export type Impact = "Critical" | "High" | "Medium" | "Low";
export type Sentiment = "Bullish" | "Bearish" | "Neutral";
export type Confidence = "High" | "Medium" | "Low";
export type NewsCategory =
  | "earnings"
  | "guidance"
  | "acquisition"
  | "merger"
  | "leadership"
  | "regulatory"
  | "legal"
  | "product"
  | "analyst"
  | "macro"
  | "general";
export type TimeRange = "1h" | "4h" | "today" | "week" | "all";

/** Origin type — determines badge display and filtering */
export type SourceType =
  | "news"          // Reuters, CNBC, Bloomberg, MarketWatch…
  | "social"        // X/Twitter posts via Nitter
  | "sec"           // SEC EDGAR filings
  | "press_release" // Business Wire, PR Newswire
  | "regulatory"    // Fed, regulators (non-SEC)
  | "announcement"; // Company IR / press pages

export type SocialCategory =
  | "executive"  // CEO, CFO, CTO, founders
  | "company"    // Official company accounts
  | "regulator"  // SEC, Fed, FTC, FDA…
  | "journalist" // Financial journalists
  | "analyst"    // Market analysts / fund managers
  | "macro"      // Macro commentators
  | "other";

export interface TrackedCompany {
  id: string;       // same as ticker
  ticker: string;
  name: string;
  addedAt: number;  // unix ms
}

export interface SocialAccount {
  id: string;              // same as handle (lowercase)
  handle: string;          // without @
  displayName: string;
  category: SocialCategory;
  linkedTickers: string[]; // auto-linked tickers for relevance boosting
  enabled: boolean;
  addedAt: number;
}

export interface NewsItem {
  id: string;                  // hash(url+headline)
  tickers: string[];           // matched tracked tickers
  primaryTicker: string | null;
  headline: string;
  summary: string;
  url: string;
  source: string;
  sourceType: SourceType;      // ← NEW (defaults to "news")
  sourceCount: number;         // dedup count
  publishedAt: number;         // unix ms
  fetchedAt: number;
  impact: Impact;
  sentiment: Sentiment;
  confidence: Confidence;
  isBreaking: boolean;
  isPinned: boolean;
  category: NewsCategory;
  relevanceScore: number;      // 0–100
  // Social-specific (only set when sourceType === "social")
  socialHandle?: string;       // @handle without @
  socialDisplayName?: string;  // display name
  socialCategory?: SocialCategory;
  isNew?: boolean;             // animation flag
}

export interface FilterState {
  impact: Impact[];
  sentiment: Sentiment[];
  tickers: string[];           // empty = show all tracked
  sourceTypes: SourceType[];   // ← NEW: empty = show all
  timeRange: TimeRange;
  showBreakingOnly: boolean;
  searchQuery: string;
}

export interface AlertSettings {
  soundEnabled: boolean;
  browserNotifications: boolean;
  triggers: {
    critical: boolean;
    earnings: boolean;
    acquisitions: boolean;
    regulatory: boolean;
    guidance: boolean;
    leadership: boolean;
    socialBreaking: boolean;   // ← NEW: alert on breaking social posts
  };
}

export interface SavedWatchlist {
  id: string;
  name: string;
  tickers: string[];
  createdAt: number;
}

export interface SavedSocialList {
  id: string;
  name: string;
  handles: string[];
  createdAt: number;
}

/** Raw item extracted from an RSS/Atom feed before scoring */
export interface RawFeedItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  sourceName: string;
  // Pre-set for social items (bypasses auto-detection)
  presetSourceType?: SourceType;
  socialHandle?: string;
  socialDisplayName?: string;
  socialCategory?: SocialCategory;
}

/** Shape returned by /api/news-tracker/feed */
export interface FeedResponse {
  items: NewsItem[];
  fetchedAt: number;
  sources: string[];
}

/** Shape of SSE data frames from /api/news-tracker/stream */
export type SSEFrame =
  | { type: "initial"; items: NewsItem[]; fetchedAt: number }
  | { type: "update"; items: NewsItem[]; fetchedAt: number }
  | { type: "ping"; time: number };
