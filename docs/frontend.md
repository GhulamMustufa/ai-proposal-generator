# Frontend Development Guide (`apps/web`)

## 1. Tech Stack
- Next.js 15 (App Router)
- React 18+ (Server Components by default)
- Tailwind CSS v3+
- `shadcn/ui` (Radix UI primitives)
- Lucide React (Icons)

## 2. Directory Structure
```text
apps/web/
  src/
    app/              # Next.js App Router (pages, layouts, API proxies)
    components/
      ui/             # shadcn reusable primitives (buttons, inputs)
      layout/         # Navbar, Sidebar, Footers
      features/       # Complex components mapped to business logic
    hooks/            # Custom React hooks (e.g., useUser, useJobs)
    lib/              # Utility functions (cn, formatters)
    types/            # Frontend-specific types (or imported from packages/shared)
```

## 3. Data Fetching
- **Server Components:** Prefer fetching data directly in Server Components using native `fetch` (with appropriate Next.js caching/revalidation strategies) or Supabase server-side clients.
- **Client Components:** For highly interactive data (like polling a queue status), use React Query (`@tanstack/react-query`) or SWR.

## 4. Styling Conventions
- Utility-first CSS using Tailwind.
- Avoid writing custom CSS in `.css` files unless absolutely necessary (e.g., specific animations).
- Use the `cn()` utility (clsx + tailwind-merge) for dynamic class names:
  ```tsx
  <div className={cn("base-classes", isTrue && "conditional-classes")} />
  ```

## 5. Security & Env Variables
- Never expose API keys prefixed with `NEXT_PUBLIC_` unless they are explicitly meant for the browser (e.g., Supabase Anon Key).
- All requests to `apps/api` should securely pass the user's Supabase session token in the Authorization header.
