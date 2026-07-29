# Comprehensive System Onboarding Guide

Welcome to the AI Proposal Generator. This document consolidates a 20-phase system analysis to help you understand the architecture, data flows, business logic, and immediate technical debt, so you can become productive immediately.

---

## 1. Feature Walkthrough: Generating a Proposal

To understand the system, let's trace the core feature—clicking "Generate Proposal" on the dashboard:

1. **UI:** User clicks the button in the React component. A POST request is fired to `/api/proposals/generate` (or `enqueue`) with the `job_description` and `personaId`.
2. **API (Controller):** `ProposalsController` receives the request. `ClerkAuthGuard` verifies the JWT. The controller checks the Postgres `users` table to see if the user is on the Free or Pro plan. If Free, it increments their `generationsCount`.
3. **API (Service):** The request passes to `ProposalsService.generate()`.
4. **Rate Limiting & Quotas:** The service pings Redis to check the 10-minute rate limit for the user's IP. It then queries Postgres to ensure daily/monthly limits aren't exceeded.
5. **Caching:** The service hashes the inputs (Job + Persona). It checks Redis to see if this exact proposal was already generated. If so, it returns the cache instantly.
6. **AI Generation:** The service constructs a strict System Prompt and sends it to `gpt-4o`. Because the frontend requested streaming, it uses `stream: true`.
7. **Response (Streaming):** The service pipes the OpenAI stream directly into the Express `res` object, bypassing standard JSON returns. (Alternatively, uses SSE via `@Sse()` if processed by a background worker).
8. **Database:** Once the stream finishes successfully, the backend saves the final string to the `applications` table in Postgres and updates the Redis cache.
9. **UI Update:** The Next.js frontend, reading the chunked stream, updates the state in real-time, displaying the text to the user as if it's being typed out.

---

## 2. Learning Order

To become productive as quickly as possible, read the codebase in this exact order:

1. **`README.md` & `docs/`:** Understand the high-level intent.
2. **`apps/api/src/db/schema.ts` (1 hour):** You cannot understand this app without understanding the relationships between Users, Personas, Jobs, and Matches.
3. **`apps/api/src/ingestion/ingestion.processor.ts` (30 mins):** See how the cron jobs are routed to scrape remote job boards.
4. **`apps/api/src/matcher/matcher.service.ts` (2 hours):** Study the `pgvector` similarity search logic and the OpenAI JSON-mode prompt. This is the core intellectual property of the app.
5. **`apps/api/src/proposals/proposals.service.ts` (2 hours):** Understand the streaming, caching, and strict writing rules for proposals.
6. **`apps/web/src/hooks/use-personas.ts` (30 mins):** Understand how the frontend manually manages state and interacts with the API.

---

## 3. Debugging Guide

When things go wrong, here is how you investigate:

* **"Jobs aren't showing up":** 90% of the time, this is a Redis/BullMQ issue. Check if your local Redis container is running. Place breakpoints in `ingestion.processor.ts` to see if the worker is actually picking up the task.
* **"AI is returning weird JSON":** OpenAI occasionally ignores `response_format`. Place a breakpoint in `matcher.service.ts` at `JSON.parse(outputStr)` to catch parsing errors.
* **Local Development:** Always run Redis and Postgres locally via Docker before starting the NestJS app. Trigger the scrapers manually using the HTTP endpoints (like `/api/ingestion/trigger/scrape-dorks`) instead of waiting for the Cron scheduler.

---

## 4. How to Add New Features

**Example Scenario: Adding a new Job Board (e.g., "Wellfound")**

1. **Modify `IngestionService`:** Open `apps/api/src/ingestion/ingestion.service.ts`. Create a new method `async scrapeWellfound(): Promise<string[]>`.
2. **Implement Logic:** Use `fetch` or `puppeteer` to get the jobs. Hash a unique `externalId`. Use the exact same Postgres `onConflictDoNothing()` pattern to prevent duplicates.
3. **Update Processor:** Open `ingestion.processor.ts`. Add a new switch case for `'scrape-wellfound'` that calls your new method.
4. **Schedule it:** Add a new `@Cron()` decorator (likely in `app.module.ts` or an `IngestionModule` init step) to fire `'scrape-wellfound'` periodically.

*Follow the existing abstractions.* Do not reinvent database insertion logic; use the patterns already established in the ingestion service.

---

## 5. Senior Engineer Architecture Review

### The Good
- **Architecture:** Offloading heavy scraping and LLM inferences to BullMQ background workers is exactly how this should be built. Next.js Server Actions would have resulted in Vercel timeouts.
- **Separation of Concerns:** The monorepo separates API and Web domains effectively.
- **Prompts:** The strict OpenAI system prompts are exceptionally well-written for business logic.
- **ORM:** The use of Drizzle ORM keeps database queries lightweight.

### The Bad (Immediate Technical Debt)
1. **Missing DTOs (`@Body() body: any`):** The NestJS controllers completely bypass `class-validator` by using `any`. This makes the API fragile, undocumented, and unsafe. **Refactor priority: High.**
2. **Missing Database Indexes:** The schema lacks explicit Foreign Key indexes on `userId` and `personaId`. **Refactor priority: Critical.**
3. **Missing Vector Indexes:** `pgvector` similarity search in `matcher.service.ts` currently performs a sequential K-NN scan. This will crash the database CPU as the `jobs` table grows. We must implement `HNSW` or `IVFFlat` indexes on the vector embeddings. **Refactor priority: Critical.**
4. **Puppeteer DoS Vulnerability:** Generating PDFs synchronously using Puppeteer in a GET request (`GET /api/proposals/:id/pdf`) is a denial-of-service vector. It must be moved to a background queue.
5. **Frontend State Management:** The manual variable caching (`let cachedPersonas = null`) in custom hooks is brittle. It should be replaced with React Query (TanStack Query).
6. **Plaintext API Keys:** `user_profiles` stores OpenAI keys in plaintext. They must be encrypted at rest.
7. **God Classes:** `IngestionService` knows how to scrape 20+ different websites. It should be refactored into distinct Strategy classes implementing an `IScraper` interface.
8. **DevOps Missing:** There are no Dockerfiles or GitHub Actions for CI/CD currently present in the codebase.

### What should NEVER be changed without understanding?
**The Deduplication Hash (`externalId`)**: If you change how this is generated in the `IngestionService`, the scraper will re-insert thousands of duplicate jobs, destroying your OpenAI credit balance because the Matcher will attempt to score them all again.
