# System Architecture

The AI Proposal Generator is built as an **NPM Workspace Monorepo**, separating the client-facing UI from the heavy background processing.

## 1. Directory Structure
```
ai-proposal-generator/
├── apps/
│   ├── api/      (NestJS backend)
│   └── web/      (Next.js frontend)
├── docs/         (Project documentation)
├── .agents/      (AI behavior rules)
├── package.json
└── package-lock.json
```

## 2. Core Components

### Frontend (`apps/web`)
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS with custom Glassmorphism/Dark mode support
- **Auth**: Clerk (Next.js middleware protects routes, handles user sessions)
- **Role**: Renders the dashboard, listens to Server-Sent Events (SSE) for background task updates, and provides a beautiful interface for users to review AI matches and generate proposals.

### Backend (`apps/api`)
- **Framework**: NestJS (Node.js)
- **Role**: Core orchestration engine. Exposes a REST API, handles incoming webhook events (Lemon Squeezy), and manages background processing.
- **Auth**: Validates Clerk JWT tokens in an auth guard.

### Background Workers (BullMQ + Redis)
- **Framework**: BullMQ (running inside NestJS)
- **Role**: Offloads heavy tasks to prevent API timeouts.
- **Queues**:
  - `proposalsQueue`: Handles calling the OpenAI API to generate tailored proposals and cold emails.
  - *(Future)* `ingestionQueue`: Nightly cron jobs to scrape public boards (Remotive, WWR) and private ATS platforms (Greenhouse, Lever).

### Database (Drizzle ORM + Neon PostgreSQL)
- **Framework**: Drizzle ORM configured with Neon Serverless Driver (`@neondatabase/serverless`)
- **Role**: Single source of truth for users, subscription states, job postings, and generated applications.

## 3. Request Flow Example (Generating a Proposal)
1. **Client**: User clicks "Generate" on a job card in the Next.js UI.
2. **Next.js**: Fetches the active Clerk token and sends a `POST /api/proposals/enqueue` request to the NestJS backend.
3. **NestJS (Controller)**: Validates the token, checks the user's Drizzle `subscriptionStatus` to ensure they haven't hit the paywall limit.
4. **NestJS (BullMQ)**: Pushes the job ID into the Redis queue and returns `202 Accepted` to the client.
5. **Next.js**: Opens an `EventSource` connection to `/api/proposals/status/:userId` and shows a loading spinner.
6. **NestJS (Worker)**: Picks up the job, fetches the user's profile, calls OpenAI with a strict prompt, and saves the output to PostgreSQL.
7. **NestJS (Service)**: Emits a success event with the generated text through an RxJS `Subject`.
8. **Next.js**: Receives the SSE event, closes the stream, and immediately displays the generated proposal to the user.
