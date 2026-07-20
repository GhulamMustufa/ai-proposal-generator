# Product Requirements Document (PRD)

## 1. Product Vision
Applying to jobs is fundamentally broken. It requires hours of manually tailoring resumes and fighting with application portals, leading to engineer burnout. Our platform solves this by providing an AI agent that finds high-match jobs daily, generates a perfectly formatted custom PDF resume, and autonomously submits the application (or assists via a Chrome Extension).

## 2. Target Audience
- Mid-level to Senior Software Engineers.
- Primarily focused on remote roles or major tech hubs.

## 3. User Stories & Core Flows

### 3.1 Onboarding & Profiling
- **As a user**, I want to upload my base resume PDF so the system can parse my skills, experience, and contact details automatically.
- **As a user**, I want to review and edit my parsed JSON profile to ensure accuracy before the AI uses it.

### 3.2 The Daily Digest
- **As a user**, I want to receive an email every morning with the top 5 jobs that match my profile >85%.
- **As a user**, I want to log into my dashboard and view a Kanban board of my matches (New, Approved, Applied, Rejected).

### 3.3 The One-Click Apply (Tier 1 ATS)
- **As a user**, when I see a great match on Greenhouse or Lever, I want to click "Approve & Submit".
- **As the system**, upon click, I will generate a tailored PDF resume and spin up a headless browser to submit the application entirely in the background.

### 3.4 The Manual Assist (Tier 3 ATS)
- **As a user**, when I browse LinkedIn or Workday manually, I want to click a Chrome Extension button to instantly generate a tailored cover letter and auto-fill the form fields.

## 4. MVP Scope Boundaries

### INCLUDED (6-8 Week Sprint):
- Ingestion Scrapers for 11 platforms (YC, Wellfound, Remotive, etc.).
- Playwright Bots for 10 platforms (Greenhouse, Lever, Ashby, etc.).
- Complex PDF rendering (`@react-pdf/renderer`).
- Upgraded Manifest V3 Chrome Extension.

### EXCLUDED (Phase 2 Roadmap):
- Analytics and A/B Testing of resume performance.
- Interview Prep Module (Mock interviews).
- Cold Outreach Generator (finding recruiters on LinkedIn).
- Proxy Networks for evading captchas (we rely on the Chrome Extension fallback instead).
