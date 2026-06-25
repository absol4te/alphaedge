# News Intelligence — Architecture & Implementation Plan

This documents the full News Intelligence system. The **AI research engine + UI is built and
working today** (Claude + live web search, universal coverage, sentiment, impact, themes,
statement impact, timeline, filtering). The **ingestion / storage / real-time / alerts pipeline**
below is the production design — the seams are in place (`supabase/schema.sql`, the provider
abstraction, the notifications UI) but it requires a backend (Postgres + Redis + a worker/queue).

---

## What's built now (in this repo)

| Capability | Where | Status |
|---|---|---|
| **"Analyze News" research engine** | `src/app/api/news-analysis/[symbol]/route.ts` | ✅ Claude `opus-4-8` + `web_search` server tool; falls back to model knowledge; JSON-structured |
| Universal coverage (any company) | web search resolves any name/ticker | ✅ |
| Source prioritization (Reuters/AP/BBC/Guardian/NPR/DW/France24) | route system prompt | ✅ |
| Overall sentiment + score + 7D/30D trend | `news-intelligence.tsx` | ✅ |
| Per-article sentiment + impact (Low→Critical) + category | `news-intelligence.tsx` | ✅ |
| AI brief, themes, emerging risks/opportunities, forward read (rev/EPS/CF/valuation) | `news-intelligence.tsx` | ✅ |
| Financial-statement impact (links to `/statements`) | `news-intelligence.tsx` | ✅ |
| Event timeline | `news-intelligence.tsx` | ✅ |
| Filtering (sentiment / impact / source / keyword) | `news-intelligence.tsx` | ✅ |
| Live headline feed (multi-source, real-time) | TradingView Timeline widget on the company page | ✅ |
| Follow company (alerts opt-in) | `WatchButton` + `NotificationsMenu` | ✅ UI |

### To scale beyond on-demand analysis (designed, not built)
Persisted article store, real-time ingestion, dedup at scale, source-reliability scoring,
sentiment history charts from stored data, and real alert delivery — all below.

---

## Database schema (Postgres / Supabase)

```sql
-- Sources with reliability scoring
create table news_sources (
  id           text primary key,           -- 'reuters','ap','bbc','guardian','npr','dw','france24'
  name         text not null,
  base_url     text,
  reliability  numeric(3,2) not null default 0.80,  -- 0–1, tunable
  tier         smallint not null default 1,          -- 1 = wire/primary
  enabled      boolean not null default true
);

-- Company aliases (private cos / non-ticker matching)
create table company_aliases (
  id         uuid primary key default uuid_generate_v4(),
  symbol     text references companies(symbol) on delete cascade, -- null for private
  alias      text not null,
  kind       text not null default 'name',  -- name | former_name | brand | ticker | isin
  unique (alias, kind)
);
create index idx_aliases_alias_trgm on company_aliases using gin (alias gin_trgm_ops);

-- Canonical articles (deduplicated)
create table news_articles (
  id            uuid primary key default uuid_generate_v4(),
  source_id     text references news_sources(id),
  url           text not null,
  url_canonical text not null,                 -- normalized for dedup
  simhash       bigint,                         -- near-duplicate clustering
  headline      text not null,
  summary       text,
  body          text,
  author        text,
  published_at  timestamptz not null,
  ingested_at   timestamptz not null default now(),
  category      text,                           -- earnings|m&a|regulatory|executive|product|market|industry|breaking
  language      char(2) default 'en',
  unique (url_canonical)
);
create index idx_articles_published on news_articles (published_at desc);
create index idx_articles_simhash   on news_articles (simhash);

-- Article ↔ company (many-to-many; one article can mention several tickers)
create table article_companies (
  article_id uuid references news_articles(id) on delete cascade,
  symbol     text references companies(symbol) on delete cascade,
  relevance  numeric(3,2) not null default 0.5,
  primary key (article_id, symbol)
);
create index idx_article_companies_symbol on article_companies (symbol);

-- AI enrichment per (article, company)
create table article_analysis (
  article_id  uuid references news_articles(id) on delete cascade,
  symbol      text references companies(symbol) on delete cascade,
  sentiment   sentiment not null,               -- bullish|neutral|bearish (enum)
  sentiment_score numeric(4,1),                  -- -100..100
  impact      text not null,                     -- Low|Medium|High|Critical
  impact_factors jsonb,                          -- {revenue,regulatory,market,reputation,competitive}
  executive_summary text,
  key_takeaways  jsonb,
  financial_impact text,
  risks       jsonb,
  opportunities jsonb,
  metrics     jsonb,                             -- extracted numbers
  quotes      jsonb,
  statement_tags text[],                         -- ['income','balance','cashflow']
  model       text default 'claude-opus-4-8',
  created_at  timestamptz not null default now(),
  primary key (article_id, symbol)
);

-- Pre-aggregated daily sentiment for fast trend charts (7D/30D)
create table sentiment_daily (
  symbol      text references companies(symbol) on delete cascade,
  day         date not null,
  avg_score   numeric(5,2),
  article_count integer,
  bullish     integer, neutral integer, bearish integer,
  primary key (symbol, day)
);

-- Alerts (reuses the alerts table in schema.sql; news-specific kinds)
-- alert kind ∈ breaking | high_impact | earnings | regulatory
create table alert_deliveries (
  id         uuid primary key default uuid_generate_v4(),
  alert_id   uuid references alerts(id) on delete cascade,
  article_id uuid references news_articles(id),
  delivered_at timestamptz not null default now(),
  channel    text not null default 'in_app'      -- in_app | email | push
);
```

---

## API architecture

```
GET  /api/news?symbol=&category=&sentiment=&impact=&source=&from=&to=&q=&cursor=
        → paginated, filtered article feed (from news_articles + article_analysis)
GET  /api/news/sentiment?symbol=&window=7|30        → sentiment_daily series for charts
POST /api/news-analysis/:symbol                      → on-demand AI brief  [BUILT]
GET  /api/news/timeline?symbol=                      → merged news + earnings + filings events
POST /api/alerts                                     → follow company + alert kinds
GET  /api/sources                                    → source list + reliability
```

All read endpoints are **cache-first** (Redis, 30–60s TTL keyed by query) → Postgres fallback.

---

## Backend services (workers)

1. **Ingestion workers** — one adapter per source (RSS/official APIs). Normalize → `NewsArticle`.
   Behind the same `SearchProvider`-style abstraction as `src/lib/providers/`.
2. **Dedup service** — canonicalize URL, compute SimHash on headline+lede, cluster near-duplicates
   (Hamming distance ≤ 3), keep the highest-reliability source as canonical.
3. **Entity linker** — map articles to tickers via `company_aliases` (trigram + exact ticker/ISIN),
   relevance-scored; ambiguous → lower relevance, never silently mis-attach.
4. **Enrichment workers** — queue (BullMQ/SQS) → Claude batch (`/v1/messages/batches`, 50% cost)
   for sentiment/impact/summary/metrics → `article_analysis`.
5. **Aggregator** — rolls `article_analysis` into `sentiment_daily` (cron, per symbol per day).
6. **Alert dispatcher** — on new High/Critical or category-matched article, fan out to followers'
   `alerts` → `alert_deliveries` (in-app now; email/push via provider).

```
sources ──▶ ingest ──▶ dedup ──▶ entity-link ──▶ enrich (Claude batch) ──▶ Postgres
                                                       │
                                          aggregate ◀──┘──▶ alerts dispatch ──▶ users
                          Redis cache sits in front of all reads
```

---

## AI workflows

- **On-demand brief** (built): single `messages.create` with `web_search` → structured JSON.
- **Per-article enrichment** (batch): `messages.batches` for cost; `output_config.format` JSON schema
  for sentiment/impact/takeaways/metrics/quotes/statement-tags.
- **"Analyze News" research mode** (built): synthesizes recurring themes, emerging risks/opportunities,
  and a forward read on revenue/earnings/cash-flow/valuation.
- **Statement linking**: keyword + LLM tags (layoffs→opex/headcount, buyback→financing CF + equity,
  debt issuance→balance sheet + financing CF, capex/new factory→investing CF + PP&E, acquisition→
  goodwill/intangibles) → highlights on `/statements`.

---

## Scaling, dedup, reliability

- **Millions of articles**: time-partition `news_articles` by month; hot index on `published_at`;
  archive cold partitions to object storage.
- **Real-time**: ingestion → `pg_notify`/Redis pub-sub → SSE/WebSocket to the client feed.
- **Caching**: Redis read-through for feeds + sentiment series; pre-warm popular tickers.
- **Dedup**: URL canonicalization + SimHash clustering (above).
- **Source reliability**: per-source `reliability`/`tier` weights sentiment aggregation and breaks ties
  in dedup; tunable from outcomes.
