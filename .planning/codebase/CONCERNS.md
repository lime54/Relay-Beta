# Codebase Concerns

**Analysis Date:** 2026-05-11

---

## Security Concerns

### [HIGH] OAuth Tokens Stored Unencrypted in Database

- **Issue:** Google Calendar `access_token` and `refresh_token` are stored as plaintext in the `calendar_connections` table. A code comment explicitly flags this.
- **Files:** `src/app/api/calendar/callback/route.ts` (line 85 comment: "For production, encrypt access_token / refresh_token using Supabase Vault.")
- **Impact:** If the database is breached, all OAuth tokens are exposed. Tokens grant access to users' Google Calendars.
- **Fix approach:** Encrypt tokens with Supabase Vault (`pgsodium`) before insert; decrypt on read in `BookingService.getValidToken()`.

---

### [HIGH] `respondToRequest` Has No Recipient Authorization Check

- **Issue:** The server action `respondToRequest` inserts a response and updates the request status without verifying the authenticated user is actually the `recipient_id` of that request. Any authenticated user can accept/decline any pending request.
- **Files:** `src/app/(dashboard)/requests/actions.ts` (lines 55–84)
- **Impact:** Malicious user can accept or decline another user's requests, corrupting connection state.
- **Fix approach:** Before inserting the response, query the request row and verify `recipient_id === user.id`. Supabase RLS policy should also enforce this at the DB layer.

---

### [HIGH] `/api/scheduling/availability` Is Unauthenticated

- **Issue:** The scheduling availability endpoint takes a `userId` from the request body but never checks if the caller is authenticated. Any unauthenticated actor can query any user's calendar free/busy data and internal booking slots.
- **Files:** `src/app/api/scheduling/availability/route.ts`
- **Impact:** User calendar availability (effectively private schedule data) is publicly queryable.
- **Fix approach:** Add `supabase.auth.getUser()` check at the top of the handler and return 401 if no session.

---

### [HIGH] TypeScript and ESLint Errors Suppressed in Production Builds

- **Issue:** `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. Type errors and lint violations are silently ignored at build time.
- **Files:** `next.config.ts` (lines 9–14)
- **Impact:** Type-safety guarantees are meaningless. Bugs caught by the compiler ship silently. The codebase has ~100 `: any` usages that are invisible to CI.
- **Fix approach:** Remove both flags. Fix the underlying TypeScript errors (primarily `any` usages in `messages-client.tsx`, `requests/page.tsx`, `network/page.tsx`).

---

### [MEDIUM] Hardcoded hCaptcha Site Key Fallback

- **Issue:** The captcha component falls back to a hardcoded site key `77aa5102-3b9c-40b8-ae7a-44dca8e6a5e6` when `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` is not set.
- **Files:** `src/components/captcha.tsx` (line 17)
- **Impact:** If the env var is accidentally unset in production, an attacker-controlled or test site key is used, making captcha verification trivially bypassable.
- **Fix approach:** Remove the hardcoded fallback. Throw an error or log a critical warning if the env var is missing.

---

### [MEDIUM] Email Sent from Resend Testing Domain

- **Issue:** Welcome emails are sent `from: 'onboarding@resend.dev'` — Resend's shared testing domain — with a code comment confirming this is temporary.
- **Files:** `src/app/auth/actions.ts` (line 106)
- **Impact:** Emails will be flagged as spam or blocked in production. The sender domain is not owned by the app, so DMARC/SPF fails.
- **Fix approach:** Configure a custom sending domain in Resend and update the `from` address.

---

### [MEDIUM] `dev-actions.ts` `resetOnboarding` Exposed Without Environment Guard

- **Issue:** `resetOnboarding()` in `src/app/onboarding/dev-actions.ts` is a server action that sets `onboarded: false` for the authenticated user. There is no `NODE_ENV !== 'production'` guard on the action itself — only the page that links to it may restrict visibility.
- **Files:** `src/app/onboarding/dev-actions.ts`
- **Impact:** If any client-side code ever calls this action in production, any user can reset their own onboarding state (low direct impact, but confirms the action is reachable).
- **Fix approach:** Add `if (process.env.NODE_ENV !== 'development') throw new Error('Dev only')` at the top of the action, or delete the file when moving to production.

---

### [MEDIUM] Multiple `.env` Files Committed to Repo (Potentially)

- **Issue:** Three environment files exist: `.env.local`, `.env.relay-beta`, `.env.relay-beta-preview`. The presence of staging/preview env files in the repository is a credential leak risk if they contain real keys.
- **Files:** `.env.relay-beta`, `.env.relay-beta-preview`
- **Impact:** Real API keys (Stripe, Supabase service role, Google OAuth) may be committed and accessible to anyone with repo access.
- **Fix approach:** Audit these files. Move all secrets to a secrets manager (e.g., Vercel environment variables) and add them to `.gitignore`. The `.env.local.example` only documents 4 variables but the app requires ~12 env vars (see env var list below).

---

### [LOW] Incomplete `.env.local.example`

- **Issue:** `.env.local.example` only documents 4 environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `RESEND_API_KEY`). At least 8 additional required variables exist in the codebase: `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID_MONTHLY`, `STRIPE_PRICE_ID_YEARLY`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, `NEXT_PUBLIC_APP_URL`.
- **Files:** `.env.local.example`, `src/lib/supabase/admin.ts`, `src/app/api/stripe/webhook/route.ts`, `src/app/api/calendar/auth/route.ts`
- **Impact:** New developers/deployments will have silent runtime failures.
- **Fix approach:** Update `.env.local.example` with all required vars and clear descriptions.

---

## Performance Concerns

### [HIGH] Network Page Fetches All Users With No Pagination

- **Issue:** The Discover tab on the network page fetches all users from the database unconditionally (`SELECT id, name, email, role, avatar_url, athlete_profiles(*)`), then filters and sorts in JavaScript. There is no pagination, limit, or server-side filtering.
- **Files:** `src/app/(dashboard)/network/page.tsx` (lines 132–205)
- **Impact:** As the user base grows, this becomes a full table scan on every page load. At 10,000 users this is a serious latency and memory concern. Client receives PII (email addresses) for users it may never display.
- **Fix approach:** Move filtering (sport, industry) to SQL `WHERE` clauses. Add cursor-based pagination. Remove `email` from the select (not needed on the discover page).

---

### [HIGH] Duplicate Animation Libraries (`framer-motion` + `motion`)

- **Issue:** Both `framer-motion` (v12.29.0) and `motion` (v12.35.0) are listed as production dependencies. All actual import usage is from `framer-motion`.
- **Files:** `package.json` (lines 26, 29)
- **Impact:** Adds ~50–100KB to the bundle for a completely unused package. `motion` is the new standalone package — `framer-motion` v12 re-exports from it — so one of these is redundant.
- **Fix approach:** Remove the explicit `motion` dependency. `framer-motion` v12 bundles it internally.

---

### [MEDIUM] `messages-client.tsx` Is a 977-Line Monolith

- **Issue:** The entire messaging UI — connection list, chat window, file uploads, typing indicators, read receipts, request details panel — lives in a single client component file.
- **Files:** `src/app/(dashboard)/messages/messages-client.tsx`
- **Impact:** The entire 977-line file re-renders on any state change. Difficult to maintain and test. All animation, business logic, and UI rendering are entangled.
- **Fix approach:** Extract `ConnectionList`, `ChatWindow`, `TypingIndicator`, `AttachmentPreview`, `RequestDetailsPanel` into separate components. Move Supabase subscription logic into a custom hook.

---

### [MEDIUM] `select('*')` Used Heavily Throughout Server Code

- **Issue:** 17 occurrences of `.select('*')` fetch entire rows from tables including `athlete_profiles`, `bookings`, `calendar_connections`, and `users`. Many columns in these rows are never accessed.
- **Files:** `src/app/(dashboard)/dashboard/page.tsx`, `src/app/(dashboard)/requests/page.tsx`, `src/lib/scheduling/BookingService.ts`, others
- **Impact:** Over-fetching increases query cost and network payload size. Sensitive fields (tokens, private metadata) are fetched unnecessarily.
- **Fix approach:** Replace `select('*')` with explicit column lists in each query.

---

### [MEDIUM] Dashboard Page Makes 6+ Sequential Database Queries

- **Issue:** `DashboardPage` makes at least 6 separate Supabase queries sequentially: profile, sent count, received count, accepted count, recent requests, then a second pass to fetch `otherPerson` user data.
- **Files:** `src/app/(dashboard)/dashboard/page.tsx`
- **Impact:** Server render time is the sum of all query round-trips. On cold start this is noticeable.
- **Fix approach:** Combine counts into a single RPC or parallel `Promise.all()`. Use a join query for the recent requests + user data fetch instead of two passes.

---

### [LOW] `force-dynamic` on Multiple Pages Prevents Static Optimization

- **Issue:** `export const dynamic = 'force-dynamic'` is set on the homepage (`page.tsx`), pro page, network page, dashboard page, messages page, settings/calendar page. This disables Next.js static generation and ISR for these routes.
- **Files:** `src/app/page.tsx`, `src/app/pro/page.tsx`, `src/app/(dashboard)/network/page.tsx`, and others
- **Impact:** Every request hits the server; no edge caching is possible. For public pages like `/pro` and `/` that don't require per-user data, this is unnecessary overhead.
- **Fix approach:** Remove `force-dynamic` from public pages (`/`, `/pro`, `/pitch`). These can be statically generated.

---

## Maintainability Concerns

### [HIGH] Pervasive Use of `any` Type (~100 Occurrences)

- **Issue:** Approximately 100 `any` type usages exist across the codebase, primarily in server page components and the messages client.
- **Files:** `src/app/(dashboard)/requests/page.tsx` (10+ uses), `src/app/(dashboard)/messages/messages-client.tsx` (5+ uses), `src/app/(dashboard)/network/page.tsx` (6+ uses), `src/app/(dashboard)/dashboard/page.tsx` (5+ uses)
- **Impact:** Type errors at these callsites are completely invisible. Refactoring becomes hazardous. TypeScript provides no value on these code paths.
- **Fix approach:** Define interfaces for Supabase row return shapes (athlete profile, request, user). Replace `any[]` arrays with typed arrays. Start with the most-used types: `Connection`, `AthleteProfile`, `Request`.

---

### [MEDIUM] Missing Error Boundaries

- **Issue:** No `error.tsx` files exist anywhere in the `src/app` directory tree. Next.js App Router requires `error.tsx` to recover from unhandled errors in Server Components.
- **Files:** Entire `src/app/` tree
- **Impact:** Any unhandled error in a Server Component causes the entire page to crash with Next.js's default error UI (or a blank page) in production. The app has no graceful degradation.
- **Fix approach:** Add `error.tsx` at least at `src/app/error.tsx` (global) and `src/app/(dashboard)/error.tsx` (dashboard). Each should provide a user-friendly message and "try again" button.

---

### [MEDIUM] `REQUEST_TYPE_LABELS` and `TIME_LABELS` Duplicated

- **Issue:** The `REQUEST_TYPE_LABELS` constant is defined identically in both `messages-client.tsx` and `dashboard-client.tsx`. Similar label maps exist scattered through request-related components.
- **Files:** `src/app/(dashboard)/messages/messages-client.tsx` (line 69), `src/app/(dashboard)/dashboard/client.tsx` (line 74)
- **Impact:** Changes to request types must be applied in multiple places. Currently they are in sync, but this diverges over time.
- **Fix approach:** Consolidate into a shared `src/lib/request-labels.ts` module and import from both consumers.

---

### [MEDIUM] `refineRequestDraft` Is a Stub, Not Real AI

- **Issue:** `refineRequestDraft` in `src/app/(dashboard)/requests/new/actions.ts` simulates AI with string concatenation and a hardcoded 800ms delay. It is presented to users as AI-powered.
- **Files:** `src/app/(dashboard)/requests/new/actions.ts`
- **Impact:** If users rely on this feature, they receive unhelpful canned text. The app has `@ai-sdk/openai` and `ai` packages installed but unused.
- **Fix approach:** Either implement actual AI refinement using the installed `ai` SDK (connect to OpenAI), or remove the feature and the button that triggers it.

---

### [MEDIUM] `/settings/calendar` and `/pro` Routes Not Listed as Protected

- **Issue:** The middleware `isProtectedRoute` list does not include `/settings` or `/pro`. These pages contain user account data (calendar connections) and billing flows.
- **Files:** `src/lib/supabase/middleware.ts` (lines 51–56)
- **Impact:** An unauthenticated user navigating to `/settings/calendar` will reach the server component, which redirects internally if needed, but the middleware layer provides no protection. Defense in depth is broken.
- **Fix approach:** Add `/settings` and `/pro` to the `isProtectedRoute` check.

---

### [LOW] Scattered SQL Migration Files in Root Directory

- **Issue:** 11 `.sql` migration files live in the project root rather than in a migrations directory (e.g., `supabase/migrations/`).
- **Files:** `supabase_migration.sql`, `supabase_schema.sql`, `supabase_scheduling_migration.sql`, `supabase_stripe_subscriptions_migration.sql`, `supabase_calendar_connections_rls_fix.sql`, and 6 others in `/`
- **Impact:** No migration versioning or ordering. The presence of a `_rls_fix.sql` and `_unique_fix.sql` alongside originals suggests ad-hoc patching. There is no way to know which migrations have been applied to which environment.
- **Fix approach:** Move to `supabase/migrations/` with timestamp-prefixed filenames and use the Supabase CLI (`supabase db push`).

---

### [LOW] `ScrollArea` Is a Local Inline Component in `messages-client.tsx`

- **Issue:** A minimal `ScrollArea` wrapper component is defined inline at the bottom of `messages-client.tsx` instead of using the existing Radix UI `@radix-ui/react-separator` or a proper scroll area component.
- **Files:** `src/app/(dashboard)/messages/messages-client.tsx` (lines 969–977)
- **Impact:** Small issue but indicates ad-hoc componentization pressure. The shared `src/components/ui/` directory has room for a proper ScrollArea.
- **Fix approach:** Move to `src/components/ui/scroll-area.tsx` using `@radix-ui/react-scroll-area`.

---

## Scalability Concerns

### [HIGH] No Rate Limiting on Any API Route or Server Action

- **Issue:** No rate limiting exists anywhere in the codebase — not on auth (`/auth/actions.ts`), not on booking (`/api/scheduling/book`), not on messaging, not on the stripe checkout endpoint.
- **Files:** All API routes under `src/app/api/`, all server actions under `src/app/**/actions.ts`
- **Impact:** Brute-force login attacks, spam request flooding, and Stripe API abuse are all unthrottled. The booking endpoint could be hammered to exhaust Google Calendar API quota.
- **Fix approach:** Add rate limiting at the middleware level using an in-memory store (e.g., `lru-cache`) or edge-compatible solution (Upstash Redis). Prioritize auth and booking endpoints.

---

### [MEDIUM] No Pagination on Messages Query

- **Issue:** Loading a conversation fetches all messages for a `request_id` with no limit: `.select("*").eq("request_id", selectedId).order("created_at", { ascending: true })`.
- **Files:** `src/app/(dashboard)/messages/messages-client.tsx` (line 481)
- **Impact:** Long-running conversations will return unbounded result sets, causing slow loads and high memory usage in the browser.
- **Fix approach:** Add `.limit(100)` and implement infinite scroll with cursor-based pagination (`before` cursor on `created_at`).

---

### [MEDIUM] Similarity Scoring Done in JavaScript for All Users

- **Issue:** The network discover page fetches all users and runs `calculateSimilarityScore()` in JavaScript for each user on every page load. This is O(n) CPU work in the server component.
- **Files:** `src/app/(dashboard)/network/page.tsx` (lines 173–179), `src/lib/similarity.ts`
- **Impact:** At scale (1,000+ users), this is ~1,000 synchronous similarity calculations blocking the server render.
- **Fix approach:** Pre-compute and cache similarity scores in the database (materialized view or a background job), or move to a Postgres-side function. Alternatively, compute scores only for the visible page slice after pagination.

---

## Dependency Concerns

### [MEDIUM] `shadcn` Listed as Production Dependency

- **Issue:** `shadcn` (v4.0.0) is the CLI tool for adding components to the project. It is listed under `dependencies` rather than `devDependencies`.
- **Files:** `package.json` (line 37)
- **Impact:** Adds CLI tooling to the production bundle unnecessarily. Not a security risk, but inflates the install size.
- **Fix approach:** Move `shadcn` to `devDependencies`.

---

### [MEDIUM] `puppeteer` Listed as Dev Dependency but Only Playwright Used for Tests

- **Issue:** `puppeteer` (v24.43.0) is a dev dependency, but the test suite uses only Playwright. No Puppeteer test files were found.
- **Files:** `package.json` (line 54)
- **Impact:** ~200MB download on every `npm install` in CI/CD for zero benefit.
- **Fix approach:** Remove `puppeteer` from `devDependencies`.

---

### [LOW] `motion` Package Is Unused (Redundant with `framer-motion`)

- **Issue:** `motion` (v12.35.0) is installed as a production dependency but no import of `"motion"` appears anywhere in the source tree. All animation imports use `"framer-motion"`.
- **Files:** `package.json` (line 29)
- **Impact:** Unused bundle weight.
- **Fix approach:** Run `npm uninstall motion`.

---

## Missing Critical Features

### [HIGH] No Email Verification for Alumni Signups

- **Issue:** The `.edu` email requirement is enforced only for `role !== 'alum'`. Alumni can sign up with any email address and gain full access to the verified athlete network without any identity check.
- **Files:** `src/app/auth/actions.ts` (lines 67–70)
- **Impact:** The core trust model of the platform (verified athletes only) can be bypassed by selecting "alum" role.
- **Fix approach:** Implement a LinkedIn verification step for alumni, or manual admin approval. At minimum, document this limitation.

---

### [MEDIUM] No Global Error Page (`error.tsx`)

- **Issue:** As noted under Maintainability, no Next.js `error.tsx` files exist. Any unhandled server error exposes a raw error page or blank screen.
- **Files:** Entire `src/app/` tree
- **Fix approach:** See Maintainability section above.

---

### [MEDIUM] No Not-Found Page (`not-found.tsx`)

- **Issue:** No `not-found.tsx` exists at any level of the app. Navigation to invalid profile IDs or missing pages will use Next.js's default 404 page.
- **Files:** Entire `src/app/` tree
- **Fix approach:** Add `src/app/not-found.tsx` with branded design. Add `src/app/(dashboard)/profile/[id]/not-found.tsx` for invalid profile routes.

---

### [MEDIUM] `logOutcome` Has No Validation on `outcomeType`

- **Issue:** `logOutcome` in `src/app/(dashboard)/requests/actions.ts` accepts `outcomeType: string` without validating it against an enum or allowed values. Any string is inserted into the `outcomes` table.
- **Files:** `src/app/(dashboard)/requests/actions.ts` (lines 150–173)
- **Impact:** Data integrity issue. Inconsistent outcome type strings make reporting and analytics unreliable.
- **Fix approach:** Define an allowed set: `z.enum(['meeting_completed', 'referral_made', 'advice_given', ...])` and validate with Zod before insert.

---

## TODO / FIXME Comments

| File | Line | Comment |
|------|------|---------|
| `src/app/api/calendar/callback/route.ts` | 85 | `NOTE: For production, encrypt access_token / refresh_token using Supabase Vault.` |
| `src/app/auth/actions.ts` | 99–101 | "Option 1: Send a custom verification email via Resend … We will attempt to send one explicitly if an API key is present." — incomplete email strategy |
| `src/app/auth/actions.ts` | 106 | `from: 'onboarding@resend.dev', // We will use Resend's testing domain for now` |
| `src/app/(dashboard)/profile/verify/actions.ts` | 18 | `// In real app, handle file upload` — proof URL field accepts free-text, not a real upload |
| `src/app/(dashboard)/dashboard/page.tsx` | 69–73 | Multi-line comment reasoning through the architecture of `recipient_id` — indicates an unresolved design question |
| `src/app/(dashboard)/requests/page.tsx` | 33–56 | Schema-migration fallback: detects whether `archived_at` column exists by checking row shape at runtime — a workaround for a migration that may not have been applied |

---

## Dead Code / Unused Dependencies

| Item | Type | Evidence |
|------|------|---------|
| `motion` package (v12.35.0) | Unused prod dependency | No `import ... from "motion"` found anywhere in `src/` |
| `puppeteer` (v24.43.0) | Unused dev dependency | No Puppeteer test files; test suite is Playwright-only |
| `@ai-sdk/openai` + `ai` | Installed but unused | `refineRequestDraft` is a fake stub; no actual AI SDK calls found |
| `animated-hero-demo.tsx`, `glowing-effect-demo.tsx` | Demo components | Located in `src/components/` — likely leftover from UI exploration |
| `wave-background.tsx` | Possibly orphaned | Imported in `dashboard-client.tsx` — verify it's still in the UI |

---

*Concerns audit: 2026-05-11*
