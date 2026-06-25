-- ════════════════════════════════════════════════════════════════
-- AlphaEdge — PostgreSQL / Supabase schema
-- Run in the Supabase SQL editor or `psql`. Designed for RLS.
-- ════════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";   -- fuzzy company search

-- ── Enums ────────────────────────────────────────────────────────
create type sentiment   as enum ('bullish', 'bearish', 'neutral');
create type alert_op     as enum ('above', 'below', 'pct_change');
create type doc_status   as enum ('uploaded', 'processing', 'complete', 'failed');
create type statement_kind as enum ('income', 'balance', 'cashflow');
create type period_kind  as enum ('annual', 'quarterly', 'ttm');

-- ── Users (mirrors auth.users in Supabase) ───────────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  display_name  text,
  avatar_url    text,
  base_currency char(3)     not null default 'USD',
  plan          text        not null default 'free',
  created_at    timestamptz not null default now()
);

-- ── Companies (reference data) ───────────────────────────────────
create table companies (
  symbol        text primary key,
  name          text not null,
  isin          char(12) unique,
  exchange      text not null,
  sector        text,
  industry      text,
  logo_url      text,
  description   text,
  ceo           text,
  employees     integer,
  founded       smallint,
  headquarters  text,
  website       text,
  market_cap    numeric(20,2),
  updated_at    timestamptz not null default now()
);
create index idx_companies_name_trgm on companies using gin (name gin_trgm_ops);
create index idx_companies_sector     on companies (sector);

-- ── Quotes (latest price snapshot, hot table) ────────────────────
create table quotes (
  symbol         text primary key references companies(symbol) on delete cascade,
  price          numeric(18,4) not null,
  change         numeric(18,4),
  change_percent numeric(8,4),
  volume         bigint,
  day_low        numeric(18,4),
  day_high       numeric(18,4),
  updated_at     timestamptz not null default now()
);

-- ── News ─────────────────────────────────────────────────────────
create table news (
  id           uuid primary key default uuid_generate_v4(),
  headline     text not null,
  summary      text,
  source       text,
  category     text,
  sentiment    sentiment not null default 'neutral',
  image_url    text,
  url          text,
  symbols      text[] default '{}',          -- tickers mentioned
  published_at timestamptz not null,
  created_at   timestamptz not null default now()
);
create index idx_news_published on news (published_at desc);
create index idx_news_symbols   on news using gin (symbols);
create index idx_news_category  on news (category);

-- ── Financial statements ─────────────────────────────────────────
create table financial_statements (
  id         uuid primary key default uuid_generate_v4(),
  symbol     text not null references companies(symbol) on delete cascade,
  kind       statement_kind not null,
  period     period_kind   not null,
  fiscal_year smallint     not null,
  fiscal_quarter smallint,                    -- null for annual/ttm
  line_items jsonb         not null,          -- { "revenue": 391035, ... }
  created_at timestamptz   not null default now(),
  unique (symbol, kind, period, fiscal_year, fiscal_quarter)
);
create index idx_statements_symbol on financial_statements (symbol, kind);

-- ── Watchlists ───────────────────────────────────────────────────
create table watchlists (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null,
  position   smallint not null default 0,
  created_at timestamptz not null default now()
);
create index idx_watchlists_user on watchlists (user_id);

create table watchlist_items (
  id           uuid primary key default uuid_generate_v4(),
  watchlist_id uuid not null references watchlists(id) on delete cascade,
  symbol       text not null references companies(symbol) on delete cascade,
  added_at     timestamptz not null default now(),
  unique (watchlist_id, symbol)
);
create index idx_watchlist_items_wl on watchlist_items (watchlist_id);

-- ── Portfolios ───────────────────────────────────────────────────
create table portfolios (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references profiles(id) on delete cascade,
  name       text not null default 'Main Portfolio',
  created_at timestamptz not null default now()
);

create table positions (
  id           uuid primary key default uuid_generate_v4(),
  portfolio_id uuid not null references portfolios(id) on delete cascade,
  symbol       text not null references companies(symbol),
  quantity     numeric(18,6) not null,
  avg_cost     numeric(18,4) not null,
  opened_at    timestamptz not null default now()
);
create index idx_positions_portfolio on positions (portfolio_id);

-- ── Alerts ───────────────────────────────────────────────────────
create table alerts (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  symbol      text not null references companies(symbol) on delete cascade,
  op          alert_op not null,
  threshold   numeric(18,4) not null,
  is_active   boolean not null default true,
  triggered_at timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_alerts_user_active on alerts (user_id) where is_active;

-- ── Documents (scanner) ──────────────────────────────────────────
create table documents (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles(id) on delete cascade,
  file_name   text not null,
  storage_path text not null,
  symbol      text references companies(symbol),
  status      doc_status not null default 'uploaded',
  analysis    jsonb,                          -- executive summary, bull/bear, risks…
  created_at  timestamptz not null default now()
);
create index idx_documents_user on documents (user_id);

-- ════════════════════════════════════════════════════════════════
-- Row Level Security — users only touch their own rows
-- ════════════════════════════════════════════════════════════════
alter table profiles        enable row level security;
alter table watchlists      enable row level security;
alter table watchlist_items enable row level security;
alter table portfolios      enable row level security;
alter table positions       enable row level security;
alter table alerts          enable row level security;
alter table documents       enable row level security;

create policy "own profile"    on profiles    for all using (auth.uid() = id);
create policy "own watchlists" on watchlists   for all using (auth.uid() = user_id);
create policy "own alerts"     on alerts        for all using (auth.uid() = user_id);
create policy "own portfolios" on portfolios    for all using (auth.uid() = user_id);
create policy "own documents"  on documents     for all using (auth.uid() = user_id);
create policy "own wl items"   on watchlist_items for all using (
  exists (select 1 from watchlists w where w.id = watchlist_id and w.user_id = auth.uid())
);
create policy "own positions"  on positions for all using (
  exists (select 1 from portfolios p where p.id = portfolio_id and p.user_id = auth.uid())
);

-- Reference data is world-readable
create policy "public read companies" on companies for select using (true);
