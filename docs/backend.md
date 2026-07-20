# Backend Development Guide (`apps/api`)

## 1. Tech Stack
- Node.js (v20+)
- **NestJS** (Progressive Node.js Framework)
- TypeScript
- BullMQ (via `@nestjs/bullmq`)
- Playwright (Browser Automation)
- Supabase SDK (Auth) + **Drizzle ORM** (Database Queries)
- Cloudflare R2 (S3-compatible Blob Storage)

## 2. Directory Structure (NestJS Modules)
```text
apps/api/
  src/
    app.module.ts     # Root module
    modules/          # Domain-driven feature modules
      jobs/           # JobsModule, JobsController, JobsService
      matcher/        # AI Matching logic and queue processors
      submitter/      # Playwright BullMQ processors
    db/               # Drizzle ORM schemas and connection logic
    lib/              # Shared utilities (S3 client, OpenAI client)
    pdf/              # React-PDF templates and generation scripts
```

## 3. Automation & Workers (CRITICAL)
Vercel serverless functions will timeout after 10-60 seconds. Therefore, ALL heavy lifting must occur in this NestJS app using the `@nestjs/bullmq` module.

### 3.1 Worker Triggers
The backend utilizes a hybrid approach for maximum speed:
- **Scheduled (Cron):** The job scraper worker must run exactly **3 times a day** (e.g., `0 8,14,20 * * *`) via BullMQ repeatable jobs to bulk-fetch Tier 2 jobs.
- **Event-Driven:** The moment a relevant job becomes available (either inserted by the scraper or a webhook), the backend immediately triggers the AI Matcher job via `matcherQueue.add()`. We do *not* wait for a daily batch job to score matches.

### 3.2 Playwright Guidelines
- Always use `playwright-core` (or standard `playwright` if managing browser binaries manually) in headless mode.
- Add robust retry logic and wait for selectors (`page.waitForSelector()`) rather than arbitrary timeouts.
- Expect failures: The ATS DOM will change. Wrap interactions in `try/catch` and log exact failure points to the `applications` table.

## 4. API & Database Design
- **NestJS Decorators:** Use strictly typed DTOs and ValidationPipes for all incoming requests.
- **ORM Rules:** Use Drizzle ORM injected via providers for all database interactions. Supabase SDK should only be used for Authentication verification via a Guard.
- **Storage:** Upload all tailored PDF resumes directly to Cloudflare R2 using the standard AWS S3 SDK for Node.js.
- Use global Exception Filters in NestJS to catch all async errors and return standardized JSON `{ error: { code, message } }`.
