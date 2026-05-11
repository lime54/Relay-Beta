# Architecture

**Analysis Date:** 2026-05-11

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Public Routes (Next.js App Router)                │
│  `/` (landing)  `/signup`  `/login`  `/pitch`  `/pro`              │
└────────────────────────────┬────────────────────────────────────────┘
                             │  Next.js Middleware (auth gate)
                             │  `src/middleware.ts`
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│              Dashboard Shell — Route Group (dashboard)               │
│  `src/app/(dashboard)/layout.tsx`                                    │
│  NotificationProvider + DashboardSidebar + DashboardHeader           │
├──────────────┬──────────────┬──────────────┬────────────┬───────────┤
│  /dashboard  │  /network    │  /requests   │  /messages │  /meetings│
│  /profile    │              │  /requests/  │            │           │
│  /settings   │              │  new         │            │           │
└──────┬───────┴──────┬───────┴──────┬───────┴─────┬──────┴─────┬─────┘
       │              │              │             │            │
       ▼              ▼              ▼             ▼            ▼
┌─────────────────────────────────────────────────────────────────────┐
│          Server Components (RSC) — data fetch + pass props           │
│  e.g. `dashboard/page.tsx`, `network/page.tsx`, `meetings/page.tsx` │
└──────────────────────────┬──────────────────────────────────────────┘
                           │ passes serializable data
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│          Client Components  (`*-client.tsx`)                         │
│  Interactive UI, realtime subscriptions, local state                 │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
          ┌────────────────┴────────────────┐
          ▼                                 ▼
┌──────────────────┐             ┌─────────────────────┐
│  API Routes      │             │  Server Actions      │
│  `src/app/api/`  │             │  `actions.ts` files  │
│  (REST handlers) │             │  (`'use server'`)    │
└────────┬─────────┘             └──────────┬──────────┘
         │                                  │
         └──────────────┬───────────────────┘
                        ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Supabase (PostgreSQL + Auth + Realtime)          │
│  `src/lib/supabase/{server,client,admin,middleware}.ts`              │
└─────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | Font, global providers, Toaster | `src/app/layout.tsx` |
| Middleware | Session refresh, route protection, onboarding gate | `src/middleware.ts` |
| Dashboard Layout | Sidebar + header shell, NotificationProvider, page transitions | `src/app/(dashboard)/layout.tsx` |
| NotificationProvider | Realtime unread counts (messages + requests), mark-seen | `src/contexts/notification-context.tsx` |
| BookingService | Calendar token refresh, booking create/confirm/decline, Google Calendar sync | `src/lib/scheduling/BookingService.ts` |
| CalendarProvider interface | Abstraction over calendar providers (FreeBusy, createEvent, deleteEvent) | `src/lib/scheduling/CalendarProvider.ts` |
| GoogleCalendarProvider | Google Calendar API implementation | `src/lib/scheduling/GoogleCalendarProvider.ts` |
| Slot Generator | Available-time computation from schedule + busy blocks | `src/lib/scheduling/slot-generator.ts` |
| Supabase server client | SSR/RSC Supabase client (cookie-based sessions) | `src/lib/supabase/server.ts` |
| Supabase browser client | Client-side Supabase client | `src/lib/supabase/client.ts` |
| Supabase admin client | Service-role client for webhook handlers | `src/lib/supabase/admin.ts` |
| Similarity scorer | Profile match score (school/sport/major/career 0-100) | `src/lib/similarity.ts` |
| Verification engine | Roster scrape + fuzzy name match for athlete verification | `src/lib/verification.ts` |
| Subscription helper | getUserSubscription / isUserPro via Supabase | `src/lib/subscription.ts` |
| Stripe client | Stripe SDK singleton | `src/lib/stripe.ts` |
| Resend client | Email SDK singleton | `src/lib/resend.ts` |

## Pattern Overview

**Overall:** Next.js App Router with RSC-first data fetching

**Key Characteristics:**
- Pages are React Server Components that fetch data from Supabase and pass serializable props to `*-client.tsx` Client Components
- Mutations use Next.js Server Actions (`'use server'`) validated with Zod; complex backend operations (bookings, calendar sync) go through API routes
- Auth is cookie-based via `@supabase/ssr`; session refresh runs in middleware on every request
- Realtime (notifications) is wired only in the browser client component layer via Supabase channels

## Layers

**Middleware Layer:**
- Purpose: Session refresh, authentication redirect, onboarding gate
- Location: `src/middleware.ts` + `src/lib/supabase/middleware.ts`
- Contains: Route protection logic
- Depends on: Supabase SSR server client
- Used by: Every non-static request

**Page Layer (Server Components):**
- Purpose: Fetch data from Supabase, compute derived state, render or pass to client
- Location: `src/app/**/page.tsx`, `src/app/**/layout.tsx`
- Contains: Supabase queries, data stitching, RSC markup
- Depends on: `src/lib/supabase/server.ts`, lib utilities, Server Actions
- Used by: Next.js router

**Client Component Layer:**
- Purpose: Interactivity, local state, realtime subscriptions, form handling
- Location: `src/app/**/*-client.tsx`, `src/components/**`
- Contains: React hooks, framer-motion animations, Supabase browser subscriptions
- Depends on: `src/lib/supabase/client.ts`, contexts
- Used by: Server Component pages (passed as children or rendered)

**Server Actions Layer:**
- Purpose: Form submissions and mutations from Client Components
- Location: `src/app/**/actions.ts` (tagged `'use server'`)
- Contains: Zod validation, Supabase writes, `revalidatePath` / `redirect` calls
- Depends on: `src/lib/supabase/server.ts`, Zod
- Used by: Client Components via direct import

**API Routes Layer:**
- Purpose: JSON REST endpoints for complex async operations and webhooks
- Location: `src/app/api/**/route.ts`
- Contains: Request parsing, auth check, delegation to service classes
- Depends on: `src/lib/scheduling/BookingService.ts`, `src/lib/stripe.ts`, `src/lib/supabase/admin.ts`
- Used by: Client Components (fetch calls), Stripe webhooks

**Service/Library Layer:**
- Purpose: Domain logic decoupled from HTTP concerns
- Location: `src/lib/`
- Contains: BookingService, CalendarProvider abstraction, similarity scorer, verification engine, pricing
- Depends on: Supabase server client, Google APIs, Stripe SDK
- Used by: API routes, Server Actions, Server Component pages

## Data Flow

### Auth + Session (every request)

1. Request arrives → `src/middleware.ts`
2. `updateSession()` creates Supabase server client, calls `supabase.auth.getUser()` to refresh session cookies (`src/lib/supabase/middleware.ts`)
3. If unauthenticated + protected route → redirect `/login`
4. If authenticated + not onboarded + not on `/onboarding` → redirect `/onboarding`
5. Response proceeds with refreshed session cookie

### Dashboard Data Fetch

1. User navigates to `/dashboard` — Next.js RSC renders `src/app/(dashboard)/dashboard/page.tsx`
2. Page creates Supabase server client, calls `supabase.auth.getUser()`
3. Sequential Supabase queries: profile, request counts, recent requests, upcoming bookings
4. Serializable data object passed as props to `<DashboardClient data={...} />`
5. Client component renders UI with the pre-fetched data

### Booking Flow

1. Client component calls `POST /api/scheduling/availability` with `userId`, `startDate`, `endDate`
2. Route fetches availability rules, calls `BookingService.getValidToken()` to get a fresh Google token, queries Google FreeBusy API via `GoogleCalendarProvider`, merges with existing Relay bookings, returns open slots
3. User selects slot → Client calls `POST /api/scheduling/book`
4. Route calls `BookingService.createBooking()` → inserts `PENDING` booking row
5. Recipient sees booking in `/meetings` (PENDING section), clicks confirm → calls `POST /api/scheduling/respond`
6. `BookingService.confirmBooking()` updates status to `CONFIRMED`, syncs Google Calendar event for both users, returns meeting link

### Stripe Subscription Flow

1. User visits `/pro` → clicks upgrade → Client calls `POST /api/stripe/checkout`
2. Checkout route creates Stripe Checkout session with `supabase_user_id` in metadata → returns session URL
3. User completes payment → Stripe fires `checkout.session.completed` webhook to `POST /api/stripe/webhook`
4. Webhook handler (uses admin client) upserts `subscriptions` table row + saves `stripe_customer_id` on `users`
5. Subsequent webhook events (`invoice.paid`, `customer.subscription.updated/deleted`) keep `subscriptions` table in sync

### Realtime Notifications

1. `NotificationProvider` (client) mounts in dashboard layout (`src/contexts/notification-context.tsx`)
2. On mount: fetches unread `messages` count + unseen `requests` count from Supabase
3. Subscribes to `global-notifications` Supabase channel on `messages` and `requests` tables
4. Any INSERT/UPDATE triggers `fetchCounts()` refetch (suppressed for 1.5s after a mark-seen to avoid races)
5. When user visits `/requests` or `/messages`, `ClearNotificationsOnMount` calls `markRequestsSeen` / `markMessagesSeen` — optimistically zeros local state, then runs server action to update `seen_at` / `is_read` in DB

## Key Abstractions

**CalendarProvider Interface:**
- Purpose: Swap calendar backends (currently Google only)
- File: `src/lib/scheduling/CalendarProvider.ts`
- Pattern: Interface with `getFreeBusy`, `createEvent`, `deleteEvent` methods; factory in `BookingService.getProvider()`

**Supabase Client Factory (three variants):**
- Browser: `src/lib/supabase/client.ts` — `createBrowserClient()`, used in Client Components
- Server/RSC: `src/lib/supabase/server.ts` — `createServerClient()` with cookie store, used in pages/actions
- Admin: `src/lib/supabase/admin.ts` — service role key, no session, used only in webhook routes

**`*-client.tsx` convention:**
- Every page that needs interactivity splits into a Server Component `page.tsx` (data fetch) and a Client Component `*-client.tsx` (interactive UI). The server page passes all data as props, avoiding any client-side data fetching on initial load.

## Entry Points

**Web Application:**
- Location: `src/app/page.tsx` (public landing)
- Triggers: HTTP GET `/`

**Auth Callback:**
- Location: `src/app/auth/callback/route.ts`
- Triggers: Supabase email confirmation redirect

**Stripe Webhook:**
- Location: `src/app/api/stripe/webhook/route.ts`
- Triggers: Stripe webhook events (POST)

**Scheduling API:**
- Location: `src/app/api/scheduling/`
- Routes: `availability/route.ts`, `book/route.ts`, `respond/route.ts`

**Calendar OAuth:**
- Location: `src/app/api/calendar/auth/route.ts`, `src/app/api/calendar/callback/route.ts`
- Triggers: Google OAuth flow initiation and callback

## Architectural Constraints

- **Threading:** Single-threaded Node.js / Next.js edge/serverless model; each request is independent
- **Global state:** `createClient()` in `src/lib/supabase/client.ts` is called per use but memoized inside `NotificationProvider` via `useMemo` to prevent subscription churn
- **Circular imports:** None detected
- **RSC/Client boundary:** Dashboard layout is `"use client"` (for framer-motion + context), which means all its children that need RSC data fetching must be passed as props, not imported directly

## Anti-Patterns

### `any` casts on Supabase join results

**What happens:** Join results from Supabase (e.g., `athlete_profiles(*)` joined on `users`) are typed as `any` throughout page files — e.g., `dashboard/page.tsx` line 103, `network/page.tsx` line 66.
**Why it's wrong:** Bypasses TypeScript; bugs in field access (e.g., `profile?.career_sectors?.[0]`) are invisible until runtime.
**Do this instead:** Define typed interfaces matching the Supabase select shape and cast only at the query boundary; or use the Supabase TypeScript codegen.

### Stub AI refinement in production path

**What happens:** `src/app/(dashboard)/requests/new/actions.ts` — `refineRequestDraft()` returns hardcoded heuristic strings with a `setTimeout` delay, simulating an AI call.
**Why it's wrong:** Ships fake "AI" feature to users; the delay adds latency for no real value.
**Do this instead:** Integrate a real LLM call or remove the refinement feature until it is implemented.

### Direct debug panel in production markup

**What happens:** `src/app/(dashboard)/network/page.tsx` lines 217-228 render a `<pre>` diagnostic block when the user list is empty; it is only opacity-hidden, not removed in production.
**Why it's wrong:** Leaks internal error structure (`error_message`, raw counts) to users who inspect the DOM.
**Do this instead:** Remove or gate behind `process.env.NODE_ENV === 'development'`.

## Error Handling

**Strategy:** Mixed — API routes catch and return JSON error responses; Server Actions use `redirect()` with `?error=` query params for form errors; client components surface errors via `sonner` toasts.

**Patterns:**
- API routes: `try/catch` → `NextResponse.json({ error: message }, { status: N })`
- Server Actions: validate with Zod → `return { error: string }` or `redirect('/path?error=...')`
- Stripe webhook: error during event processing logs but returns `{ received: true }` (200) to prevent Stripe retries
- Calendar token refresh failure: `BookingService.deactivateConnection()` — marks connection inactive and returns `null` so callers degrade gracefully

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` directly in route handlers and service classes; no structured logging library
**Validation:** Zod used in Server Actions (`src/app/onboarding/actions.ts`); API routes do manual field presence checks
**Authentication:** Supabase cookie-based sessions; checked via `supabase.auth.getUser()` at the top of every Server Component page and API route

---

*Architecture analysis: 2026-05-11*
