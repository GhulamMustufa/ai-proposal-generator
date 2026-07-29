# Frontend Documentation

The frontend (`apps/web`) is built with **Next.js (App Router)** and prioritizes a highly aesthetic, premium, and responsive user experience.

## Design Philosophy & Aesthetics
As an AI SaaS targeting professionals, the UI must feel "expensive" and dynamic.
- **Glassmorphism**: Use translucent backgrounds (`bg-black/40`), heavy blurring (`backdrop-blur-md`), and subtle inner borders (`border-white/10`).
- **Animations**: Implement micro-interactions on hover (scale, glow effects, opacity shifts). Loading states should use pulsing gradients or skeleton loaders.
- **Colors**: Avoid plain HTML colors. Use highly curated palettes (e.g., Indigo, Emerald, Slate). Rely heavily on dark mode defaults for a modern "hacker/developer" vibe.
- **Icons**: Use crisp, modern icons (e.g., Lucide React).

## Key Components

### `JobCard` (`src/components/dashboard/job-card.tsx`)
- Renders an individual scraped job.
- **Core Logic**: Manages local state for generating a proposal vs. a cold email. Uses the `EventSource` API to listen to the NestJS backend for real-time completion (Server-Sent Events).
- **Error Handling**: Gracefully handles `429 Too Many Requests` (Rate Limiting) and `403 Forbidden` (Paywall) with `react-hot-toast` notifications.

### `ManualJobEntry` (`src/components/dashboard/manual-job-entry.tsx`)
- Allows users to paste a job description from anywhere on the internet.
- **Core Logic**: Generates a local `clientReferenceId` via `crypto.randomUUID()` before calling the backend. It uses this UUID to filter the incoming SSE stream, ensuring the generated text is injected into the correct component instance.

## State Management

> [!WARNING]
> **Technical Debt**: Currently, the frontend manages API data fetching using custom React Hooks (e.g., `use-personas.ts`, `use-user-plan.ts`) built around raw `useEffect` and `fetch`. To prevent N+1 API calls, developers have implemented rudimentary module-level variable caches (`let cachedPersonas = null`). This approach lacks stale-while-revalidate logic, automatic retries, and optimistic UI updates. Transitioning this layer to **React Query (TanStack Query)** should be a high priority for better UX and maintainability.

- Prefer localized React state (`useState`, `useReducer`) over global state managers (like Redux) where possible.
- Use Next.js Server Components for initial data fetching to reduce client bundle size, passing the data as props to Client Components (`"use client"`) that handle the interactivity.

## Authentication
- Clerk handles all authentication via `<ClerkProvider>` in `layout.tsx`.
- The Next.js `middleware.ts` automatically protects `/dashboard` and redirects unauthenticated users to the sign-in page.
- Client components use `useAuth()` to retrieve the `getToken()` function, which is then passed as a Bearer token to the NestJS backend.
