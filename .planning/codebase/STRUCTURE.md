# Codebase Structure

**Analysis Date:** 2026-05-11

## Directory Layout

```
relay-main/
├── src/
│   ├── app/                        # Next.js App Router root
│   │   ├── layout.tsx              # Root layout (fonts, Toaster, PageProgressBar)
│   │   ├── page.tsx                # Public landing page
│   │   ├── loading.tsx             # Root loading UI
│   │   ├── (auth)/                 # Route group: unauthenticated pages
│   │   │   └── login/              # /login route
│   │   ├── (dashboard)/            # Route group: authenticated app shell
│   │   │   ├── layout.tsx          # Dashboard shell (sidebar, header, NotificationProvider)
│   │   │   ├── loading.tsx         # Dashboard loading UI
│   │   │   ├── dashboard/          # /dashboard
│   │   │   ├── network/            # /network (discover + my connections)
│   │   │   ├── requests/           # /requests (inbox + sent + archived)
│   │   │   │   ├── [id]/           # /requests/:id (request detail)
│   │   │   │   └── new/            # /requests/new (compose request)
│   │   │   ├── messages/           # /messages (chat threads)
│   │   │   ├── meetings/           # /meetings (bookings)
│   │   │   ├── profile/            # /profile (own profile)
│   │   │   │   ├── [id]/           # /profile/:id (other user's profile)
│   │   │   │   └── verify/         # /profile/verify (athlete verification)
│   │   │   └── settings/
│   │   │       └── calendar/       # /settings/calendar (Google Calendar connect)
│   │   ├── api/                    # REST API routes
│   │   │   ├── calendar/
│   │   │   │   ├── auth/           # Google OAuth initiation
│   │   │   │   └── callback/       # Google OAuth callback
│   │   │   ├── scheduling/
│   │   │   │   ├── availability/   # POST: compute open slots
│   │   │   │   ├── book/           # POST: create PENDING booking
│   │   │   │   └── respond/        # POST: confirm or decline booking
│   │   │   └── stripe/
│   │   │       ├── checkout/       # POST: create Stripe Checkout session
│   │   │       ├── portal/         # POST: create Stripe Customer Portal session
│   │   │       └── webhook/        # POST: Stripe webhook receiver
│   │   ├── auth/
│   │   │   ├── actions.ts          # login / signup Server Actions
│   │   │   ├── callback/           # /auth/callback (Supabase email confirmation)
│   │   │   └── signout/            # /auth/signout
│   │   ├── onboarding/             # /onboarding (post-signup profile setup)
│   │   ├── signup/                 # /signup + /signup/check-email + /signup/confirmed
│   │   ├── pitch/                  # /pitch (investor pitch deck page)
│   │   └── pro/                    # /pro (upgrade page) + /pro/success
│   ├── components/
│   │   ├── ui/                     # Generic UI primitives (shadcn/ui + custom)
│   │   ├── profile/                # Profile-specific dialog components
│   │   ├── scheduling/             # Availability picker component
│   │   ├── dashboard-sidebar.tsx   # Left navigation sidebar
│   │   ├── dashboard-header.tsx    # Top header bar
│   │   ├── mobile-nav.tsx          # Bottom mobile navigation
│   │   ├── navbar.tsx              # Public site navbar
│   │   ├── command-menu.tsx        # Global cmd-K command palette
│   │   ├── page-progress-bar.tsx   # Route-change progress indicator
│   │   ├── submit-button.tsx       # Loading-aware form submit button
│   │   ├── captcha.tsx             # hCaptcha wrapper
│   │   ├── wave-background.tsx     # Decorative background component
│   │   └── clear-notifications-on-mount.tsx  # Side-effect component to mark seen
│   ├── contexts/
│   │   └── notification-context.tsx  # Realtime unread badge state
│   └── lib/
│       ├── supabase/
│       │   ├── client.ts           # Browser Supabase client
│       │   ├── server.ts           # RSC/Server Action Supabase client
│       │   ├── admin.ts            # Service-role Supabase client (webhooks only)
│       │   └── middleware.ts       # Session refresh + route guard logic
│       ├── scheduling/
│       │   ├── BookingService.ts   # Booking lifecycle + calendar sync
│       │   ├── CalendarProvider.ts # CalendarProvider interface
│       │   ├── GoogleCalendarProvider.ts  # Google Calendar implementation
│       │   └── slot-generator.ts   # Available slot computation
│       ├── notifications/
│       │   └── mark-seen-actions.ts  # Server Actions to mark requests/messages seen
│       ├── similarity.ts           # Profile match scoring algorithm
│       ├── verification.ts         # Roster scrape + fuzzy name match
│       ├── subscription.ts         # Stripe subscription status helpers
│       ├── stripe.ts               # Stripe SDK singleton
│       ├── resend.ts               # Resend email SDK singleton
│       ├── pricing.ts              # Plan/pricing constants
│       ├── utils.ts                # `cn()` classname utility (clsx + tailwind-merge)
│       ├── format-date.ts          # Date formatting helpers
│       ├── image-utils.ts          # Image processing utilities
│       └── profile-edit-targets.ts # Mapping profile field keys to edit URLs
├── public/                         # Static assets
├── docs/                           # Project documentation
├── pitch-slides/                   # Investor pitch slide assets
├── tests/                          # Playwright e2e tests
├── supabase_*.sql                  # Database migration SQL files (applied manually)
├── next.config.ts                  # Next.js configuration
├── tsconfig.json                   # TypeScript configuration
├── components.json                 # shadcn/ui component registry config
├── playwright.config.ts            # Playwright test configuration
└── vercel.json                     # Vercel deployment configuration
```

## Directory Purposes

**`src/app/(dashboard)/`:**
- Purpose: All authenticated app screens behind the dashboard shell
- Contains: Route-per-feature folders, each with `page.tsx` (RSC) + `*-client.tsx` (interactive) + `actions.ts` (mutations)
- Key files: `layout.tsx` (shell), `dashboard/page.tsx` (home screen)

**`src/app/api/`:**
- Purpose: JSON REST endpoints and webhook receivers
- Contains: `route.ts` files using Next.js Route Handlers
- Key files: `stripe/webhook/route.ts`, `scheduling/book/route.ts`, `scheduling/availability/route.ts`

**`src/components/ui/`:**
- Purpose: Reusable, unstyled-base UI components (shadcn/ui pattern)
- Contains: `button.tsx`, `card.tsx`, `dialog.tsx`, `input.tsx`, `select.tsx`, `avatar.tsx`, `badge.tsx`, `skeleton.tsx`, and custom animated components

**`src/lib/scheduling/`:**
- Purpose: All meeting/booking domain logic, isolated from HTTP layer
- Contains: `BookingService.ts` (orchestrator), `CalendarProvider.ts` (interface), `GoogleCalendarProvider.ts`, `slot-generator.ts`

**`src/lib/supabase/`:**
- Purpose: Supabase client factories for each execution context
- Contains: Three separate client files (`client.ts`, `server.ts`, `admin.ts`) and session middleware

**`supabase_*.sql` (root):**
- Purpose: Database schema migrations, applied manually to Supabase
- Generated: No (hand-authored)
- Committed: Yes (tracked in git as migration history)

## Key File Locations

**Entry Points:**
- `src/app/page.tsx`: Public landing page
- `src/app/layout.tsx`: Root HTML shell
- `src/middleware.ts`: Auth gate for all routes

**Configuration:**
- `next.config.ts`: Next.js config (image domains, etc.)
- `components.json`: shadcn/ui component registry
- `tsconfig.json`: TypeScript paths — `@/*` maps to `src/*`
- `vercel.json`: Deployment settings

**Core Logic:**
- `src/lib/scheduling/BookingService.ts`: Meeting booking orchestration
- `src/lib/similarity.ts`: Network match scoring
- `src/lib/verification.ts`: Athlete roster verification
- `src/lib/subscription.ts`: Pro subscription status
- `src/contexts/notification-context.tsx`: Global notification state

**Auth Flow:**
- `src/app/auth/actions.ts`: `login()` and `signup()` Server Actions
- `src/app/auth/callback/route.ts`: Email confirmation callback
- `src/app/onboarding/actions.ts`: Onboarding form submission

**Testing:**
- `tests/`: Playwright end-to-end tests
- `playwright.config.ts`: Test runner configuration

## Naming Conventions

**Files:**
- Server Component pages: `page.tsx` (always)
- Client Component counterparts: `[feature]-client.tsx` (e.g., `dashboard-client.tsx`, `network-client.tsx`)
- Server Actions: `actions.ts` co-located with the page that uses them
- API route handlers: `route.ts` inside a named directory
- Utility libraries: kebab-case (`format-date.ts`, `slot-generator.ts`)
- Service classes: PascalCase (`BookingService.ts`, `GoogleCalendarProvider.ts`)
- UI components: kebab-case (`dashboard-sidebar.tsx`, `submit-button.tsx`)

**Directories:**
- Route groups: parenthesized `(auth)`, `(dashboard)`
- Dynamic segments: bracketed `[id]`
- Feature directories: kebab-case (`requests/`, `messages/`, `scheduling/`)

## Where to Add New Code

**New Dashboard Feature/Page:**
- Route: `src/app/(dashboard)/[feature]/page.tsx` (RSC, data fetch)
- Interactive UI: `src/app/(dashboard)/[feature]/[feature]-client.tsx`
- Mutations: `src/app/(dashboard)/[feature]/actions.ts` (Server Action, `'use server'`)

**New API Endpoint:**
- Location: `src/app/api/[category]/[action]/route.ts`
- Use `src/lib/supabase/server.ts` for auth-context queries; `src/lib/supabase/admin.ts` only for webhook/service-role operations

**New Domain Service:**
- Location: `src/lib/[domain]/[ServiceName].ts`
- Keep HTTP-agnostic; inject Supabase client via `createClient()` internally

**New UI Component:**
- Generic/reusable primitive: `src/components/ui/[component-name].tsx`
- Feature-specific: `src/components/[feature]/[component-name].tsx`
- Page-specific (not reused): co-locate in the route directory

**New Database Migration:**
- File: `supabase_[description]_migration.sql` in repo root
- Apply manually to Supabase dashboard; commit the SQL file to git for history

**New Utility:**
- Shared: `src/lib/[name].ts`
- Only if the utility is used in 2+ places; otherwise inline

---

*Structure analysis: 2026-05-11*
