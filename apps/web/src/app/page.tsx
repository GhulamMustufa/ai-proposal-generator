import Link from "next/link";
import { SignUpButton } from "@clerk/nextjs";

// ─── Icons ────────────────────────────────────────────────────────────────────
function IconZap() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function IconTarget() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
    </svg>
  );
}
function IconMic() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  );
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconTrendUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function IconBriefcase() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  );
}
function IconSparkle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.88 5.47L19 10l-5.12 1.53L12 17l-1.88-5.47L5 10l5.12-1.53z" />
      <path d="M19 3l.94 2.73L22.5 7l-2.56.77L19 11l-.94-2.73L15.5 7l2.56-.77z" />
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const painPoints = [
  {
    emoji: "😩",
    title: "The ATS Black Hole",
    body: "You spend 40 minutes painstakingly re-typing your work history into Workday or Taleo, just to get an automated rejection email.",
  },
  {
    emoji: "📋",
    title: "Generic Resumes Fail",
    body: "You use the exact same PDF for 100 applications. Without tailoring keywords to the job description, recruiters never even see your name.",
  },
  {
    emoji: "📉",
    title: "The Numbers Game",
    body: "Finding the right remote engineering roles takes hours of scrolling through LinkedIn, YC, and Wellfound before you even start applying.",
  },
];

const features = [
  {
    icon: <IconZap />,
    title: "Background Bot Fleet",
    body: "Our scalable BullMQ worker architecture deploys Playwright bots to autonomously submit applications to Greenhouse, Lever, and Ashby while you sleep.",
    accent: "text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10",
  },
  {
    icon: <IconTarget />,
    title: "AI Matchmaking Engine",
    body: "Our NestJS backend continuously scrapes 11+ job boards and scores live roles against your skills, automatically queueing high-match jobs for submission.",
    accent: "text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/10",
  },
  {
    icon: <IconMic />,
    title: "Dynamic ATS Resumes",
    body: "We don't just autofill. The AI rewrites your bullet points to match the job's keywords and generates a fresh, ATS-friendly PDF dynamically.",
    accent: "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10",
  },
  {
    icon: <IconBriefcase />,
    title: "Enterprise Chrome Extension",
    body: "For complex portals like Workday that block bots, our Manifest V3 extension reads the DOM, queries the AI, and autofills the form instantly.",
    accent: "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10",
  },
  {
    icon: <IconTrendUp />,
    title: "Unified Application Tracker",
    body: "Whether submitted by a bot or via the extension, every application syncs to your central PostgreSQL database so you know exactly where you stand.",
    accent: "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/10",
  },
  {
    icon: <IconClock />,
    title: "Event-Driven Architecture",
    body: "Built on a robust Next.js and NestJS monorepo with Redis caching, guaranteeing zero dropped applications and lightning-fast UI.",
    accent: "text-cyan-600 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/10",
  },
];

const steps = [
  {
    title: "Set up your master profile",
    body: "Upload your baseline resume and answer a few questions. We store your experience securely to power the AI tailoring.",
  },
  {
    title: "The bots get to work",
    body: "Our background workers scrape YC, Wellfound, and Remotive, score jobs, and autonomously apply to Greenhouse/Lever portals 24/7.",
  },
  {
    title: "Crush enterprise portals manually",
    body: "When you encounter a Taleo or Workday application, hit our Chrome Extension. It generates a bespoke PDF and autofills the 10-page form in seconds.",
  },
];

const pricingFree = [
  "10 auto-applications per month",
  "Chrome Extension access",
  "Basic AI resume tailoring",
  "Centralized Kanban tracker",
];

const pricingPro = [
  "500 auto-applications per month",
  "24/7 Background Playwright Bots",
  "Unlimited Chrome Extension uses",
  "Advanced keyword matching AI",
  "Priority BullMQ queue processing",
];

const faqs = [
  {
    q: "How does the autonomous application work?",
    a: "We utilize headless Playwright browsers orchestrated by a Node.js worker pool. When an 'easy' ATS like Greenhouse is detected, the bot navigates the DOM, uploads a dynamically tailored PDF, and submits the form.",
  },
  {
    q: "What about Workday or complex portals?",
    a: "For portals requiring accounts (Workday, iCIMS), we use our 'Engine B' Chrome Extension. You navigate to the page, and the extension injects data directly into the DOM using AI-contextualized answers.",
  },
  {
    q: "Will my resume be ATS friendly?",
    a: "Yes. Every resume is generated dynamically as a clean PDF stored in Cloudflare R2. We don't use complex multi-column designs; we use standard formats that parse perfectly.",
  },
  {
    q: "What job boards do you monitor?",
    a: "Our ingest pipeline currently monitors Y Combinator, Wellfound, HackerNews, RemoteOK, Remotive, and more, indexing hundreds of new software engineering roles hourly.",
  },
];

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="space-y-20">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-8 py-16 text-white shadow-xl sm:px-14 sm:py-20 dark:border-slate-700/60">
        <div className="pointer-events-none absolute -left-16 -top-8 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 bottom-0 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/10 blur-3xl" />

        <span className="relative inline-flex items-center gap-1.5 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300">
          <IconSparkle /> High-performance event-driven architecture
        </span>
        <h1 className="relative mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl sm:leading-[1.08]">
          The AI platform that applies to jobs{" "}
          <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
            while you sleep.
          </span>
        </h1>
        <p className="relative mt-5 max-w-2xl text-base text-slate-300 sm:text-lg sm:leading-7">
          A hybrid automation engine. Playwright bots crush Greenhouse and Lever automatically in the background. Our Chrome Extension destroys Workday and Taleo forms in seconds.
        </p>

        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          <SignUpButton mode="modal">
            <button className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-95">
              Deploy your agent free →
            </button>
          </SignUpButton>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Open dashboard
          </Link>
        </div>

        <p className="relative mt-4 text-xs text-slate-400">No credit card required · Free tier includes 10 auto-applications/month</p>
      </section>

      {/* ── Pain ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">The old way</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Applying to jobs is fundamentally broken.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {painPoints.map((p) => (
            <article
              key={p.title}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
            >
              <span className="text-3xl">{p.emoji}</span>
              <h3 className="mt-3 text-base font-semibold text-slate-900 dark:text-slate-100">{p.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{p.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Before / After ─────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Real difference</p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
          Manual labor vs. High-scale automation.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Before */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">✗</span>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">The traditional grind</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-5 text-sm leading-6 text-slate-700 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-slate-300">
              <p>You find a promising Senior Frontend Engineer role on LinkedIn. You click apply. It redirects to Workday.</p>
              <p className="mt-3">You spend 3 minutes creating an account. 15 minutes manually splitting your resume into "Work History" inputs. 5 minutes answering diversity questions. You finally hit submit.</p>
            </div>
            <ul className="space-y-1.5 text-xs text-rose-600 dark:text-rose-400">
              {["Hours wasted on manual data entry", "Generic resume fails keyword screening", "Demoralizing process", "Max volume: 5 apps/day"].map((t) => (
                <li key={t} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">✗</span> {t}
                </li>
              ))}
            </ul>
          </div>

          {/* After */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400">✓</span>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">The Hybrid Automation Engine</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm leading-6 text-slate-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-slate-300">
              <p>While you were sleeping, our Node.js background workers matched your profile to 14 new YC jobs.</p>
              <p className="mt-3">The AI dynamically tailored a unique PDF resume for each one, and our headless Playwright cluster securely submitted all 14 applications via Ashby and Lever forms. You wake up to interview requests.</p>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              {["Zero human intervention required for Tier 1 platforms", "Perfectly tailored ATS keywords per job", "Scalable volume", "Max volume: 50+ apps/day"].map((t) => (
                <li key={t} className="flex items-start gap-1.5">
                  <span className="mt-0.5 shrink-0">✓</span> {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Architecture</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Enterprise-grade tooling for your career.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            A full-stack monorepo bridging Next.js 15, a heavy-duty NestJS backend, and distributed BullMQ queues.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <article
              key={f.title}
              className="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80"
            >
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${f.accent}`}>
                {f.icon}
              </span>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{f.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{f.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 sm:p-10">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Workflow</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              Set it up once. Let the agents run.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              The platform orchestrates the entire application lifecycle so you can focus on interview prep.
            </p>
            <div className="mt-6">
              <SignUpButton mode="modal">
                <button className="inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                  Deploy now
                </button>
              </SignUpButton>
            </div>
          </div>
          <div className="space-y-6">
            {steps.map((step, i) => (
              <div key={step.title} className="flex gap-5">
                <div className="flex flex-col items-center">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white dark:bg-indigo-500">
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="mt-2 flex-1 border-l-2 border-dashed border-slate-200 dark:border-slate-700" />
                  )}
                </div>
                <div className="pb-6">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">{step.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Early access callout ────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50 via-white to-white p-8 shadow-sm dark:border-indigo-900/50 dark:from-indigo-950/30 dark:via-slate-900 dark:to-slate-900 sm:p-10">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-lg">
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Platform Beta</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Join the automated job hunt.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Our matching engine is actively processing thousands of remote tech roles. Join the beta to get access to the Playwright submission bots before public launch.
            </p>
          </div>
          <SignUpButton mode="modal">
            <button className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95">
              Request Beta Access →
            </button>
          </SignUpButton>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section className="space-y-8" id="pricing">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Scale your applications.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Start automating manually with the extension, or deploy the full autonomous fleet.
          </p>
        </div>
        <div className="mx-auto grid max-w-3xl gap-4 md:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-slate-200/70 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">Free</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">$0</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">Forever. No card needed.</p>
            <ul className="mt-6 space-y-3">
              {pricingFree.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-emerald-500"><IconCheck /></span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <SignUpButton mode="modal">
                <button className="w-full block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700">
                  Get started
                </button>
              </SignUpButton>
            </div>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50 to-white p-8 shadow-lg dark:border-indigo-500 dark:from-indigo-950/40 dark:to-slate-900">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-0.5 text-xs font-semibold text-white">
              Full Autonomous
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Pro</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">$29</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">per month, cancel anytime.</p>
            <ul className="mt-6 space-y-3">
              {pricingPro.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-indigo-500"><IconCheck /></span>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <SignUpButton mode="modal">
                <button className="w-full block rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95">
                  Deploy Bots — $29/mo
                </button>
              </SignUpButton>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Platform Deep Dive</h2>
        </div>
        <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200/70 bg-white shadow-sm dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900/80">
          {faqs.map((faq) => (
            <div key={faq.q} className="px-6 py-5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{faq.q}</p>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-8 py-16 text-center text-white sm:px-14">
        <div className="pointer-events-none absolute -left-10 top-0 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
        <h2 className="relative text-3xl font-bold tracking-tight sm:text-5xl">
          Outsource your job hunt to {" "}
          <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
            the machines.
          </span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
          Stop treating job applications like a full-time job. Let our distributed architecture find, tailor, and submit the perfect applications for you.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <SignUpButton mode="modal">
            <button className="rounded-xl bg-white px-7 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 active:scale-95">
              Launch your bot fleet →
            </button>
          </SignUpButton>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Skip to dashboard
          </Link>
        </div>
        <p className="relative mt-4 text-xs text-slate-500">No credit card · Free tier available · Upgrade to scale</p>
      </section>

    </div>
  );
}
