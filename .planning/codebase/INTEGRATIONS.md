# External Integrations

**Analysis Date:** 2026-05-11

## APIs & External Services

**Database / Backend-as-a-Service:**
- Supabase — primary data store, auth, file storage, realtime messaging
  - SDK: `@supabase/supabase-js`, `@supabase/ssr`
  - Browser client: `src/lib/supabase/client.ts`
  - Server client: `src/lib/supabase/server.ts`
  - Admin client (service role): `src/lib/supabase/admin.ts`
  - Middleware session refresh: `src/lib/supabase/middleware.ts`
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Admin: `SUPABASE_SERVICE_ROLE_KEY`

**Payments:**
- Stripe — subscription billing (monthly/yearly Pro plans)
  - SDK: `stripe` ^22.1.1
  - Client singleton: `src/lib/stripe.ts`
  - Checkout: `src/app/api/stripe/checkout/route.ts`
  - Customer portal: `src/app/api/stripe/portal/route.ts`
  - Webhook handler: `src/app/api/stripe/webhook/route.ts`
    - Events handled: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
  - Auth: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Price IDs: `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`

**Calendar:**
- Google Calendar API v3 — free/busy queries, event creation (with Google Meet), event deletion
  - SDK: `googleapis` ^171.4.0
  - Provider: `src/lib/scheduling/GoogleCalendarProvider.ts`
  - OAuth flow: `src/app/api/calendar/auth/route.ts`, `src/app/api/calendar/callback/route.ts`
  - Scopes: `calendar.events`, `calendar.readonly`, `userinfo.email`
  - Auth: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
  - CSRF protection: nonce stored in `gcal_oauth_nonce` httpOnly cookie

**Email:**
- Resend — transactional email delivery
  - SDK: `resend` ^6.9.3
  - Client: `src/lib/resend.ts`
  - Usage: welcome/verification emails on signup (`src/app/auth/actions.ts`)
  - Auth: `RESEND_API_KEY`

**CAPTCHA:**
- hCaptcha — bot protection on login and signup forms
  - SDK: `@hcaptcha/react-hcaptcha` ^2.0.2
  - Component: `src/components/captcha.tsx`
  - Auth: `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`
  - Dev bypass: `NODE_ENV === 'development'` skips CAPTCHA verification

**Fonts:**
- Google Fonts (via `next/font/google`) — Geist Sans, Playfair Display
  - Loaded in `src/app/layout.tsx`; no API key required

## Data Storage

**Databases:**
- Supabase (PostgreSQL)
  - Connection: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client) / `SUPABASE_SERVICE_ROLE_KEY` (admin)
  - ORM/Client: `@supabase/supabase-js` query builder
  - Key tables: `users`, `subscriptions`, `athlete_profiles` (inferred from queries and SQL migration files)
  - Migrations: `supabase_*.sql` files at repo root (manual SQL migrations)

**File Storage:**
- Supabase Storage — profile photos, resume uploads, message attachments
  - Used in: `src/app/(dashboard)/profile/actions.ts`, `src/app/(dashboard)/messages/messages-client.tsx`
  - Public URLs retrieved via `supabase.storage.from(...).getPublicUrl(...)`

**Caching:**
- None detected (no Redis, Upstash, or other cache layer)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth — email/password with email confirmation
  - `signInWithPassword` with hCaptcha token (`src/app/auth/actions.ts`)
  - `signUp` with email redirect to `/auth/callback` (`src/app/auth/callback/`)
  - Session managed via cookies; refreshed in middleware (`src/middleware.ts`)
  - `.edu` email required for student-athlete role at signup
  - Admin-level user operations via `SUPABASE_SERVICE_ROLE_KEY`

## Monitoring & Observability

**Error Tracking:**
- Not detected (no Sentry, Datadog, or similar)

**Logs:**
- `console.error` / `console.log` throughout server-side code (no structured logging library)

## CI/CD & Deployment

**Hosting:**
- Vercel (`vercel.json` — framework: nextjs, version: 2)

**CI Pipeline:**
- Not detected (no GitHub Actions, CircleCI, etc. config files found)

## Realtime

- Supabase Realtime — used for live notifications and messaging
  - Notification channel: `src/contexts/notification-context.tsx` (`global-notifications`)
  - Message channels: `src/app/(dashboard)/messages/messages-client.tsx` (`messages-{id}`, `typing-{id}`)
  - Header notification badge: `src/components/dashboard-header.tsx` (`header-notifications`)

## Webhooks & Callbacks

**Incoming:**
- `POST /api/stripe/webhook` — Stripe subscription lifecycle events
  - Verified via `STRIPE_WEBHOOK_SECRET` + `stripe.webhooks.constructEvent`

**Outgoing:**
- Google Calendar sends email invites to attendees when events are created/deleted (`sendUpdates: 'all'` in `src/lib/scheduling/GoogleCalendarProvider.ts`)

## Environment Configuration

**Required env vars:**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_ID_MONTHLY
STRIPE_PRICE_ID_YEARLY

# Google Calendar OAuth
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI        # Optional; falls back to NEXT_PUBLIC_APP_URL + /api/calendar/callback

# Resend (email)
RESEND_API_KEY

# hCaptcha
NEXT_PUBLIC_HCAPTCHA_SITE_KEY

# App URL
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_SITE_URL       # Used for email redirect URLs
VERCEL_URL                 # Auto-set by Vercel; used as fallback for email redirects
```

**Secrets location:**
- `.env.local` for local development (not committed)
- Vercel environment variables for production
