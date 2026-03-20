# For Lejla

Private romantic web app for Lejla & Hamza to share memories, love letters, and grow a virtual garden together.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend:** Supabase (PostgreSQL) — no API routes, frontend calls Supabase directly
- **Deployment:** GitHub Pages via `gh-pages` package
- **Testing:** Vitest + React Testing Library

## Project Structure

```
src/
  App.tsx                  # Auth check, page routing
  main.tsx                 # Entry point, global error handlers
  components/
    PasswordGate.tsx       # Password creation & login
    Navigation.tsx         # Bottom tab bar (3 tabs)
  pages/
    Timeline.tsx           # Memory timeline with photos
    Letters.tsx            # Love letters (sealed/opened)
    Garden.tsx             # Virtual flower garden with bloom mechanic
  hooks/
    useLocalStorage.ts     # React hooks (useTimeline, useLetters, useFlowers)
                           # Handles optimistic updates, SWR caching, error reverting
  utils/
    storage.ts             # All Supabase CRUD operations + localStorage cache
    logger.ts              # Batched logging to Supabase app_logs table + console
  lib/
    supabase.ts            # Supabase client init + DB types
  types/
    index.ts               # TypeScript interfaces (TimelineEntry, Letter, Flower, Page)
supabase-setup.sql         # Full DB schema + RLS policies + app_logs table
```

## Key Patterns

- **Optimistic updates:** UI updates instantly, Supabase write happens async. On failure, hooks revert by re-fetching.
- **Stale-while-revalidate:** Cached data shown immediately from localStorage, fresh data fetched in background. A syncing dot indicator shows when revalidating.
- **Photo handling:** Photos are compressed client-side (max 1200px, JPEG 70% quality) before base64 encoding and storing in the DB. Photos are lazy-loaded via IntersectionObserver and cached in IndexedDB.
- **Logging:** `logger.ts` queues log entries and flushes to the `app_logs` Supabase table every 500ms. All errors also write to `console.error` for devtools visibility.
- **Auth:** Simple password stored in `app_settings` table. Session tracked via localStorage (`lejla_authenticated`).

## Language

The entire UI is in Bosnian (Latin script).

## Commands

```bash
npm run dev        # Start dev server
npm run build      # Type-check + production build
npm test           # Run all tests (vitest)
npm run deploy     # Build + deploy to GitHub Pages (gh-pages branch)
```

## Environment Variables

Copy `.env.example` to `.env`:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Fallback values are hardcoded in `src/lib/supabase.ts` for the production instance.

## Database Setup

Run `supabase-setup.sql` in the Supabase SQL Editor. It creates:

- `timeline_entries` — memories with optional base64 photos
- `letters` — love letters with opened/unopened state
- `flowers` — garden flowers with bloom state and type enum
- `app_settings` — password storage
- `app_logs` — error/info logging with user_agent

All tables use UUID PKs, RLS enabled with permissive public policies.

## Deploying

`npm run deploy` builds and pushes `dist/` to the `gh-pages` branch. This does **not** require the source to be committed/pushed first — it operates on the build output directly. Remember to also `git push` source changes to `master`.

## Testing

78 tests across 7 files covering:

- `storage.test.ts` — CRUD operations, error handling, caching, cache fallback
- `logger.test.ts` — Console output, batched Supabase flush, failure handling
- `useLocalStorage.test.ts` — Optimistic updates, error reverting, mount loading
- `PasswordGate.test.tsx` — Login, creation, validation
- `Timeline.test.tsx` — States, form submission, delete
- `Letters.test.tsx` — States, form submission, open/mark-read
- `Garden.test.tsx` — States, flower type selection, planting, blooming

Test files are excluded from `tsc` build via `tsconfig.json` — Vitest handles their type checking separately.
