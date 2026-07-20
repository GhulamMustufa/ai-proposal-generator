# Database Architecture & Schema

## 1. Overview
The platform uses **PostgreSQL** hosted on **Neon** (Serverless Postgres).
For the MVP, we are adopting **Drizzle ORM** (as specified in our Coding Standards) for type-safe queries in the Node.js backend.

## 2. Current Legacy Tables (AI Proposal Generator)
The existing project has the following tables, which we will adapt/expand:
- `user_preferences`: Stores `bio`, `skills`, `hourly_rate`, `experience_years`.
- `proposals`: Tracks `job_title`, `job_link`, `status` (draft, sent, won).
- `api_usage_events`: Handles API rate limiting.
- `ai_request_cache`: Caches LLM generations to save costs.

## 3. New MVP Tables (To be implemented)

### `users` (Auth extension)
- `id` (UUID, PK, references auth.users)
- `stripe_customer_id` (String)
- `subscription_status` (Enum: free, pro)

### `jobs` (Ingestion)
- `id` (UUID, PK)
- `title`, `company`, `description`, `url`, `source`
- `apply_url` (String - The direct link to Lever/Greenhouse for the bot)
- `created_at` (Timestamp)
- *Indexes: `created_at`, `source`*

### `matches` (AI Scoring)
- `id` (UUID, PK)
- `user_id` (UUID, FK to users)
- `job_id` (UUID, FK to jobs)
- `match_score` (Integer, 0-100)
- `match_reasoning` (Text)
- *Indexes: `user_id` + `match_score`*

### `applications` (Submissions & Tracking)
- `id` (UUID, PK)
- `user_id` (UUID, FK)
- `job_id` (UUID, FK)
- `status` (Enum: queued, processing, submitted, failed, manual)
- `tailored_resume_url` (String - S3 link)
- `submission_logs` (JSONB - Playwright execution logs)
- *Indexes: `user_id`, `status`*
