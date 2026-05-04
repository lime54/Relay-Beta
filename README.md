# Relay

A private, verified career network for current and former NCAA student-athletes.
Built with Next.js (App Router), TypeScript, Tailwind, and Supabase.

See `docs/PRD.md` for product context and `docs/KNOWLEDGEBASE.md` for domain knowledge.

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Create `.env.local` at the repo root with the following:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Supabase anon key |
| `NEXT_PUBLIC_APP_URL` | yes | e.g. `http://localhost:3000` — used to build OAuth redirect URIs |
| `GOOGLE_CLIENT_ID` | for calendar booking | OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | for calendar booking | OAuth client secret |
| `GOOGLE_REDIRECT_URI` | optional | Defaults to `${NEXT_PUBLIC_APP_URL}/api/calendar/callback` |
| `RESEND_API_KEY` | optional | Welcome emails after sign-up |
| `OPENAI_API_KEY` | optional | AI request refinement |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | optional | hCaptcha site key |

### Setting up Google Calendar OAuth

1. Create an OAuth client in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add `${NEXT_PUBLIC_APP_URL}/api/calendar/callback` as an authorized redirect URI.
3. Enable the **Google Calendar API**.
4. Copy the client ID/secret into `.env.local`.

## Database migrations

Run the SQL files in this order via the Supabase SQL editor (Dashboard → SQL Editor):

1. `supabase_schema.sql` — base tables (`users`, `athlete_profiles`, `messages`, …)
2. `supabase_migration.sql` — column-level additions to `athlete_profiles`
3. `supabase_scheduling_migration.sql` — **new**: `calendar_connections`, `availability_rules`, `bookings`

The scheduling migration is required for the calendar booking feature to work.

## Scripts

```bash
npm run dev         # start dev server
npm run build       # production build
npm run lint        # eslint
npm run test        # playwright e2e
npm run test:ui     # playwright UI mode
```

## Project layout

- `src/app` — App Router pages and route handlers
- `src/components` — UI and feature components
- `src/lib/supabase` — SSR-aware Supabase clients
- `src/lib/scheduling` — Calendar provider + booking service
- `tests` — Playwright e2e tests
