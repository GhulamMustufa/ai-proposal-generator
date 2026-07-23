# Global Agent Rules

These rules apply to any AI agent working within this workspace.

1. **Read the Docs**: Before implementing new features or debugging complex issues, you MUST review the architectural guidelines and project structure located in the `docs/` folder of this project.
2. **Monorepo Awareness**: This project is an NPM Workspace Monorepo. Always double-check whether you should be editing code in `apps/web` (Next.js App Router) or `apps/api` (NestJS).
3. **No Synchronous Automation**: Any web scraping, heavy AI generation, or long-running tasks MUST be placed in `apps/api` inside a BullMQ worker. Vercel serverless functions in `apps/web` cannot handle long-running tasks and will timeout. Use Server-Sent Events (SSE) to stream completion status to the frontend.
4. **Educational Comments**: The user is learning these frameworks. You MUST heavily comment all NestJS-specific logic (Modules, Controllers, Services, Dependency Injection, BullMQ Decorators) and complex business logic. Explain *how* and *why* the code works so the user can learn from it.
5. **Modern Frontend Aesthetics**: When modifying or creating UI components in `apps/web`, prioritize a premium, dynamic feel. Use Glassmorphism, tailored Tailwind colors (not default primary colors), dark mode optimizations, and subtle micro-animations for hover states.
6. **Error Handling**: Do not swallow errors. Ensure both backend and frontend degrade gracefully and provide clear toast notifications to the user (e.g., handling HTTP 429 Too Many Requests or 403 Paywall limits explicitly).
