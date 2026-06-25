# AlphaEdge — Markets, News & Research Terminal

A premium, Bloomberg/TradingView-inspired financial research platform built with **Next.js 15**, **React 19**, **TypeScript**, **TailwindCSS**, **Framer Motion**, **Zustand** and **React Query**.

![theme](https://img.shields.io/badge/theme-dark%20terminal-00C853) ![next](https://img.shields.io/badge/Next.js-15-black)

## Quick start

```bash
npm install
npm run dev      # http://localhost:3000
```

> **Real-time market data and charts are live out of the box** via embedded [TradingView](https://www.tradingview.com) widgets — no API key, no backend. Quotes, charts, news, heatmap, screeners, the ticker tape and fundamentals all stream real data.

### Universal company coverage

The platform is **not limited to a seed list** — any ticker, company name, or ISIN across global exchanges (NYSE, NASDAQ, LSE, Euronext, TSE, HKEX, NSE, …) resolves on demand. `src/lib/providers/discovery.ts` is a provider-fallback chain:

```
TradingView symbol search (global, no key)  →  Finnhub (if key)  →  local seed (offline)
```

- **Search** (`/api/search`, debounced in the nav) returns global matches with exchange + country flag.
- **`/company/[symbol]`** renders dynamically for *any* symbol — unknown ones are resolved live (name/exchange), given a generated logo, and populated entirely from TradingView (quote, chart, financials, technicals, news). Try `/company/VOD?ex=LSE` or `/company/7203?ex=TSE`.
- **AI analysis** per company via `/api/company-summary/[symbol]` (Claude), and a **SEC EDGAR** filings deep link.
- The watchlist stores `{symbol, name, exchange}`, so **any** discovered company is watchable.

Add Polygon / FMP / Alpha Vantage / Twelve Data / OpenFIGI by implementing the `SearchProvider` interface and inserting it into the chain.

### News Intelligence

Every company page has an **"Analyze News"** button that runs a Claude (`opus-4-8`) research pass with **live web search** across Reuters, AP, BBC, the Guardian, NPR, DW & France24, returning a Bloomberg-style brief:

- Overall **sentiment** + 0–100 score + 7D/30D trend
- Per-article **sentiment + impact (Low→Critical) + category**, with sentiment/impact/source/keyword **filters**
- Recurring **themes**, **emerging risks/opportunities**, and a **forward read** on revenue / earnings / cash flow / valuation
- **Financial-statement impact** (links to `/statements`) and an **event timeline**

It's button-gated (no auto-spend) and falls back to model knowledge if web tools are unavailable. The full ingestion / storage / dedup / alerts architecture and Postgres schema are in [`NEWS_INTELLIGENCE.md`](NEWS_INTELLIGENCE.md).

### Documents ↔ financials integration

Uploaded documents are linked to a company and surfaced across the app:

- **Scanner** (`/documents`) — pick a company (or it auto-detects the ticker from the extracted name), Claude analyzes the PDF, and the result is saved to a persisted library (`useDocStore`, localStorage) linked to that ticker. A "Your Documents" list cross-links each doc to its company.
- **Statements** (`/statements?symbol=…`) — universal for any company, with two sections: a visually-distinct **"Source: User Uploaded Documents"** box (blue accent + `DOCUMENT SOURCE` badge, extracted metrics + commentary, link back to the scanner) **above** the **"Reported (Official)"** TradingView financials. Per the merging rules, API data is the baseline and is never overwritten by document data.
- **Company profile** — a sidebar **Documents** card shows the count + latest uploaded document.

> Persistence is client-side (localStorage) — instant, but per-browser. The `supabase/schema.sql` `documents` table is the server-side seam for multi-user storage + background extraction at scale.

### Real-time data — TradingView widgets

All market-facing surfaces are powered by TradingView's free embeddable widgets through one wrapper (`src/components/tradingview/tv-widget.tsx`):

| Surface | Widget |
|---|---|
| Charts page + company chart | **Advanced Chart** (candles, every indicator, drawing tools, all timeframes) |
| Top-nav ticker | **Ticker Tape** |
| Dashboard hero | **Market Overview** (indices / crypto / commodities tabs) |
| Breaking news + per-company news | **Timeline** |
| Trending movers | **Hotlists** (gainers / losers / active) |
| Heatmap | **Stock Heatmap** (S&P 500 by sector) |
| Economic calendar | **Events** |
| Company quote + watchlist tiles | **Symbol Info / Single Quote** |
| Financial statements + company fundamentals | **Financials** |
| Company technicals | **Technical Analysis** gauge |

`src/lib/tradingview.ts` maps in-app tickers to `EXCHANGE:SYMBOL` and defines the index/crypto/commodity symbol sets.

### Optional extra integrations

| Capability | Provider | Env var | Without the key |
|---|---|---|---|
| Real AI document analysis on `/documents` | Anthropic Claude (`claude-opus-4-8`) | `ANTHROPIC_API_KEY` | Curated sample 10-K analysis |
| JSON market-data API routes (`/api/news`, `/api/quote`, `/api/search`) | [Finnhub](https://finnhub.io) | `FINNHUB_API_KEY` | Deterministic mock responses |

- **Document analysis** (`/api/analyze`) sends the uploaded PDF to Claude as a base64 `document` block with `output_config.format` (JSON-schema-constrained structured output), so the response always matches the `DocumentAnalysis` type.
- The Finnhub-backed `/api/*` routes remain as a typed JSON data layer (they no longer drive the UI, which uses TradingView directly).

## What's inside

| Page | Route | Highlights |
|------|-------|-----------|
| **Dashboard** | `/` | Market overview hero (S&P/Nasdaq/Dow/BTC/ETH/Gold/Oil), infinite-scroll news feed with sentiment, movers, heatmap, economic/earnings/IPO calendars |
| **Search** | `/search` | Ticker / name / ISIN autocomplete, ⌘K command palette, recent + trending |
| **Company** | `/company/[symbol]` | Real-time quote, TradingView chart, live fundamentals, technical rating, per-company news, watch toggle |
| **Watchlist** | `/watchlist` | Multiple Zustand-persisted lists, real-time quote tiles, add/remove |
| **Charts** | `/charts` | Full TradingView Advanced Chart — candles, indicators, drawing tools, all timeframes |
| **Documents** | `/documents` | Drag-drop 10-K/10-Q scanner → real Claude analysis (summary, bull/bear, risks) |
| **Statements** | `/statements` | Real-time income / balance / cash-flow fundamentals per symbol |
| **Settings** | `/settings` | Profile, appearance, notifications |

## Architecture

```
src/
├─ app/                 # App Router pages + API route handlers
│  ├─ api/              # /news /search /company /charts /statements
│  ├─ company/[symbol]/ # dynamic profile (SSG via generateStaticParams)
│  └─ …pages
├─ components/
│  ├─ ui/               # shadcn-style primitives (Button, Card, Badge, Sparkline…)
│  ├─ layout/           # Sidebar, TopNav, global SearchCommand
│  ├─ tradingview/      # TradingViewWidget — wrapper for all real-time widgets
│  ├─ dashboard/        # MarketOverview, NewsFeed, Movers, Heatmap, Calendars (TradingView-backed)
│  ├─ charts/           # TickerChart (TradingView Advanced Chart)
│  └─ company/          # WatchButton
├─ lib/                 # utils, mock-data, financials (the data layer)
├─ store/               # Zustand (watchlists + search history, persisted)
└─ types/               # shared domain types
```

- **Design system** — tokens in `tailwind.config.ts` (`#0A0A0A` bg, `#00C853` accent), glassmorphism + premium shadows + skeleton shimmer in `globals.css`.
- **Charting & data** — real-time TradingView widgets (see the table above). A dependency-light custom SVG renderer (`charts/price-chart.tsx`) and the deterministic mock-data layer remain in the repo as an offline/no-network fallback.
- **State** — Zustand with `persist` for watchlists/searches; React Query provider wired for swapping mock calls to live endpoints.
- **Database** — full Postgres/Supabase schema with RLS in [`supabase/schema.sql`](supabase/schema.sql): Users, Companies, Quotes, News, FinancialStatements, Watchlists, Portfolios, Positions, Alerts, Documents — with indexes, enums, relationships and row-level-security policies.

## Going to production

1. **Live market data** — done: set `FINNHUB_API_KEY`. To deepen it, extend `src/lib/providers/finnhub.ts` with candles/fundamentals and point `TickerChart` / the statistics grid at `/api/charts` & `/api/statements`.
2. **AI document analysis** — done: set `ANTHROPIC_API_KEY`. For large filings, switch `/api/analyze` to the Files API + streaming.
3. **Auth & persistence** — apply `supabase/schema.sql`, wire `@supabase/supabase-js`, enable auth → swap the mock profile in `TopNav`/`Settings` and move watchlists/alerts server-side.
