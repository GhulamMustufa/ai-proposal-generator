# Proposalio — AI Proposal Generator

An AI-powered SaaS that generates personalized, high-converting freelance proposals in your own voice — in under 90 seconds.

Built with Next.js 14, Supabase, and OpenAI.

---

## Features

- **Streaming AI generation** — proposals write themselves token-by-token in real time
- **Voice matching** — paste up to 3 past proposals; the AI mirrors your tone and phrasing
- **Profile injection** — set your skills, rate, and bio once; every proposal is auto-personalized
- **Job feed** — search live remote jobs from Remotive without leaving the dashboard
- **Application tracker** — tag proposals as Draft / Sent / Interview / Won / Lost
- **Proposal history** — full archive of every generated proposal, linkable by ID
- **Two-variation mode** — generate a Direct and a Conversational version in parallel
- **Password reset** — full PKCE-based reset flow via Supabase email
- **Dark mode** — system-aware with manual toggle

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 + next-themes |
| Auth + Database | Supabase (`@supabase/ssr`) |
| AI | OpenAI `gpt-4o-mini` via `chat.completions` (streaming) |
| Job source | Remotive public API |

---

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/GhulamMustufa/ai-proposal-generator.git
cd ai-proposal-generator
npm install
```

### 2. Set up environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Set up the database

Run these SQL files against your Supabase project in order (SQL editor or `supabase db push`):

```
supabase/saas_controls.sql           # api_usage_events + ai_request_cache tables
supabase/add_user_preferences.sql    # user_preferences table
supabase/add_job_fields_to_proposals.sql   # job_title + job_link on proposals
supabase/add_status_and_profile.sql  # status on proposals + profile fields on user_preferences
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Landing / marketing page
│   ├── dashboard/                    # Main app — ProposalGenerator + JobFeed
│   ├── history/                      # Proposal history list
│   ├── proposals/[id]/               # Proposal detail
│   ├── profile/                      # Profile editor
│   ├── login/ signup/ forgot-password/
│   ├── auth/                         # Server actions + OAuth callback + reset-password
│   └── api/
│       ├── generate-proposal/        # POST — AI generation (streaming + non-streaming)
│       ├── jobs/                     # GET — Remotive job feed
│       ├── preferences/              # GET/PUT — user preferences & profile
│       └── proposals/[id]/           # PATCH — update proposal status
├── components/
│   ├── dashboard/                    # ProposalGenerator, JobFeed
│   ├── history/status-badge.tsx      # Color-coded status selector
│   ├── layout/                       # Navbar, ThemeToggle
│   └── ui/toaster.tsx                # Toast notifications
└── lib/
    ├── clean-description.ts          # Strip HTML from job descriptions
    ├── toast.ts                      # Singleton toast system
    └── supabase/                     # Browser + server Supabase clients
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `OPENAI_API_KEY` | Yes | OpenAI secret key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Full URL of your deployment (for password reset redirect) |

---

## Deployment

The app is ready to deploy on [Vercel](https://vercel.com). Set the four environment variables above in your Vercel project settings, connect the GitHub repo, and deploy.

Make sure `NEXT_PUBLIC_SITE_URL` is set to your production URL (e.g. `https://your-app.vercel.app`) so password-reset emails link to the right place.

---

## License

MIT
