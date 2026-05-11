# Coding Conventions

**Analysis Date:** 2026-05-11

## Naming Patterns

**Files:**
- React component files use `kebab-case.tsx` (e.g., `dashboard-client.tsx`, `request-form.tsx`, `login-form.tsx`)
- Server action files are named `actions.ts` and co-located with the route they serve
- Library/utility files use `kebab-case.ts` (e.g., `slot-generator.ts`, `format-date.ts`)
- Class-based service files use `PascalCase.ts` (e.g., `BookingService.ts`, `GoogleCalendarProvider.ts`)
- Next.js special files use Next.js conventions: `page.tsx`, `layout.tsx`, `loading.tsx`, `route.ts`

**Components:**
- Named exports using `function` declarations with PascalCase (e.g., `export function RequestForm(...)`)
- Props defined inline as object destructuring or via an explicit `interface` just above the component
- shadcn/ui primitives in `src/components/ui/` use named exports (e.g., `export { Button, buttonVariants }`)

**Functions:**
- camelCase for all functions (e.g., `handleSubmit`, `fetchCounts`, `generateAvailableSlots`)
- Async handlers prefixed with `handle` (e.g., `handleRefine`, `handleSubmit`)
- Boolean state variables prefixed with `is` (e.g., `isRefining`, `isSubmitting`, `isVerified`)
- Server actions exported directly by name, no wrapper object

**Variables:**
- camelCase for local variables and state
- SCREAMING_SNAKE_CASE for module-level constants (e.g., `TOKEN_REFRESH_LEEWAY_MS`, `MAX_RANGE_DAYS`, `DEFAULT_SCHEDULE`)
- Interface names use PascalCase (e.g., `Recipient`, `DashboardData`, `SlotGenerationOptions`)
- Type aliases use PascalCase (e.g., `WeeklySchedule`)

## Code Style

**Formatting:**
- No `.prettierrc` present — formatting is not enforced via a dedicated config file
- Indentation: 4 spaces in most files (consistent throughout `src/`)
- Semicolons: present in most files
- Quotes: double quotes `"` used in JSX/TSX files; single quotes `'` used in `.ts` server files and actions
- Trailing commas: used on multi-line objects and arrays

**Linting:**
- ESLint with flat config (`eslint.config.mjs`)
- Extends `next/core-web-vitals` and `next/typescript`
- No custom rule overrides; relies on Next.js defaults
- Run via `npm run lint` (calls `eslint` with no args)

## TypeScript Usage

**Strictness:**
- `"strict": true` in `tsconfig.json` — full strict mode enabled
- `"target": "ES2017"` with `"module": "esnext"`
- `"isolatedModules": true` — no cross-file type inference side effects
- `skipLibCheck: true` — third-party type errors suppressed

**Patterns:**
- Inline `interface` definitions for component props and data shapes (e.g., `interface Recipient { ... }`)
- Type assertions via `as string` when reading from `FormData` (common in server actions)
- `unknown` used for caught errors in try/catch blocks, then narrowed with `instanceof Error`
- Generic type parameters on Supabase calls where needed: `.single<CalendarConnectionRow>()`
- `React.ComponentProps<"button">` used to extend native HTML element props
- Optional chaining (`?.`) and nullish coalescing (`??`) used throughout

**Directive Placement:**
- `'use server'` at the top of all `actions.ts` files
- `"use client"` at the top of all client components that use hooks or browser APIs

## Import/Export Patterns

**Order (observed in client components):**
1. React and React hooks (`import { useState } from "react"`)
2. Next.js imports (`import Link from "next/link"`)
3. Third-party UI libraries (`import { motion } from "framer-motion"`, Lucide icons)
4. Internal UI components (`import { Button } from "@/components/ui/button"`)
5. Internal lib/util imports (`import { cn } from "@/lib/utils"`)
6. Relative imports for co-located modules (`import { submitRequest } from "../actions"`)

**Path Aliases:**
- `@/*` maps to `./src/*` (defined in `tsconfig.json`)
- All cross-directory imports use `@/` prefix; relative imports (`../`) only for files in the same route segment

**Exports:**
- Named exports only — no default exports for components or functions
- `export { Button, buttonVariants }` style for re-exports in UI primitives
- Server actions exported directly from `actions.ts` files with `export async function`

## Component Structure Patterns

**Client Components:**
```tsx
"use client";

import { useState } from "react";
// ... other imports

interface MyProps { ... }

export function MyComponent({ prop1, prop2 }: MyProps) {
    const [state, setState] = useState(...);

    const handleAction = async () => { ... };

    if (earlyReturn) return <div>...</div>;

    return <form action={handleAction}>...</form>;
}
```

**Server Actions (actions.ts):**
```ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function myAction(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }
    // ... business logic
    revalidatePath('/path')
    return { success: true }
}
```

**API Routes (route.ts):**
```ts
import { NextResponse } from 'next/server';
export async function POST(request: Request) {
    try {
        // ... logic
        return NextResponse.json({ data });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
```

**Class-based Services:**
- Used only in `src/lib/scheduling/` for `BookingService` and `GoogleCalendarProvider`
- All methods are `static` on `BookingService` — no instance needed
- JSDoc comments on non-trivial static methods

## Comments and Documentation Style

**Inline Comments:**
- Used liberally to explain non-obvious behavior and business logic
- API route files use numbered step comments (`// 1. ...`, `// 2. ...`) for multi-step flows
- Bracket-prefixed tags for log context: `console.error('[BookingService] ...')`, `console.warn('[notifications] ...')`

**Section Headers:**
- Long files (e.g., `notification-context.tsx`) use dashed separator blocks:
  ```
  // ---------------------------------------------------------------------------
  // Section Name
  // ---------------------------------------------------------------------------
  ```

**JSDoc:**
- Used on public `BookingService` static methods (e.g., `getValidToken`, `confirmBooking`, `declineBooking`)
- Used on exported pure functions in `src/lib/scheduling/slot-generator.ts`
- Not used on React components

**Inline Field Comments:**
- Interface fields annotated with `// "HH:MM"` style format hints where format is non-obvious

## Error Handling Patterns

**Server Actions:**
- Return `{ error: string }` on failure, `{ success: true }` on success
- Auth check always first: `if (!user) return { error: 'Not authenticated' }`
- Supabase errors surfaced as `{ error: error.message }` — no throwing

**API Routes:**
- Wrapped in `try/catch`; catch block narrows `unknown` with `instanceof Error`
- Returns `NextResponse.json({ error: message }, { status: 500 })` on unhandled errors
- Returns `NextResponse.json({ error: '...' }, { status: 400 })` for validation failures

**Client Components:**
- `toast.error(...)` via `sonner` for user-facing errors
- `catch (_err)` with underscore prefix for intentionally ignored error values
- Async handlers do not re-throw; failures are shown via toast

**Services:**
- `throw new Error('...')` for programmer errors and invalid states (e.g., `BookingService`)
- `console.error(...)` + `return null` for recoverable infrastructure failures (token refresh, calendar sync)
- Auth errors detected via regex pattern matching on error messages

---

*Convention analysis: 2026-05-11*
