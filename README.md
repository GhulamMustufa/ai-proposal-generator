<div align="center">
  <h1>🚀 Auto-Apply AI Agent</h1>
  <p><strong>A hyper-scalable, AI-powered social media & job board automation engine.</strong></p>
  <p>Fully autonomous job sourcing, semantic resume matching, and dynamic proposal generation powered by LLMs.</p>
</div>

---

## 📖 Overview

This project is a high-performance, distributed background worker system designed to automate the process of finding, filtering, and applying to high-paying freelance, contract, and full-time remote tech jobs. 

Rather than relying on basic string matching, the engine leverages **OpenAI (`gpt-4o-mini` & `gpt-4o`)** to syntactically validate jobs, score them against user profiles, and generate bespoke cover letters/proposals.

## 🏗️ Architecture Stack

### **Frontend**
*   **Framework:** Next.js 14 (App Router)
*   **Styling:** Tailwind CSS + Shadcn UI
*   **State & Auth:** Clerk Auth

### **Backend (API & Background Workers)**
*   **Framework:** NestJS
*   **Task Queue:** BullMQ + Redis (Asynchronous distributed processing)
*   **Database:** PostgreSQL (Neon Serverless)
*   **ORM:** Drizzle ORM
*   **Scraping & Automation:** Playwright, Cheerio, SerpApi

### **AI & LLM Tier**
*   **Extraction & Validation:** `gpt-4o-mini` (For fast, low-cost job snippet validation)
*   **Matching & Scoring:** `gpt-4o-mini` (Scores user skills against job descriptions)
*   **Proposal Generation:** Configurable LLMs (Drafts custom proposals and cold emails)

---

## ⚙️ Core Modules

### 1. The Ingestion Engine (Scraping)
The system runs autonomous background workers on Cron schedules using BullMQ. It currently aggregates jobs from **23+ different platforms**, preventing duplicates using deterministic MD5 hashing (`externalId`).

**Standard Job Boards:**
`Remotive`, `We Work Remotely`, `RemoteOK`, `Upwork`, `Freelancer.com`, `WorkingNomads`, `Himalayas`, `Jobicy`, `Arbeitnow`, `Remote.co`, `Dribbble`, `Relocate.me`.

**ATS Providers:**
Universal scrapers for `Greenhouse` and `Lever`.

**Google Dorks (Hidden Jobs):**
Using SerpApi, the engine searches Google for raw posts from founders and recruiters, circumventing traditional ATS tracking.
*   *Hacker News ("who is hiring")*
*   *Twitter / X*
*   *LinkedIn (Direct Social Posts)*
*   *Reddit (r/forhire, r/reactnative)*
*   *IndieHackers & Wellfound*
*   *Braintrust & Arc.dev*
*   *GitHub Issue Boards*

### 2. The AI Matcher
To prevent API cost bloat, the Matcher Service operates on a two-tier system:
1.  **Hard Keyword Filter:** A strict regex/keyword filter checks if the job description contains at least 70% of the user's defined core skills.
2.  **LLM Scoring:** If the 70% threshold is met, the job is sent to OpenAI to generate a contextual `match_score` (0-100) and a `match_reasoning` summary.

### 3. The Proposal Generator
Once a high-quality job is approved on the frontend dashboard, the engine fires a task to generate a bespoke proposal or cold email.

---

## 🗄️ Database Schema (Drizzle ORM)

The database is built on PostgreSQL, utilizing standard UUIDs and relational constraints.

| Table | Description | Key Columns |
| :--- | :--- | :--- |
| **`users`** | Core user account mapping (Clerk ID). | `id` (Clerk ID), `email`, `stripeCustomerId`, `subscriptionStatus` |
| **`user_profiles`** | AI context for the user. | `userId`, `skills` (JSON), `jobFilters` (JSON), `resumeText` |
| **`jobs`** | Centralized, deduplicated job repository. | `id`, `platform`, `externalId` (Hash), `title`, `company`, `description`, `url` |
| **`ai_matches`** | Scoring relations between users and jobs. | `userId`, `jobId`, `matchScore` (0-100), `matchReasoning` |
| **`applications`** | Tracked proposals and automated submissions. | `userId`, `jobId`, `generatedProposal`, `status` (`pending`, `submitted`) |
| **`target_companies`** | Tracking parameters for universal ATS scraping. | `name`, `atsProvider` (`greenhouse`/`lever`), `atsBoardToken` |

---

## 🚀 Quick Start / Development

### Prerequisites
*   Node.js 18+
*   Redis (Local or Cloud)
*   PostgreSQL Database
*   API Keys: Clerk, OpenAI, SerpApi

### 1. Installation
\`\`\`bash
npm install
\`\`\`

### 2. Environment Variables
Create a \`.env\` file in both the \`apps/api\` and \`apps/web\` directories.
\`\`\`env
# API (.env)
DATABASE_URL=postgres://user:pass@host/db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
SERPAPI_KEY=...
CLERK_SECRET_KEY=sk_test_...

# WEB (.env)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_API_URL=http://localhost:3001
\`\`\`

### 3. Run the Stack
\`\`\`bash
# Start the NestJS Backend & Background Workers
npm run dev:api

# Start the Next.js Frontend
npm run dev:web
\`\`\`

### 4. Trigger Ingestion Manually
To bypass the cron schedules and force the ingestion workers to run immediately, you can hit the local trigger endpoint:
\`\`\`bash
# Trigger the Google Dorks worker
curl -X POST http://localhost:3001/ingestion/trigger/scrape-dorks
\`\`\`

---

## 🛡️ Best Practices & Cost Optimization
- **Deduplication:** Jobs are heavily deduplicated before database insertion.
- **LLM Rate Limits:** OpenAI processing occurs sequentially within BullMQ to prevent `429 Rate Limit` errors.
- **SerpApi Budgets:** Dork queries rely heavily on boolean `OR` operators to fetch 6+ tech stacks across 3+ platforms in a single API call, allowing massive scale on free or low-tier SerpApi plans.
