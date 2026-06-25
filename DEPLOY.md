# AlphaEdge — Project Setup & Deploy

Everything you need to take this from a local folder to a live project.

## 1. What it is
A **Next.js 15 / React 19 / TypeScript / Tailwind** financial-news terminal. The project root is
the `alphaedge/` folder. Build is green; 19 pages + 13 API routes.

## 2. Prerequisites
- **Node.js 20+** (works on 18.18+), npm 10+
- Git (to push to GitHub)
- A hosting account — **Vercel** is the natural fit for Next.js (free Hobby tier works)

## 3. Environment variables
Create `alphaedge/.env.local` (copy from `.env.example`). **All are optional** — the app runs
without them; they unlock the AI / live-data features.

| Var | Powers | Needed? |
|---|---|---|
| `ANTHROPIC_API_KEY` | AI features: Earnings extraction, "Analyze News", company AI summary, document scanner | Optional — **requires credits** (console.anthropic.com → Plans & Billing) |
| `FINNHUB_API_KEY` | The `/api/*` JSON quote/news routes (live prices) | Optional — free tier at finnhub.io |

> News (RSS/Reuters/Yahoo), TradingView charts, search, watchlist, theme — **need no keys at all.**

## 4. Run locally
```bash
cd alphaedge
npm install
npm run dev      # http://localhost:3000
# production:
npm run build
npm start
```

## 5. Put it in Git + GitHub
```bash
cd alphaedge
git init
git add .
git commit -m "AlphaEdge financial terminal"
gh repo create alphaedge --private --source=. --push   # or create the repo on github.com and push
```
`.gitignore` is already set (excludes `node_modules`, `.next`, `.env*.local`, so **your keys are never committed**).

## 6. Deploy to Vercel
1. Push to GitHub (step 5).
2. vercel.com → **New Project** → import the repo. Set **Root Directory = `alphaedge`** if you pushed the parent folder; if you pushed `alphaedge/` itself, leave it as root.
3. Framework preset auto-detects **Next.js** — no build config needed.
4. **Settings → Environment Variables**: add `ANTHROPIC_API_KEY` and/or `FINNHUB_API_KEY`.
5. Deploy. Done — you get a `*.vercel.app` URL.

CLI alternative:
```bash
cd alphaedge
npx vercel            # link + deploy preview
npx vercel --prod     # production
```

## 7. ⚠️ Important deploy gotchas
- **Long AI routes & serverless timeouts.** `/api/earnings`, `/api/news-analysis`, and
  `/api/company-summary` run Claude + live web search and can take **60–120s+**. They set
  `export const maxDuration`, but the cap depends on the host:
  - **Vercel Hobby** caps functions at **60s** → the earnings/news-analysis briefs may time out.
  - **Vercel Pro** allows up to **300s** → set those routes accordingly (already declared).
  - Or host on **Render / Railway / Fly.io / a VPS** running `next start` (no per-request cap).
  If briefs time out on Hobby, the simplest fixes: upgrade to Pro, or swap those routes to a
  keyed earnings/news API (instant) instead of Claude+web-search.
- **Unofficial data sources.** Yahoo Finance, Reuters-via-Google-News, and the RSS feeds are public
  but unofficial — they can rate-limit or change. The code already falls back gracefully (mock /
  skip). For production reliability, move to licensed feeds (FMP/Finnhub/Polygon, an official news API).
- **Persistence is client-side (localStorage).** Watchlists, documents, price targets, theme are
  per-browser. To make them multi-user/server-side: apply `supabase/schema.sql`, add
  `@supabase/supabase-js`, and wire auth (the schema + RLS are ready; it's the documented next step).

## 8. Optional polish before shipping
- Replace the seeded mock company universe / earnings calendar with a real API.
- Add real auth (Supabase) + a database for documents/watchlists/alerts.
- Add `vercel.json` only if you need custom regions/caching — not required.
