// ───────────────────────────────────────────────────────────
// AlphaEdge — Core domain types
// ───────────────────────────────────────────────────────────

export type Sentiment = "bullish" | "bearish" | "neutral";
export type Trend = "up" | "down" | "flat";

export interface Quote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
}

export interface IndexQuote extends Quote {
  category: "index" | "crypto" | "commodity" | "forex";
  spark: number[];
}

export interface Company {
  symbol: string;
  name: string;
  isin: string;
  exchange: string;
  sector: string;
  industry: string;
  logoColor: string;
  description: string;
  ceo: string;
  employees: number;
  founded: number;
  headquarters: string;
  website: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  dayRange: [number, number];
  yearRange: [number, number];
  stats: CompanyStats;
}

export interface CompanyStats {
  peRatio: number;
  forwardPE: number;
  pegRatio: number;
  revenue: number;
  netIncome: number;
  ebitda: number;
  freeCashFlow: number;
  sharesOutstanding: number;
  roe: number;
  roic: number;
  debtToEquity: number;
  dividendYield: number;
  beta: number;
  eps: number;
}

export interface Candle {
  time: number; // epoch ms
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type Timeframe = "1D" | "5D" | "1M" | "6M" | "1Y" | "5Y" | "MAX";

export interface NewsArticle {
  id: string;
  headline: string;
  summary: string;
  source: string;
  symbols: string[];
  category: string;
  sentiment: Sentiment;
  imageColor: string;
  publishedAt: string; // ISO
  url: string;
}

export interface EconomicEvent {
  id: string;
  time: string;
  country: string;
  flag: string;
  event: string;
  impact: "high" | "medium" | "low";
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface EarningsItem {
  symbol: string;
  name: string;
  logoColor: string;
  date: string;
  time: "BMO" | "AMC";
  epsEstimate: number;
  epsActual?: number;
  revenueEstimate: number;
}

export interface IPOItem {
  symbol: string;
  name: string;
  logoColor: string;
  date: string;
  priceRange: [number, number];
  shares: number;
  exchange: string;
  valuation: number;
}

export interface WatchlistItem {
  symbol: string;
  name: string;
  exchange: string; // for the TradingView "EXCHANGE:SYMBOL" quote
}

export interface Watchlist {
  id: string;
  name: string;
  items: WatchlistItem[];
}

export interface FinancialRow {
  label: string;
  values: number[]; // most-recent-first
  isHeader?: boolean;
  growth?: boolean;
}

export interface FinancialStatement {
  periods: string[];
  income: FinancialRow[];
  balance: FinancialRow[];
  cashflow: FinancialRow[];
}

export interface DocumentAnalysis {
  fileName: string;
  company: string;
  period: string;
  executiveSummary: string;
  keyTakeaways: string[];
  bullCase: string[];
  bearCase: string[];
  riskFactors: string[];
  metrics: { label: string; value: string; change?: string }[];
}

export interface HeatmapTile {
  symbol: string;
  name: string;
  changePercent: number;
  marketCap: number;
  sector: string;
}
