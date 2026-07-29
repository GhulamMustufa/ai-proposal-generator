# Backend Development Guide (`apps/api`)

## 1. Tech Stack
- Node.js (v20+)
- **NestJS** (Progressive Node.js Framework)
- TypeScript
- BullMQ (via `@nestjs/bullmq` with Redis)
- Playwright & Cheerio (Scraping Automation)
- **Clerk** (Authentication) + **Drizzle ORM** (Database Queries)
- Neon PostgreSQL (Serverless Database) with `pgvector`
- Lemon Squeezy (Billing & Subscriptions)
- Cloudflare R2 (S3-compatible Blob Storage)

## 2. Directory Structure (NestJS Modules)
```text
apps/api/
  src/
    app.module.ts       # Root module
    auth/               # ClerkAuthGuard and authentication logic
    proposals/          # Proposal generation endpoints and LLM prompts
    matcher/            # Vector similarity search and AI scoring logic
    ingestion/          # Web scraping and Job Board integration engine
    billing/            # Lemon Squeezy webhook handlers
    db/                 # Drizzle ORM schemas and connection logic
    workers/            # BullMQ @Processors
```

## 3. Background Processing (BullMQ)
Vercel serverless functions timeout after 10-60 seconds. Therefore, ALL heavy lifting must occur in this NestJS app using the `@nestjs/bullmq` module.

### 3.1 Worker Processors
- `ingestion.processor.ts`: Consumes jobs to scrape 10+ different job boards (Remotive, WWR, RemoteOK) and runs advanced Google Dorks via Serper.dev.
- `proposals.processor.ts`: Handles calling the OpenAI API asynchronously to prevent API timeouts during heavy load.

## 4. Architectural Rules & Technical Debt

> [!WARNING]
> **Missing DTO Validation**: Currently, many controllers (e.g., `proposals.controller.ts`) type their incoming payloads as `@Body() body: any`. This bypasses NestJS's `ValidationPipe` and `class-validator`, requiring manual `if (!body.field)` checks in the service layer. Refactoring this to use strictly typed DTO classes is a high priority.

> [!WARNING]
> **God Classes**: The `IngestionService` is a massive ~1000-line class that knows how to scrape dozens of independent websites. It violates the Single Responsibility Principle and should be refactored into an `IScraper` interface with distinct Strategy classes.

## 5. API & Database Design
- **ORM Rules:** Use Drizzle ORM injected via providers for all database interactions.
- **Auth Rules:** Use `ClerkAuthGuard` to protect endpoints. Retrieve the user ID via `req.user.id`.
- **Storage:** Upload all tailored PDF resumes directly to Cloudflare R2 using the standard AWS S3 SDK for Node.js.
- **Error Handling:** Use global Exception Filters in NestJS to catch all async errors and return standardized JSON `{ error: { code, message } }`. Do not swallow exceptions in background queues. For external `fetch` calls (e.g., job boards), ensure proper `AbortSignal.timeout` usage, but consider adding robust exponential backoff.
