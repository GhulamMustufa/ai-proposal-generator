# Backend Development Guide (`apps/api`)

## 1. Tech Stack
- Node.js (v20+)
- **NestJS** (Progressive Node.js Framework)
- TypeScript
- BullMQ (via `@nestjs/bullmq` with Redis)
- Playwright (Browser Automation)
- **Clerk** (Authentication) + **Drizzle ORM** (Database Queries)
- Neon PostgreSQL (Serverless Database)
- Lemon Squeezy (Billing & Subscriptions)
- Cloudflare R2 (S3-compatible Blob Storage)

## 2. Directory Structure (NestJS Modules)
```text
apps/api/
  src/
    app.module.ts       # Root module
    auth/               # ClerkAuthGuard and authentication logic
    proposals/          # Proposal generation endpoints and BullMQ processors
    billing/            # Lemon Squeezy webhook handlers and checkout logic
    db/                 # Drizzle ORM schemas and connection logic
    lib/                # Shared utilities
```

## 3. Automation & Workers (CRITICAL)
Vercel serverless functions will timeout after 10-60 seconds. Therefore, ALL heavy lifting must occur in this NestJS app using the `@nestjs/bullmq` module.

### 3.1 Worker Triggers
The backend utilizes a hybrid approach for maximum speed:
- **Scheduled (Cron):** The job scraper worker must run regularly via BullMQ repeatable jobs to bulk-fetch jobs.
- **Event-Driven:** When a user requests a proposal manually (via `POST /api/proposals/enqueue`), the job is pushed to the `proposalsQueue` for immediate processing by OpenAI. The backend streams the real-time status back via Server-Sent Events (SSE).

### 3.2 Playwright Guidelines (Future Implementations)
- Always use `playwright-core` (or standard `playwright` if managing browser binaries manually) in headless mode.
- Add robust retry logic and wait for selectors (`page.waitForSelector()`) rather than arbitrary timeouts.
- Expect failures: The ATS DOM will change. Wrap interactions in `try/catch` and log exact failure points.

## 4. API & Database Design
- **NestJS Decorators:** Use strictly typed DTOs and ValidationPipes for all incoming requests.
- **ORM Rules:** Use Drizzle ORM injected via providers for all database interactions.
- **Auth Rules:** Use `ClerkAuthGuard` to protect endpoints. Retrieve the user ID via `req.user.id`.
- **Storage:** Upload all tailored PDF resumes directly to Cloudflare R2 using the standard AWS S3 SDK for Node.js.
- **Error Handling:** Use global Exception Filters in NestJS to catch all async errors and return standardized JSON `{ error: { code, message } }`. Do not swallow exceptions in background queues.
