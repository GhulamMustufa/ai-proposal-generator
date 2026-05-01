@AGENTS.md

# Proposalio — Project Overview

AI-powered freelance proposal generator. Next.js 14 App Router SaaS with Supabase auth, OpenAI generation, real-time streaming, and a full application tracker.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2 (App Router, server components) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 + `next-themes` (dark mode) |
| Auth + DB | Supabase (`@supabase/ssr` — cookie-based SSR auth) |
| AI | OpenAI SDK 6.x — `gpt-4o-mini`, `chat.completions.create()` |
| HTTP (jobs) | Native `fetch` with `AbortSignal.timeout()` |
| HTML parsing | `cheerio` (job URL extraction) |
| Toast | Custom singleton (`src/lib/toast.ts`) |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
NEXT_PUBLIC_SITE_URL        # used for password-reset redirect
```

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                        # Landing / marketing page
│   ├── layout.tsx                      # Root layout (Navbar, Toaster, ThemeProvider)
│   ├── globals.css
│   ├── dashboard/
│   │   ├── page.tsx                    # Dashboard (ProposalGenerator + JobFeed)
│   │   └── loading.tsx                 # Suspense skeleton
│   ├── history/
│   │   └── page.tsx                    # Proposal history list with StatusBadge
│   ├── proposals/[id]/
│   │   └── page.tsx                    # Proposal detail with StatusBadge
│   ├── profile/
│   │   └── page.tsx                    # User profile editor (client component)
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   ├── forgot-password/page.tsx
│   ├── auth/
│   │   ├── actions.ts                  # Server actions: login, signup, logout, resetPassword
│   │   ├── callback/route.ts           # OAuth/PKCE code exchange (password reset + future Google login)
│   │   └── reset-password/page.tsx     # New password form (client, uses browser Supabase)
│   └── api/
│       ├── generate-proposal/route.ts  # POST — main AI generation endpoint
│       ├── jobs/route.ts               # GET — Remotive job feed
│       ├── preferences/route.ts        # GET/PUT — user preferences + profile
│       └── proposals/[id]/route.ts     # PATCH — update proposal status
├── components/
│   ├── auth/auth-form.tsx              # Shared login/signup form
│   ├── dashboard/
│   │   ├── proposal-generator.tsx      # Manual proposal generator (streaming consumer)
│   │   └── job-feed.tsx                # Job search + per-card proposal generation
│   ├── history/
│   │   └── status-badge.tsx            # Client component — color-coded status <select>
│   ├── layout/
│   │   ├── navbar.tsx                  # Server component nav (Dashboard/History/Profile/Logout)
│   │   └── theme-toggle.tsx
│   ├── providers/theme-provider.tsx
│   └── ui/toaster.tsx                  # Fixed-position toast queue
├── lib/
│   ├── clean-description.ts            # Strip HTML/entities from job descriptions
│   ├── toast.ts                        # Singleton toast (register/unregister pattern)
│   └── supabase/
│       ├── client.ts                   # Browser Supabase client
│       ├── server.ts                   # Server Supabase clients (createClient, createActionClient)
│       └── middleware.ts               # Session refresh helper
├── middleware.ts                       # Supabase session refresh on every request
└── instrumentation.ts                  # Sets dns.setDefaultResultOrder('ipv4first') on startup
```

---

## Database Tables

Run SQL files in `supabase/` in this order:

1. `saas_controls.sql` — `api_usage_events`, `ai_request_cache` tables + RLS
2. `add_user_preferences.sql` — `user_preferences` table + RLS
3. `add_job_fields_to_proposals.sql` — adds `job_title`, `job_link` to `proposals`
4. `add_status_and_profile.sql` — adds `status` to `proposals`; adds `display_name`, `bio`, `skills`, `hourly_rate`, `experience_years` to `user_preferences`

### Key columns

**`proposals`**: `id`, `user_id`, `job_title`, `job_link`, `job_description`, `generated_proposal`, `status` (draft/sent/interview/won/lost), `created_at`

**`user_preferences`**: `user_id`, `default_keywords`, `display_name`, `bio`, `skills`, `hourly_rate`, `experience_years`, `updated_at`

**`api_usage_events`**: rate limiting per user + IP

**`ai_request_cache`**: deduplication cache keyed on `request_hash` + optional `idempotency_key`, with `expires_at`

---

## Key Implementation Details

### AI Generation (`/api/generate-proposal`)

- Model: `gpt-4o-mini`, temperature 0.5, max_tokens 400
- Prompt split into **system message** (copywriting ruleset — no "I" opener, no salutation, no bullets, no buzzwords, 150–180 word target) and **dynamic user message** (profile + voice samples + job description, separated by `---`)
- Voice samples: up to 3, each 600 chars max, with explicit style-extraction instruction (don't copy verbatim)
- Profile injection: fetched from `user_preferences` after auth, injected as `FREELANCER PROFILE` block
- **Streaming**: single proposals use `chat.completions.create({ stream: true })`, stream chunks directly to client, save to DB after stream ends, send `\n\n[DONE:{proposal_id}]` sentinel
- **Non-streaming**: two-variations mode runs both calls in parallel via `Promise.all`, returns JSON
- Rate limiting: 10 calls/10 min per user, 20/10 min per IP (free plan)
- Quota: 30/day, 300/month (free plan)
- Cache: 7-day TTL keyed on `prompt_version:4` + job + samples + model config

### Job Feed (`/api/jobs`)

- Source: Remotive public API (`remotive.com/api/remote-jobs`)
- Native `fetch` with 12s timeout via `AbortSignal.timeout()`
- Descriptions cleaned server-side via `cleanDescription()` before returning to client
- DNS fix: `instrumentation.ts` sets `ipv4first` on startup (fixes `ENOTFOUND` in local dev)

### Application Tracker

- `StatusBadge` client component renders a color-coded `<select>` (draft/sent/interview/won/lost)
- Calls `PATCH /api/proposals/[id]` with `{ status }`, scoped to authenticated user
- Used in both history list and proposal detail page
- History list avoids nested `<a>` by wrapping only the text in `<Link>`, keeping badge + "View Job" as siblings outside it

### Toast System

- `src/lib/toast.ts` exports a singleton with `_register`/`_unregister`
- `Toaster` component registers on mount; `toast.success()` / `toast.error()` work from any client component without React Context

### Password Reset Flow

- `/forgot-password` → `requestPasswordReset` server action → Supabase email with link to `/auth/callback?next=/auth/reset-password`
- `/auth/callback` exchanges the PKCE `code` param and redirects to `/auth/reset-password`
- `/auth/reset-password` uses browser Supabase client to call `supabase.auth.updateUser({ password })`

---

## Development Notes

- `next.config.mjs` has `experimental.instrumentationHook: true` to enable `src/instrumentation.ts`
- `axios` is still in `package.json` but the jobs route was migrated to native `fetch` — it's unused
- `fast-xml-parser` is in `package.json` but unused (leftover from the abandoned Upwork RSS approach)
- The `createActionClient()` function in `src/lib/supabase/server.ts` is synchronous — don't `await` it
- Two-variations proposals are generated in parallel (`Promise.all`), not sequentially
