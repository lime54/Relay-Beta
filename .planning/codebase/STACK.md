# Technology Stack

**Analysis Date:** 2026-05-11

## Languages

**Primary:**
- TypeScript 5.x - All application code (`src/**/*.ts`, `src/**/*.tsx`)

**Secondary:**
- JavaScript (ESM) - Build/utility scripts (`capture-slides.mjs`, `postcss.config.mjs`, `eslint.config.mjs`)
- SQL - Supabase schema and migration files (`supabase_*.sql`, `supabase_schema.sql`)

## Runtime

**Environment:**
- Node.js v24.13.1 (no `.nvmrc` pinning)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js ^15.5.9 - Full-stack React framework, App Router, Server Components, Server Actions
  - Config: `next.config.ts`
  - Deployment target: Vercel (`vercel.json`)

**UI:**
- React ^19.2.3 / react-dom ^19.2.3
- Tailwind CSS ^4 via `@tailwindcss/postcss` (`postcss.config.mjs`)
  - `tailwind-merge` ^3.5.0, `tw-animate-css` ^1.4.0
- shadcn/ui ^4.0.0 — style: `radix-nova`, baseColor: `neutral` (`components.json`, `src/components/ui/`)
- Radix UI: `@radix-ui/react-avatar`, `@radix-ui/react-separator`, `@radix-ui/react-slot`, `radix-ui` ^1.4.3
- Framer Motion ^12.29.0 + `motion` ^12.35.0
- Lucide React ^0.562.0 (icon library)

**Component Utilities:**
- `class-variance-authority` ^0.7.1
- `clsx` ^2.1.1
- `cmdk` ^1.1.1 — command palette (`src/components/command-menu.tsx`)
- `sonner` ^2.0.7 — toast notifications
- `react-easy-crop` ^5.5.6 — profile photo cropping

**Forms & Validation:**
- Zod ^4.3.6
- Next.js Server Actions (native)

**PDF:**
- `pdfjs-dist` ^5.7.284 — resume upload parsing

**AI/LLM (installed, not actively called in src/):**
- `@ai-sdk/openai` ^3.0.41
- `ai` ^6.0.116

**Testing:**
- Playwright ^1.59.1 — E2E, Chromium only, config: `playwright.config.ts`, tests in `./tests/`
- Puppeteer ^24.43.0 — devDependency, used in `capture-slides.mjs`

**Build/Dev:**
- Next.js built-in bundler (Turbopack/Webpack)
- TypeScript `noEmit: true` — type checking only; `ignoreBuildErrors: true` in `next.config.ts`
- ESLint ^9 — config `eslint.config.mjs`, extends `next/core-web-vitals`, `next/typescript`

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` ^2.91.0 — database, auth, storage, realtime
- `@supabase/ssr` ^0.8.0 — cookie-based SSR sessions for Next.js
- `stripe` ^22.1.1 — subscription billing SDK
- `googleapis` ^171.4.0 — Google Calendar API v3
- `resend` ^6.9.3 — transactional email
- `@hcaptcha/react-hcaptcha` ^2.0.2 — CAPTCHA on auth forms

**Infrastructure:**
- `next/font/google` (built-in) — Geist Sans + Playfair Display

## Configuration

**Environment:**
- All secrets consumed via `process.env.*` at runtime; `.env.local` expected locally
- See INTEGRATIONS.md for full env var list

**Build:**
- `next.config.ts` — ESLint and TypeScript errors silenced in builds
- `tsconfig.json` — ES2017 target, strict mode, bundler resolution, `@/*` → `./src/*`
- `components.json` — shadcn/ui configuration

## Platform Requirements

**Development:**
- Node.js (v24 at time of analysis; no version pinned)
- npm
- `.env.local` with required env vars

**Production:**
- Vercel
- Supabase project (database + auth + storage + realtime)
- Stripe account
- Google Cloud OAuth 2.0 credentials
