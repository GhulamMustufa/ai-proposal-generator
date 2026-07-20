# System Architecture Document

## 1. High-Level Overview
The AI Job Application Platform is designed as an asynchronous, event-driven system to handle long-running tasks like web scraping, AI LLM generation, and automated browser form submission. To support this, we use an NPM Workspace Monorepo separating the user-facing web app from the heavy-lifting background workers.

## 2. Monorepo Structure (`npm workspaces`)
- **`apps/web` (Next.js 15 App Router)**: The user-facing dashboard. Responsible strictly for UI, authentication, and displaying data. It makes HTTP calls to `apps/api`. It does *not* run heavy automated tasks.
- **`apps/api` (Node.js / NestJS)**: The core engine. Runs as a persistent server (e.g., on Render or AWS ECS). It handles REST API endpoints, BullMQ workers via `@nestjs/bullmq`, Playwright automation, and React-PDF generation.
- **`apps/extension` (Manifest V3)**: A Chrome Extension that acts as our semi-automated fallback for Enterprise ATS platforms (like Workday).

## 3. The Dual-Engine Strategy

### Engine A: Fully Automated (Playwright Bots)
**Goal:** 100% hands-free application to standard ATS platforms.
**Target Platforms:** Greenhouse, Lever, Ashby, Workable, etc.
**Flow:**
1. **Ingestion (Dual Trigger):** 
   - *Scheduled:* A background cron worker in `apps/api` scrapes jobs from Tier 2 platforms 3 times a day.
   - *Event-Driven:* Alternatively, webhooks push new jobs instantly to the database.
2. **Matching (Event-Driven):** The moment a job hits the database, it is pushed to the BullMQ Matcher queue to compare against user profiles instantly.
3. If the user approves the match via the dashboard, `apps/api` generates a tailored PDF.
4. A Playwright worker is queued in BullMQ. It spins up a headless Chromium browser, navigates to the ATS link, fills in the user's details, uploads the PDF, and submits.

### Engine B: Semi-Automated (Chrome Extension)
**Goal:** Bypass complex authentication and Captcha walls on enterprise sites.
**Target Platforms:** Workday, Taleo, iCIMS, SAP SuccessFactors, LinkedIn, Indeed.
**Flow:**
1. The user manually navigates to a job posting on Workday while logged into their personal browser.
2. The Chrome extension detects the page and injects a "Tailor & Fill" button.
3. Upon clicking, the extension extracts the DOM context, sends it to `apps/api` for AI generation, and then maps the returned JSON into the Workday input fields automatically.

## 4. Infrastructure & Deployment
- **Frontend Hosting:** Vercel (Hobby/Pro tier).
- **Backend Hosting:** Render Web Service (Node.js environment is mandatory for Playwright execution).
- **Database:** Neon (Serverless PostgreSQL).
- **Authentication:** Clerk (10k MAU free tier).
- **ORM:** Drizzle ORM (for strictly-typed backend queries).
- **Queue/Cache:** Upstash Redis (Serverless).
- **Blob Storage:** Cloudflare R2 (for storing generated PDF resumes with zero egress fees).
- **Email Service:** Resend (for daily digest emails).
