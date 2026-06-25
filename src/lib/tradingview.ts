import { getCompany } from "./mock-data";

/** Map an in-app ticker to a TradingView "EXCHANGE:SYMBOL" identifier. */
export function tvSymbol(symbol: string): string {
  const c = getCompany(symbol);
  return c ? `${c.exchange}:${c.symbol}` : symbol.toUpperCase();
}

// Use continuously-traded CFD / global symbols (the set TradingView's own
// default widget uses). Cash-index symbols like TVC:SPX or NASDAQ:IXIC have no
// intraday feed in the free widget and render "No data here yet" when the US
// market is closed.

/** Indices / crypto / commodities for the ticker tape and market overview. */
export const TV_MARKET_SYMBOLS: { proName: string; title: string }[] = [
  { proName: "FOREXCOM:SPXUSD", title: "S&P 500" },
  { proName: "FOREXCOM:NSXUSD", title: "Nasdaq 100" },
  { proName: "FOREXCOM:DJI", title: "Dow Jones" },
  { proName: "BITSTAMP:BTCUSD", title: "Bitcoin" },
  { proName: "BITSTAMP:ETHUSD", title: "Ethereum" },
  { proName: "TVC:GOLD", title: "Gold" },
  { proName: "TVC:USOIL", title: "Crude Oil" },
];

export const TV_OVERVIEW_TABS = [
  {
    title: "Indices",
    symbols: [
      { s: "FOREXCOM:SPXUSD", d: "S&P 500" },
      { s: "FOREXCOM:NSXUSD", d: "Nasdaq 100" },
      { s: "FOREXCOM:DJI", d: "Dow 30" },
      { s: "INDEX:NKY", d: "Nikkei 225" },
      { s: "INDEX:DEU40", d: "DAX" },
      { s: "FOREXCOM:UKXGBP", d: "FTSE 100" },
    ],
    originalTitle: "Indices",
  },
  {
    title: "Crypto",
    symbols: [
      { s: "BITSTAMP:BTCUSD", d: "Bitcoin" },
      { s: "BITSTAMP:ETHUSD", d: "Ethereum" },
      { s: "BINANCE:SOLUSDT", d: "Solana" },
      { s: "BINANCE:XRPUSDT", d: "XRP" },
    ],
    originalTitle: "Crypto",
  },
  {
    title: "Commodities",
    symbols: [
      { s: "TVC:GOLD", d: "Gold" },
      { s: "TVC:SILVER", d: "Silver" },
      { s: "TVC:USOIL", d: "Crude Oil" },
      { s: "TVC:UKOIL", d: "Brent" },
    ],
    originalTitle: "Commodities",
  },
];
