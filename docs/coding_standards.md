# Coding Standards & Code Optimization Rules (MVP)

This document defines practical coding and performance rules for the AI Job Application Platform MVP built with:
- Next.js 15 (App Router)
- React
- TypeScript
- NestJS backend (Node.js)

**Goal:** Keep code clean, fast, readable, and maintainable — not over-engineered.

---

# 1. Function Design

## 1.1 Keep functions small
- A function should do ONE thing only.
- If a function is longer than ~50 lines → split it.

## 1.2 Break large logic
Split complex logic into:
- `utils/`
- `services/`
- `hooks/`
- `helpers/`

**Example:**
❌ Bad: 200-line controller with business logic
✅ Good: Controller → calls Service → Service uses Repository

---

# 2. React / Next.js 15 Optimization Rules

## 2.1 Server Components First (Next.js 15 best practice)
- Use Server Components by default.
- Use Client Components (`"use client"`) only when needed for:
  - `useState`
  - `useEffect`
  - Event handlers (e.g., `onClick`)

## 2.2 Avoid unnecessary re-renders
- Do NOT wrap everything in `useState`.
- Do NOT overuse `useEffect`.
- Keep state as local as possible.

## 2.3 Component splitting
Break UI into logical pieces:
- Page components
- Layout components
- Reusable UI components (`components/ui/`)
- Feature components (`features/jobs/`, `features/applications/`)

## 2.4 Hooks separation
Custom hooks must be used for:
- API calls
- Reusable logic
- Complex state logic

**Examples:**
- `useJobs()`
- `useAuth()`
- `useSubmissionQueue()`
*(Do NOT put heavy API logic directly inside UI components).*

## 2.5 Avoid prop drilling
If props go deeper than 2–3 levels:
- Use React Context OR
- Move state to a feature-level hook.

---

# 3. TypeScript Rules

## 3.1 Separate types
Always keep types separate and organized:
```text
types/
  job.types.ts
  user.types.ts
  application.types.ts
```
Do NOT inline massive types inside component files.

## 3.2 Avoid `any`
- Never use `any`.
- Use `unknown` if the type is truly dynamic and needs narrowing later.

## 3.3 Shared types between frontend and backend
Since this is a monorepo, reuse API response types and keep consistent DTOs (Data Transfer Objects) between `apps/web` and `apps/api`.

---

# 4. Backend (NestJS) Rules

## 4.1 Modular Architecture
Always follow the NestJS Dependency Injection flow:
**Module → Controller → Service → Repository**
- **Module** = Encapsulates domain logic (e.g., `JobsModule`).
- **Controller** = HTTP request handling & DTO validation (using `@Body()` and ValidationPipes).
- **Service** = Core business logic (e.g., matching a job, queuing a submission).
- **Repository** = Database queries (Drizzle ORM injected as a provider).

## 4.2 No business logic in controllers
Controllers should only:
- Receive the request.
- Call the injected service.
- Return the response.

## 4.3 Keep APIs simple
- One endpoint = one purpose.
- Avoid massive multi-purpose endpoints.
- Rely on NestJS Exception Filters for error handling, avoiding massive try/catch blocks in controllers.

---

# 5. Database Optimization Rules (PostgreSQL)

## 5.1 Avoid heavy joins
- Keep queries simple for the MVP.
- Denormalize only when strictly needed for performance.

## 5.2 Use indexes properly
Index heavily queried columns:
- `user_id` on applications and profiles
- `created_at` on jobs
- `status` on applications (for queue processing)

## 5.3 Avoid N+1 queries
- Batch fetch where possible.
- Use joins carefully to retrieve related data in a single round-trip.

---

# 6. State Management Rules (Frontend)

## 6.1 Keep state minimal
- Prefer local state (`useState`).
- Avoid global state unless absolutely needed.

## 6.2 No unnecessary global stores
Do NOT add Redux or Zustand unless the complexity genuinely requires it. React Context is usually enough for an MVP.

---

# 7. API Optimization Rules

## 7.1 Pagination is mandatory
All list APIs (like fetching jobs or history) must support:
- `limit`
- `offset` or cursor-based pagination.

## 7.2 Avoid overfetching
Return only required fields for the specific view:
❌ Bad: Returning the full base resume text, contact details, and application logs in a simple dashboard list view.
✅ Good: Returning minimal fields (Title, Company, Match Score) for the list view.

---

# 8. Performance Rules (Next.js 15)

## 8.1 Use Server Actions / Server Components
- Reduces client-side JS bundle size.
- Improves initial load time significantly.

## 8.2 Avoid unnecessary client hydration
- Only hydrate highly interactive parts of the UI.
- Keep dashboards and static job listings server-rendered.

## 8.3 Optimize images
- Use Next.js `<Image />` component for optimization.
- Lazy load images by default.

---

# 9. File Structure Rules

Keep structure feature-based where possible:
```text
features/
  jobs/
  applications/
  auth/
  matcher/
```
Each feature folder should self-contain its:
- `components/`
- `hooks/`
- `services/`
- `types/`

---

# 10. Code Quality Rules

- Keep code **readable over clever**.
- Avoid deep nesting (max 3 levels of indentation).
- Use early returns (guard clauses) to prevent nested `if/else` hell.
- Avoid duplicate logic; extract reusable utilities.

---

# 11. What NOT to optimize in MVP

Do **NOT** do these during the MVP sprint:
- `useMemo` everywhere.
- `useCallback` everywhere.
- Premature caching layers (Redis is strictly for BullMQ queues, not caching API responses yet).
- Microservices (Keep the Node.js backend as a monolith for now).
- Complex global state management.
- GraphQL.

---

# 12. Golden Rule

**If optimization makes code harder to read → do NOT do it.**

MVP Priorities:
✔ Correctness  
✔ Simplicity  
✔ Maintainability  
✔ Speed of development  

---

# 13. Code Comments Rules (IMPORTANT)

## 13.1 When to add comments
Add comments when:
- **Educational Context (NestJS):** Because NestJS is new to the team, heavily comment NestJS decorators (`@Injectable`, `@Controller`, `@Process`) and architectural flow to explain *what* the framework is doing.
- The logic is not immediately obvious (e.g., regex, complex math).
- There is a strict business rule (e.g., "We wait 5 seconds here to bypass Lever's anti-bot check").
- There is a workaround or hack.
- There is complex SQL/Drizzle query logic.
- There is a security-related decision.

## 13.2 What to comment
Focus on **WHY**, not WHAT.

❌ Bad:
```ts
// increment counter
count++;
```

✅ Good:
```ts
// Retry counter incremented to ensure we don't spam the API during a rate limit
count++;
```

---

# 14. Error Handling & Edge Cases

## 14.1 Backend (NestJS)
- Never throw generic `Error` objects directly to the client unless caught and mapped.
- Always log errors using the `Logger` service before throwing them.
- Use NestJS built-in exceptions (`HttpException`, `UnauthorizedException`) for correct status codes.

## 14.2 Frontend (Next.js)
- Wrap API calls in `try/catch` blocks.
- Display user-friendly error messages using `react-hot-toast`.
- Handle potential `null` or `undefined` values safely using optional chaining (`?.`) and nullish coalescing (`??`).

---

# 15. Asynchronous Programming & SSE

- For long-running tasks (like Web Scraping or interacting with OpenAI), **never** process them synchronously during an HTTP request.
- Always use **BullMQ** to send the task to a background worker.
- Return a `202 Accepted` immediately, and use **Server-Sent Events (SSE)** via NestJS `@Sse()` to stream status updates to the Next.js client.

---

# 16. Senior Engineering Best Practices

## 16.1 Next.js 15 (App Router)
- **Suspense & Streaming:** Wrap slow asynchronous Server Components in `<Suspense>` boundaries. This ensures the rest of the page loads instantly while the heavy data (like fetching matches) streams in.
- **Server Actions vs APIs:** Use Next.js Server Actions (`"use server"`) for simple client-to-server mutations (like form submissions). Use NestJS REST APIs for heavy business logic, cross-platform access, and webhooks.
- **Tailwind Class Merging:** When passing dynamic Tailwind classes as props to UI components, always use a utility like `clsx` combined with `tailwind-merge` (commonly aliased as `cn()`) to prevent cascading CSS conflicts.
- **Environment Safety:** Never expose secrets. Only prefix variables with `NEXT_PUBLIC_` if they absolutely must be read by the browser (e.g., Clerk Publishable Key).

## 16.2 NestJS Backend
- **Strict Payload Validation:** Configure the global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true`. This automatically strips malicious or unexpected properties from incoming JSON payloads before they reach your controllers.
- **Boot-Time Env Validation:** Validate your environment variables (using Zod or Joi) during the NestJS `ConfigModule` initialization. If `OPENAI_API_KEY` is missing, the server should crash *immediately on boot*, not hours later when a user clicks generate.
- **Database Transactions:** When performing multi-step database writes (e.g., inserting a user AND creating their default persona), wrap them in a Drizzle ORM transaction (`db.transaction()`). If one step fails, the entire operation rolls back, preventing orphaned data.
- **Stateless Services:** NestJS services are singletons by default. **Never** store request-specific data (like a `userId`) in a class-level variable, as it will leak across different users' concurrent requests.
