# Testing Patterns

**Analysis Date:** 2026-05-11

## Test Framework

**Runner:**
- Playwright `^1.59.1`
- Config: `playwright.config.ts` (project root)

**Assertion Library:**
- Playwright's built-in `expect` (from `@playwright/test`)

**Run Commands:**
```bash
npm test               # Run all Playwright tests (headless Chromium)
npm run test:ui        # Run with Playwright's interactive UI mode
npm run test:debug     # Run with Playwright debug mode
```

**No unit test framework is configured.** There is no Jest, Vitest, or Mocha setup. The `slot-generator.spec.ts` file uses Playwright's test runner (`import { test, expect } from '@playwright/test'`) to execute pure-function unit tests — not a separate unit test tool.

## Test File Organization

**Location:**
- All test files live in `tests/` at the project root (not co-located with source)
- Two test files exist:
  - `tests/smoke.spec.ts` — end-to-end smoke tests against a running dev server
  - `tests/slot-generator.spec.ts` — pure unit tests for `src/lib/scheduling/slot-generator.ts`, run via Playwright

**Naming:**
- `*.spec.ts` pattern

**Structure:**
```
tests/
├── smoke.spec.ts           # E2E smoke: homepage, login page, signup page
└── slot-generator.spec.ts  # Unit: generateAvailableSlots() pure function
```

## Test Structure

**Suite Organization:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Suite Name', () => {
    test('description of behavior', async ({ page }) => {
        // arrange / act / assert
    });

    test('pure function test', () => {
        // synchronous — no `async` when no page/network involved
    });
});
```

**Patterns:**
- E2E tests use the `page` fixture injected by Playwright
- Pure function tests are synchronous (no `async`) within the Playwright test runner
- No `beforeEach` / `afterEach` hooks in any current test file
- No shared fixtures or helper functions defined

## Mocking

**Framework:** None. No mocking libraries are used.

**What is mocked:**
- Nothing. The slot-generator tests use deterministic future dates (year 2030) to avoid clock dependency without mocking.
- E2E smoke tests hit the actual running dev server (`http://localhost:3000`).

**What is NOT mocked:**
- Supabase — no tests exercise database-touching code paths
- Stripe — not tested
- Google Calendar — not tested
- Email (Resend) — not tested

## Fixtures and Factories

**Test Data:**
```typescript
// Inline constants declared at file scope
const FRIDAY_9_TO_5 = {
    monday: [{ start: '09:00', end: '17:00' }],
    // ...
};
```

- No shared fixture files or factories
- Test data is declared as `const` at the top of each spec file

**Location:**
- Inline in spec files only; no `fixtures/` or `__fixtures__/` directory exists

## Coverage

**Requirements:** None enforced. No coverage configuration or thresholds are set.

**View Coverage:**
```bash
# Not configured — Playwright does not produce coverage reports in this setup
```

## Test Types

**E2E Tests (`tests/smoke.spec.ts`):**
- Scope: Public-facing pages only (homepage, `/login`, `/signup`)
- Approach: Navigate to URL, assert visible text and interactive elements
- Runs against live dev server on `http://localhost:3000`
- Does NOT test authenticated flows, dashboard, API routes, or database

**Unit Tests (`tests/slot-generator.spec.ts`):**
- Scope: `generateAvailableSlots()` function in `src/lib/scheduling/slot-generator.ts`
- Approach: Call pure function with controlled inputs, assert output array length and contents
- 6 test cases covering: basic slot generation, busy-block exclusion, buffer windows, past-slot filtering, inverted ranges, weekend exclusion
- Does NOT require a server or browser

**Integration Tests:** None present.

## CI Test Setup

**Playwright config CI behavior:**
```typescript
forbidOnly: !!process.env.CI,   // Fails build if test.only is committed
retries: process.env.CI ? 2 : 0, // Retries twice on CI
workers: process.env.CI ? 1 : undefined, // Single worker on CI
```

**Web server:** Playwright starts `npm run dev` and waits for `http://localhost:3000` before running tests. On CI, a fresh server is always started (`reuseExistingServer: !process.env.CI`).

**Browser targets:** Chromium only (Desktop Chrome device profile). No Firefox or Safari.

**CI pipeline:** No CI workflow file (`.github/workflows/`, `.circleci/`) was found in the repository. The Playwright config has CI-aware settings but no automated pipeline runs them.

## What Is and Isn't Tested

**Tested:**
- Public page rendering (homepage headline, login button, signup button)
- `generateAvailableSlots()` scheduling math (slot count, busy-block overlap, buffer windows, past filtering, inverted range, weekends)

**NOT Tested:**
- Authentication flows (login, signup, OAuth callback)
- All dashboard routes (`/dashboard`, `/requests`, `/messages`, `/network`, `/profile`, `/meetings`)
- All API routes (`/api/calendar/*`, `/api/scheduling/*`, `/api/stripe/*`)
- Server actions (`actions.ts` files throughout `src/app/`)
- Supabase data access layer
- Stripe subscription and checkout flows
- AI request refinement (`refineRequestDraft`)
- `BookingService` calendar sync logic
- `NotificationProvider` realtime badge logic
- Middleware authentication and session refresh
- Profile verification flow
- Onboarding flow

---

*Testing analysis: 2026-05-11*
