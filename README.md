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

## Setting up Google Calendar OAuth

The "Connect Google" button on `/settings/calendar` uses Google OAuth 2.0. If you see **"Error 400: invalid_request"** on Google's consent screen, or `?error=not_configured` in the app, it means the OAuth credentials haven't been set up yet. Follow these steps from start to finish — don't skip any.

### 1. Create the OAuth client in Google Cloud Console

1. Go to https://console.cloud.google.com/apis/credentials (sign in with the Google account that should own the app).
2. If you don't have a project yet, click the project dropdown at the top and create one.
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**.
4. If Google asks you to configure the OAuth consent screen first, click **Configure consent screen**:
   - User type: **External** (unless you're a Google Workspace admin and want Internal).
   - Fill in app name, support email, developer contact email.
   - Save and continue through the scopes screen (you can add scopes later).
   - Under **Test users**, add your own Gmail address (and any other Google accounts that should be able to test). While the app is in **Testing** mode, only listed test users can connect.
5. Back on **Create OAuth client ID**: choose application type **Web application**.
6. Under **Authorized redirect URIs**, add BOTH of these (replace `<your-domain>` with your real deployed domain — e.g. `your-app.vercel.app`):
   - `https://<your-domain>/api/calendar/callback`
   - `http://localhost:3000/api/calendar/callback` (for local development)

   ⚠️ The redirect URI must match **exactly** — including `https` vs `http`, no trailing slash, and the `/api/calendar/callback` path. If it doesn't match, Google returns `Error 400: redirect_uri_mismatch` or `invalid_request`.
7. Click **Create**. Google will show you a **Client ID** and **Client Secret**. Copy both.

### 2. Add the environment variables

The app needs three environment variables:

| Variable | Value |
| --- | --- |
| `GOOGLE_CLIENT_ID` | The Client ID from step 1.7 |
| `GOOGLE_CLIENT_SECRET` | The Client Secret from step 1.7 |
| `NEXT_PUBLIC_APP_URL` | Your deployed site URL (e.g. `https://your-app.vercel.app`) — no trailing slash |

**On Vercel:**
1. Go to your project → **Settings** → **Environment Variables**.
2. Add each of the three variables. For each one, check **Production**, **Preview**, and **Development** so they're available everywhere.
3. Click **Save**, then go to the **Deployments** tab and **redeploy** (env var changes only take effect on a new deploy).

**For local development**, create a file called `.env.local` in the project root:

```bash
GOOGLE_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Then restart `npm run dev` so Next.js picks up the new env vars.

### 3. Make sure the right scopes are enabled

The app requests these Google API scopes:

- `https://www.googleapis.com/auth/calendar.events` (read/write calendar events)
- `https://www.googleapis.com/auth/calendar.readonly` (read calendar)
- `https://www.googleapis.com/auth/userinfo.email` (read your email so we know which Google account you connected)

In Google Cloud Console → **APIs & Services** → **OAuth consent screen** → **Scopes**, click **Add or Remove Scopes** and make sure those three are selected. If your app is still in **Testing** status, this is enough. If you've published it, sensitive scopes may need verification — Google has docs on that.

### 4. Test it

1. Open `/settings/calendar` in the app.
2. Click **Connect Google**.
3. You should be redirected to Google's consent screen, see your app name, pick a test-user account, and approve.
4. Google redirects back to `/settings/calendar?success=calendar_connected`.

### Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Browser shows `?error=not_configured` and never reaches Google | `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is missing/empty in env. |
| Browser shows `?error=missing_app_url` | `NEXT_PUBLIC_APP_URL` is missing in env. |
| Google shows **Error 400: redirect_uri_mismatch** | The redirect URI registered in Google Cloud doesn't match what the app sends. The error banner on `/settings/calendar` shows the exact URL — copy it into **Authorized redirect URIs** in Google Cloud Console. |
| Google shows **Error 400: invalid_request** | Usually the same as above, or `NEXT_PUBLIC_APP_URL` has a typo (e.g. trailing slash, missing `https://`). |
| Google shows **"This app isn't verified" / access blocked** | Add your Google account as a **Test user** on the OAuth consent screen, or publish the app for full verification. |
| `?error=oauth_failed` after clicking Connect | The code was returned but exchanging it failed — usually a wrong `GOOGLE_CLIENT_SECRET`. Double-check it. |

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
