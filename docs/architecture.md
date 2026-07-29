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
  - `ingestionQueue`: Nightly cron jobs to scrape public boards (Remotive, WWR, RemoteOK) and parse advanced Google Dork queries using Serper.dev.

### Database (Drizzle ORM + Neon PostgreSQL)
- **Framework**: Drizzle ORM configured with Neon Serverless Driver (`@neondatabase/serverless`)
- **Role**: Single source of truth for users, subscription states, job postings, and generated applications.
- **AI Matching (Vector DB)**: Uses `pgvector` for calculating `cosineDistance` between Jobs and User Personas to retrieve the Top 50 highest-probability matches before sending them to the LLM for final scoring.

## 3. DevOps & Deployment
> [!WARNING]
> **Technical Debt**: Currently, there are no Dockerfiles (`docker-compose.yml`) or CI/CD pipelines (`.github/workflows`) present in the repository. Deployment relies on external PaaS features (e.g. Vercel for the frontend and raw Node.js deployments on Render/Railway for the backend). Creating a robust containerization strategy is a high priority.

## 4. Request Flow Example (Generating a Proposal)
1. **Client**: User clicks "Generate" on a job card in the Next.js UI.
2. **Next.js**: Fetches the active Clerk token and sends a `POST /api/proposals/enqueue` request to the NestJS backend.
3. **NestJS (Controller)**: Validates the token, checks the user's Drizzle `subscriptionStatus` to ensure they haven't hit the paywall limit.
4. **NestJS (BullMQ)**: Pushes the job ID into the Redis queue and returns `202 Accepted` to the client.
5. **Next.js**: Opens an `EventSource` connection to `/api/proposals/status/:userId` and shows a loading spinner.
6. **NestJS (Worker)**: Picks up the job, fetches the user's profile, calls OpenAI with a strict prompt, and streams the output to the client via SSE. It then saves the output to PostgreSQL.
7. **Next.js**: Receives the SSE event stream, displaying the proposal dynamically, then closes the connection upon completion.

> [!CAUTION]
> **PDF Generation Risk**: The `GET /api/proposals/:id/pdf` endpoint spins up Puppeteer (headless Chromium browser) *synchronously* in the request thread. This is a DoS vector under heavy load. It must be refactored to use BullMQ for asynchronous PDF generation and return pre-signed S3 links.
