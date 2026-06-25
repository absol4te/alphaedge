import {
  Candle,
  Company,
  EarningsItem,
  EconomicEvent,
  HeatmapTile,
  IndexQuote,
  IPOItem,
  NewsArticle,
  Timeframe,
  WatchlistItem,
} from "@/types";
import { seededRandom } from "./utils";

// ───────────────────────────────────────────────────────────
// Global market indices / crypto / commodities
// ───────────────────────────────────────────────────────────
function spark(seed: number, base: number, vol: number): number[] {
  const rnd = seededRandom(seed);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < 32; i++) {
    v += (rnd() - 0.48) * vol;
    out.push(Number(v.toFixed(2)));
  }
  return out;
}

export const MARKET_INDICES: IndexQuote[] = [
  { symbol: "SPX", name: "S&P 500", price: 5918.25, change: 34.12, changePercent: 0.58, volume: 2_340_000_000, category: "index", spark: spark(1, 5900, 18) },
  { symbol: "IXIC", name: "Nasdaq", price: 19478.9, change: 121.6, changePercent: 0.63, volume: 4_120_000_000, category: "index", spark: spark(2, 19400, 60) },
  { symbol: "DJI", name: "Dow Jones", price: 43488.1, change: -88.4, changePercent: -0.2, volume: 380_000_000, category: "index", spark: spark(3, 43500, 90) },
  { symbol: "BTC", name: "Bitcoin", price: 97842.5, change: 2410.3, changePercent: 2.52, volume: 38_900_000_000, category: "crypto", spark: spark(4, 95000, 600) },
  { symbol: "ETH", name: "Ethereum", price: 3624.8, change: 96.2, changePercent: 2.73, volume: 18_200_000_000, category: "crypto", spark: spark(5, 3550, 40) },
  { symbol: "GLD", name: "Gold", price: 2698.4, change: 12.9, changePercent: 0.48, volume: 142_000_000, category: "commodity", spark: spark(6, 2690, 8) },
  { symbol: "OIL", name: "Crude Oil", price: 71.32, change: -0.84, changePercent: -1.16, volume: 410_000_000, category: "commodity", spark: spark(7, 72, 0.5) },
];

// ───────────────────────────────────────────────────────────
// Company universe
// ───────────────────────────────────────────────────────────
type Seed = {
  symbol: string;
  name: string;
  isin: string;
  exchange: string;
  sector: string;
  industry: string;
  color: string;
  price: number;
  changePercent: number;
  marketCap: number;
  pe: number;
  ceo: string;
  employees: number;
  founded: number;
  hq: string;
  desc: string;
};

const SEEDS: Seed[] = [
  { symbol: "AAPL", name: "Apple Inc.", isin: "US0378331005", exchange: "NASDAQ", sector: "Technology", industry: "Consumer Electronics", color: "#A2AAAD", price: 229.87, changePercent: 1.24, marketCap: 3.48e12, pe: 35.2, ceo: "Tim Cook", employees: 164000, founded: 1976, hq: "Cupertino, CA", desc: "Apple designs, manufactures and markets smartphones, personal computers, tablets, wearables and accessories, and sells a variety of related services." },
  { symbol: "NVDA", name: "NVIDIA Corporation", isin: "US67066G1040", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors", color: "#76B900", price: 138.25, changePercent: 3.41, marketCap: 3.39e12, pe: 54.8, ceo: "Jensen Huang", employees: 29600, founded: 1993, hq: "Santa Clara, CA", desc: "NVIDIA is the pioneer of accelerated computing, powering AI, data centers, gaming and professional visualization with its GPU platforms." },
  { symbol: "MSFT", name: "Microsoft Corporation", isin: "US5949181045", exchange: "NASDAQ", sector: "Technology", industry: "Software—Infrastructure", color: "#00A4EF", price: 447.2, changePercent: 0.86, marketCap: 3.32e12, pe: 38.1, ceo: "Satya Nadella", employees: 228000, founded: 1975, hq: "Redmond, WA", desc: "Microsoft develops and supports software, services, devices and solutions including Azure cloud, Microsoft 365, Windows and gaming." },
  { symbol: "GOOGL", name: "Alphabet Inc.", isin: "US02079K3059", exchange: "NASDAQ", sector: "Communication", industry: "Internet Content", color: "#4285F4", price: 191.3, changePercent: -0.42, marketCap: 2.34e12, pe: 26.4, ceo: "Sundar Pichai", employees: 182000, founded: 1998, hq: "Mountain View, CA", desc: "Alphabet is the parent of Google, providing search, advertising, cloud, YouTube, Android and a portfolio of other bets." },
  { symbol: "AMZN", name: "Amazon.com, Inc.", isin: "US0231351067", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Internet Retail", color: "#FF9900", price: 224.9, changePercent: 1.78, marketCap: 2.36e12, pe: 44.7, ceo: "Andy Jassy", employees: 1525000, founded: 1994, hq: "Seattle, WA", desc: "Amazon is a global leader in e-commerce, cloud computing (AWS), digital streaming and artificial intelligence." },
  { symbol: "META", name: "Meta Platforms, Inc.", isin: "US30303M1027", exchange: "NASDAQ", sector: "Communication", industry: "Internet Content", color: "#0668E1", price: 604.1, changePercent: 2.13, marketCap: 1.53e12, pe: 29.3, ceo: "Mark Zuckerberg", employees: 72000, founded: 2004, hq: "Menlo Park, CA", desc: "Meta builds technologies that help people connect through Facebook, Instagram, WhatsApp, and is investing in the metaverse and AI." },
  { symbol: "TSLA", name: "Tesla, Inc.", isin: "US88160R1014", exchange: "NASDAQ", sector: "Consumer Cyclical", industry: "Auto Manufacturers", color: "#E82127", price: 410.4, changePercent: -2.86, marketCap: 1.31e12, pe: 112.5, ceo: "Elon Musk", employees: 140473, founded: 2003, hq: "Austin, TX", desc: "Tesla designs, manufactures and sells electric vehicles, energy generation and storage systems, and develops autonomous driving technology." },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", isin: "US46625H1005", exchange: "NYSE", sector: "Financial", industry: "Banks—Diversified", color: "#5C2D2D", price: 248.6, changePercent: 0.54, marketCap: 7.01e11, pe: 13.2, ceo: "Jamie Dimon", employees: 309000, founded: 1799, hq: "New York, NY", desc: "JPMorgan Chase is a leading global financial services firm with operations in investment banking, consumer banking, and asset management." },
  { symbol: "V", name: "Visa Inc.", isin: "US92826C8394", exchange: "NYSE", sector: "Financial", industry: "Credit Services", color: "#1A1F71", price: 312.8, changePercent: 0.31, marketCap: 6.12e11, pe: 31.0, ceo: "Ryan McInerney", employees: 31600, founded: 1958, hq: "San Francisco, CA", desc: "Visa operates the world's largest electronic payments network, facilitating digital transactions across more than 200 countries." },
  { symbol: "AMD", name: "Advanced Micro Devices", isin: "US0079031078", exchange: "NASDAQ", sector: "Technology", industry: "Semiconductors", color: "#ED1C24", price: 122.1, changePercent: 2.94, marketCap: 1.98e11, pe: 47.3, ceo: "Lisa Su", employees: 26000, founded: 1969, hq: "Santa Clara, CA", desc: "AMD designs high-performance CPUs and GPUs for data center, client, gaming and embedded markets." },
  { symbol: "NFLX", name: "Netflix, Inc.", isin: "US64110L1061", exchange: "NASDAQ", sector: "Communication", industry: "Entertainment", color: "#E50914", price: 912.4, changePercent: 1.02, marketCap: 3.9e11, pe: 41.8, ceo: "Ted Sarandos", employees: 14000, founded: 1997, hq: "Los Gatos, CA", desc: "Netflix is the world's leading streaming entertainment service with hundreds of millions of paid memberships globally." },
  { symbol: "COIN", name: "Coinbase Global, Inc.", isin: "US19260Q1076", exchange: "NASDAQ", sector: "Financial", industry: "Capital Markets", color: "#0052FF", price: 298.3, changePercent: 5.62, marketCap: 7.4e10, pe: 58.9, ceo: "Brian Armstrong", employees: 3700, founded: 2012, hq: "Remote-first", desc: "Coinbase operates a leading cryptocurrency exchange and platform for the crypto economy." },
];

const FALLBACK_DESC =
  "A publicly traded company operating across its core markets, focused on long-term shareholder value through disciplined capital allocation and product innovation.";

function buildCompany(s: Seed): Company {
  const rnd = seededRandom(s.symbol.charCodeAt(0) + s.symbol.length * 31);
  const change = (s.price * s.changePercent) / 100;
  const revenue = s.marketCap / (4 + rnd() * 4);
  const netIncome = revenue * (0.12 + rnd() * 0.22);
  return {
    symbol: s.symbol,
    name: s.name,
    isin: s.isin,
    exchange: s.exchange,
    sector: s.sector,
    industry: s.industry,
    logoColor: s.color,
    description: s.desc || FALLBACK_DESC,
    ceo: s.ceo,
    employees: s.employees,
    founded: s.founded,
    headquarters: s.hq,
    website: `https://www.${s.name.split(" ")[0].toLowerCase().replace(/[^a-z]/g, "")}.com`,
    price: s.price,
    change: Number(change.toFixed(2)),
    changePercent: s.changePercent,
    marketCap: s.marketCap,
    volume: Math.round((20 + rnd() * 80) * 1e6),
    avgVolume: Math.round((20 + rnd() * 80) * 1e6),
    dayRange: [Number((s.price * 0.985).toFixed(2)), Number((s.price * 1.012).toFixed(2))],
    yearRange: [Number((s.price * 0.62).toFixed(2)), Number((s.price * 1.18).toFixed(2))],
    stats: {
      peRatio: s.pe,
      forwardPE: Number((s.pe * 0.86).toFixed(1)),
      pegRatio: Number((1 + rnd() * 1.8).toFixed(2)),
      revenue,
      netIncome,
      ebitda: netIncome * (1.3 + rnd() * 0.5),
      freeCashFlow: netIncome * (0.8 + rnd() * 0.4),
      sharesOutstanding: s.marketCap / s.price,
      roe: Number((12 + rnd() * 38).toFixed(1)),
      roic: Number((8 + rnd() * 26).toFixed(1)),
      debtToEquity: Number((0.1 + rnd() * 1.4).toFixed(2)),
      dividendYield: Number((rnd() * 2.4).toFixed(2)),
      beta: Number((0.8 + rnd() * 1.0).toFixed(2)),
      eps: Number((s.price / s.pe).toFixed(2)),
    },
  };
}

export const COMPANIES: Company[] = SEEDS.map(buildCompany);

export function getCompany(symbol: string): Company | undefined {
  return COMPANIES.find((c) => c.symbol.toUpperCase() === symbol.toUpperCase());
}

export function searchCompanies(query: string): Company[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return COMPANIES.filter(
    (c) =>
      c.symbol.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.isin.toLowerCase().includes(q),
  ).slice(0, 8);
}

// ───────────────────────────────────────────────────────────
// OHLC candle generator (deterministic per symbol+timeframe)
// ───────────────────────────────────────────────────────────
const TF_CONFIG: Record<Timeframe, { points: number; stepMs: number; vol: number }> = {
  "1D": { points: 78, stepMs: 5 * 60 * 1000, vol: 0.0015 },
  "5D": { points: 120, stepMs: 30 * 60 * 1000, vol: 0.0025 },
  "1M": { points: 30, stepMs: 24 * 60 * 60 * 1000, vol: 0.012 },
  "6M": { points: 130, stepMs: 24 * 60 * 60 * 1000, vol: 0.014 },
  "1Y": { points: 252, stepMs: 24 * 60 * 60 * 1000, vol: 0.016 },
  "5Y": { points: 260, stepMs: 7 * 24 * 60 * 60 * 1000, vol: 0.03 },
  MAX: { points: 300, stepMs: 14 * 24 * 60 * 60 * 1000, vol: 0.04 },
};

export function generateCandles(symbol: string, tf: Timeframe): Candle[] {
  const company = getCompany(symbol);
  const endPrice = company?.price ?? 100;
  const cfg = TF_CONFIG[tf];
  const seed = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + tf.length;
  const rnd = seededRandom(seed);

  // Walk backwards from current price so the series ends at the live quote.
  const closes: number[] = [];
  let price = endPrice;
  for (let i = 0; i < cfg.points; i++) {
    closes.push(price);
    const drift = (rnd() - 0.5) * 2 * cfg.vol;
    price = price / (1 + drift);
  }
  closes.reverse();

  const now = Date.now();
  const candles: Candle[] = closes.map((close, i) => {
    const open = i === 0 ? close * (1 - cfg.vol) : closes[i - 1];
    const hi = Math.max(open, close) * (1 + rnd() * cfg.vol);
    const lo = Math.min(open, close) * (1 - rnd() * cfg.vol);
    return {
      time: now - (cfg.points - i) * cfg.stepMs,
      open: Number(open.toFixed(2)),
      high: Number(hi.toFixed(2)),
      low: Number(lo.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.round((10 + rnd() * 90) * 1e6),
    };
  });
  return candles;
}

// ───────────────────────────────────────────────────────────
// Trending: gainers / losers / most active
// ───────────────────────────────────────────────────────────
export function getMovers() {
  const sorted = [...COMPANIES].sort((a, b) => b.changePercent - a.changePercent);
  return {
    gainers: sorted.slice(0, 5),
    losers: [...sorted].reverse().slice(0, 5),
    active: [...COMPANIES].sort((a, b) => b.volume - a.volume).slice(0, 5),
  };
}

// ───────────────────────────────────────────────────────────
// News feed
// ───────────────────────────────────────────────────────────
const NEWS_TEMPLATES: Omit<NewsArticle, "id" | "publishedAt">[] = [
  { headline: "NVIDIA unveils next-gen Blackwell Ultra accelerators, raises data-center outlook", summary: "The chipmaker signaled accelerating demand from hyperscalers as it lifted full-year guidance, sending shares higher in pre-market trading.", source: "Bloomberg", symbols: ["NVDA", "AMD"], category: "Technology", sentiment: "bullish", imageColor: "#76B900", url: "#" },
  { headline: "Fed minutes hint at measured pace of rate cuts through 2026", summary: "Policymakers emphasized data-dependence amid sticky services inflation, tempering market expectations for aggressive easing.", source: "Reuters", symbols: ["SPX", "JPM"], category: "Economy", sentiment: "neutral", imageColor: "#3B82F6", url: "#" },
  { headline: "Apple reportedly accelerates foldable iPhone timeline for 2026 launch", summary: "Supply-chain checks point to a new form factor entering trial production, with analysts modeling an incremental upgrade super-cycle.", source: "WSJ", symbols: ["AAPL"], category: "Technology", sentiment: "bullish", imageColor: "#A2AAAD", url: "#" },
  { headline: "Tesla deliveries miss estimates as EV price war intensifies in China", summary: "Margin pressure resurfaced as the company cut prices across its lineup to defend share against domestic rivals.", source: "CNBC", symbols: ["TSLA"], category: "Autos", sentiment: "bearish", imageColor: "#E82127", url: "#" },
  { headline: "Bitcoin reclaims $97K as spot ETF inflows hit record weekly pace", summary: "Institutional demand drove the largest cryptocurrency to multi-week highs, with derivatives positioning turning decidedly bullish.", source: "CoinDesk", symbols: ["BTC", "COIN"], category: "Crypto", sentiment: "bullish", imageColor: "#F7931A", url: "#" },
  { headline: "Microsoft expands Azure AI capacity with multi-billion dollar buildout", summary: "The cloud leader committed to a sweeping data-center expansion to meet surging enterprise demand for generative AI workloads.", source: "The Information", symbols: ["MSFT", "NVDA"], category: "Technology", sentiment: "bullish", imageColor: "#00A4EF", url: "#" },
  { headline: "JPMorgan tops profit estimates on trading and investment-banking rebound", summary: "Robust capital-markets activity and resilient net interest income drove a beat, with management striking an upbeat tone on credit.", source: "Financial Times", symbols: ["JPM"], category: "Financials", sentiment: "bullish", imageColor: "#5C2D2D", url: "#" },
  { headline: "Amazon Web Services cuts prices on flagship AI inference instances", summary: "The move ratchets up competition in the cloud AI market as providers race to win developer workloads.", source: "Bloomberg", symbols: ["AMZN", "GOOGL"], category: "Technology", sentiment: "neutral", imageColor: "#FF9900", url: "#" },
  { headline: "Oil slides as OPEC+ signals it may unwind production cuts sooner", summary: "Crude futures fell on expectations of additional supply, pressuring energy equities across the board.", source: "Reuters", symbols: ["OIL"], category: "Commodities", sentiment: "bearish", imageColor: "#1A1A1A", url: "#" },
  { headline: "Meta's ad revenue accelerates as AI-driven targeting boosts conversion", summary: "Improved monetization across Reels and Advantage+ lifted results above Street forecasts.", source: "WSJ", symbols: ["META"], category: "Technology", sentiment: "bullish", imageColor: "#0668E1", url: "#" },
];

export function getNews(count = 30): NewsArticle[] {
  const out: NewsArticle[] = [];
  for (let i = 0; i < count; i++) {
    const t = NEWS_TEMPLATES[i % NEWS_TEMPLATES.length];
    out.push({
      ...t,
      id: `news-${i}`,
      publishedAt: new Date(Date.now() - i * 1000 * 60 * (7 + (i % 5) * 11)).toISOString(),
    });
  }
  return out;
}

// ───────────────────────────────────────────────────────────
// Economic calendar
// ───────────────────────────────────────────────────────────
export const ECONOMIC_EVENTS: EconomicEvent[] = [
  { id: "e1", time: "08:30", country: "US", flag: "🇺🇸", event: "Core CPI (MoM)", impact: "high", forecast: "0.3%", previous: "0.3%" },
  { id: "e2", time: "08:30", country: "US", flag: "🇺🇸", event: "Initial Jobless Claims", impact: "medium", forecast: "221K", previous: "219K" },
  { id: "e3", time: "10:00", country: "US", flag: "🇺🇸", event: "Fed Chair Speech", impact: "high", forecast: "—", previous: "—" },
  { id: "e4", time: "04:00", country: "EU", flag: "🇪🇺", event: "ECB Rate Decision", impact: "high", forecast: "3.15%", previous: "3.40%" },
  { id: "e5", time: "19:50", country: "JP", flag: "🇯🇵", event: "GDP (QoQ)", impact: "medium", forecast: "0.3%", previous: "0.2%" },
  { id: "e6", time: "02:00", country: "UK", flag: "🇬🇧", event: "Retail Sales (MoM)", impact: "low", forecast: "0.4%", previous: "-0.7%" },
];

// ───────────────────────────────────────────────────────────
// Earnings & IPO calendars
// ───────────────────────────────────────────────────────────
export const EARNINGS: EarningsItem[] = [
  { symbol: "NVDA", name: "NVIDIA", logoColor: "#76B900", date: "Feb 26", time: "AMC", epsEstimate: 0.85, revenueEstimate: 38.1e9 },
  { symbol: "CRM", name: "Salesforce", logoColor: "#00A1E0", date: "Feb 26", time: "AMC", epsEstimate: 2.61, revenueEstimate: 10.0e9 },
  { symbol: "AAPL", name: "Apple", logoColor: "#A2AAAD", date: "Jan 30", time: "AMC", epsEstimate: 2.35, epsActual: 2.4, revenueEstimate: 124.3e9 },
  { symbol: "AMZN", name: "Amazon", logoColor: "#FF9900", date: "Feb 6", time: "AMC", epsEstimate: 1.49, revenueEstimate: 187.3e9 },
  { symbol: "GOOGL", name: "Alphabet", logoColor: "#4285F4", date: "Feb 4", time: "AMC", epsEstimate: 2.13, revenueEstimate: 96.6e9 },
];

export const IPOS: IPOItem[] = [
  { symbol: "STRP", name: "Stripe", logoColor: "#635BFF", date: "Mar 2026", priceRange: [38, 42], shares: 120e6, exchange: "NASDAQ", valuation: 9.2e10 },
  { symbol: "DBX2", name: "Databricks", logoColor: "#FF3621", date: "Apr 2026", priceRange: [50, 56], shares: 90e6, exchange: "NASDAQ", valuation: 6.2e10 },
  { symbol: "CHMA", name: "Chime", logoColor: "#1EC677", date: "Feb 2026", priceRange: [22, 26], shares: 65e6, exchange: "NASDAQ", valuation: 2.5e10 },
  { symbol: "DISC", name: "Discord", logoColor: "#5865F2", date: "Q2 2026", priceRange: [30, 34], shares: 70e6, exchange: "NYSE", valuation: 1.5e10 },
];

// ───────────────────────────────────────────────────────────
// Heatmap
// ───────────────────────────────────────────────────────────
export function getHeatmap(): HeatmapTile[] {
  return COMPANIES.map((c) => ({
    symbol: c.symbol,
    name: c.name,
    changePercent: c.changePercent,
    marketCap: c.marketCap,
    sector: c.sector,
  }));
}

// ───────────────────────────────────────────────────────────
// Default watchlist
// ───────────────────────────────────────────────────────────
export function defaultWatchlist(): WatchlistItem[] {
  return ["AAPL", "NVDA", "MSFT", "TSLA", "AMZN", "META"].map((sym) => {
    const c = getCompany(sym)!;
    return { symbol: c.symbol, name: c.name, exchange: c.exchange };
  });
}
