# Internal API Documentation

*Base URL: `http://localhost:4000/api` (Local Dev) or `https://api.yourdomain.com/api` (Prod)*

## Authentication
All protected routes require a Bearer token issued by Supabase Auth in the `Authorization` header.

---

## 1. Jobs & Matches

### `GET /jobs`
Fetches a paginated list of ingested jobs.
- **Query Params:** `page` (default 1), `limit` (default 20), `status` (optional)
- **Response:**
  ```json
  {
    "data": [
      { "id": "uuid", "title": "Senior Eng", "company": "Stripe", "url": "..." }
    ],
    "meta": { "total": 150, "page": 1 }
  }
  ```

### `GET /matches/:userId`
Fetches jobs scored by the AI Matcher for a specific user, ordered by score descending.

---

## 2. Generation & Tailoring

### `POST /generate-proposal` (Used by Chrome Extension)
Generates text-based proposals for manual pasting into sites like Upwork/LinkedIn.
- **Body:** `{ "job_description": "...", "user_id": "uuid" }`
- **Response:** `{ "proposal_text": "..." }`

### `POST /resume/generate`
Triggers the AI to rewrite the user's base resume and renders it into a custom PDF for a specific job.
- **Body:** `{ "job_id": "uuid", "user_id": "uuid" }`
- **Response:** 
  ```json
  { 
    "success": true, 
    "pdf_url": "https://supabase.../resumes/job123_custom.pdf" 
  }
  ```

---

## 3. Automation (Playwright Queues)

### `POST /applications/submit`
Enqueues a task for the Playwright worker to autonomously apply to a standard ATS.
- **Body:** `{ "job_id": "uuid", "user_id": "uuid" }`
- **Response:** 
  ```json
  { 
    "success": true, 
    "queue_id": "bullmq-12345",
    "status": "queued"
  }
  ```

### `GET /applications/status/:queueId`
Polls the status of an ongoing Playwright submission.
- **Response:** `{ "status": "processing | completed | failed", "logs": [...] }`
