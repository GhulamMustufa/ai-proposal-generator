# Global Agent Rules

These rules apply to any AI agent working within this workspace.

1. **Monorepo Awareness**: This project is migrating to an NPM Workspace Monorepo. Always check if you are editing code in `apps/web` (Next.js) or `apps/api` (Node.js).
2. **Read the Docs**: Before implementing new features, you must review the architectural guidelines in the `docs/` folder.
3. **No Synchronous Automation**: Any web scraping or Playwright automation MUST be placed in `apps/api` inside a BullMQ worker. Vercel serverless functions in `apps/web` cannot handle long-running tasks.
4. **Chrome Extension**: The code in `apps/extension` uses Manifest V3. Follow MV3 security policies (e.g., no inline scripts).
5. **Educational Comments**: The user is learning NestJS. You MUST heavily comment all NestJS-specific logic (Modules, Controllers, Services, Dependency Injection, BullMQ Decorators) and complex business logic. Explain *how* and *why* the code works so the user can learn from it.
