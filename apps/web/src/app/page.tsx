import Link from "next/link";

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
    title: "You spend 30 minutes on a proposal.",
    body: "You research the client, craft a personalized pitch, re-read it five times — and still never hear back.",
  },
  {
    emoji: "📋",
    title: "You copy-paste your last proposal.",
    body: "Change the name, tweak a sentence, hit send. Clients can feel it. Generic proposals get archived, not answered.",
  },
  {
    emoji: "📉",
    title: "Better talkers are beating better doers.",
    body: "The freelancer who lands the contract isn't always the most skilled — they just wrote a sharper proposal.",
  },
];

const features = [
  {
    icon: <IconMic />,
    title: "Your voice, amplified",
    body: "Paste up to 3 of your past proposals as style references. The AI matches your tone, rhythm, and word choices — so the output sounds unmistakably like you.",
    accent: "text-indigo-600 bg-indigo-50 dark:text-indigo-300 dark:bg-indigo-500/10",
  },
  {
    icon: <IconTarget />,
    title: "Laser-targeted to each role",
    body: "The AI reads the job post, infers what the client actually cares about, and leads with that — not a generic skill dump. Every proposal is specific.",
    accent: "text-violet-600 bg-violet-50 dark:text-violet-300 dark:bg-violet-500/10",
  },
  {
    icon: <IconZap />,
    title: "Streaming generation",
    body: "Watch your proposal write itself in real time. No spinner. No waiting. Copy it the moment the last word lands.",
    accent: "text-amber-600 bg-amber-50 dark:text-amber-300 dark:bg-amber-500/10",
  },
  {
    icon: <IconBriefcase />,
    title: "Built-in application tracker",
    body: "Tag every proposal as Draft, Sent, Interview, Won, or Lost. Know exactly where your pipeline stands at a glance.",
    accent: "text-emerald-600 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-500/10",
  },
  {
    icon: <IconTrendUp />,
    title: "Profile-powered personalization",
    body: "Set your rate, skills, and background once. The AI weaves your experience into every proposal without you lifting a finger.",
    accent: "text-rose-600 bg-rose-50 dark:text-rose-300 dark:bg-rose-500/10",
  },
  {
    icon: <IconClock />,
    title: "Job feed, right in the dashboard",
    body: "Search live remote jobs by keyword without leaving the app. Spot a match, click Generate — done.",
    accent: "text-cyan-600 bg-cyan-50 dark:text-cyan-300 dark:bg-cyan-500/10",
  },
];

const steps = [
  {
    title: "Paste a job or search the feed",
    body: "Drop in a job description, a URL, or search thousands of live remote roles — all from your dashboard.",
  },
  {
    title: "Let Proposalio do the heavy lifting",
    body: "The AI reads the brief, pulls your profile data, matches your voice, and streams back a targeted proposal in seconds.",
  },
  {
    title: "Copy, send, track, repeat",
    body: "One click to copy the proposal. Mark it sent in your tracker. Build a clear picture of your pipeline week over week.",
  },
];

const pricingFree = [
  "30 proposals per day",
  "300 proposals per month",
  "Voice sample matching",
  "Job feed access",
  "Proposal history",
  "Application tracker",
];

const pricingPro = [
  "500 proposals per day",
  "5,000 proposals per month",
  "Everything in Free",
  "Two-variation A/B mode",
  "Priority AI generation",
  "Profile-powered personalization",
];

const faqs = [
  {
    q: "Does it really sound like me?",
    a: "Yes — paste up to 3 of your past proposals as writing samples. Proposalio analyzes your tone, sentence length, and phrasing patterns. The output is shaped around your style, not a generic template.",
  },
  {
    q: "Will clients know I used AI?",
    a: "The voice-matching and profile-injection features make output feel personal and specific to each job. You should still read it and tweak anything that feels off — it's a starting point, not a final draft.",
  },
  {
    q: "What job boards does the feed pull from?",
    a: "Currently we surface remote roles from Remotive, a curated board for remote-first positions. More sources are on the roadmap.",
  },
  {
    q: "Can I edit the proposal before sending?",
    a: "Absolutely. The output is plain text — copy it, paste it wherever you apply, and tweak whatever you like. You're always in control of the final version.",
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
          <IconSparkle /> Early access — free to start
        </span>
        <h1 className="relative mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl sm:leading-[1.08]">
          Stop losing jobs to worse freelancers with{" "}
          <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
            better proposals.
          </span>
        </h1>
        <p className="relative mt-5 max-w-2xl text-base text-slate-300 sm:text-lg sm:leading-7">
          Proposalio uses AI to generate personalized, role-specific proposals in your own voice — in under 90 seconds.
          Set your profile once. Stop starting from a blank page.
        </p>

        <div className="relative mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 active:scale-95"
          >
            Get started free →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Open dashboard
          </Link>
        </div>

        <p className="relative mt-4 text-xs text-slate-400">No credit card required · Free plan includes 300 proposals/month</p>
      </section>

      {/* ── Pain ───────────────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">The old way</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Sound familiar?
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
          The proposal that gets read vs. the one that gets archived.
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {/* Before */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-xs font-bold text-rose-600 dark:bg-rose-900/40 dark:text-rose-400">✗</span>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Typical proposal</p>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-5 text-sm leading-6 text-slate-700 dark:border-rose-900/30 dark:bg-rose-900/10 dark:text-slate-300">
              <p>Hello, I am a highly skilled developer with 5+ years of experience. I am very passionate about delivering high-quality code. I am a perfect fit for your project because I have worked on similar projects before and I am a fast learner.</p>
              <p className="mt-3">I am excited about this opportunity and would love to discuss further. Please feel free to reach out at any time. Looking forward to hearing from you!</p>
            </div>
            <ul className="space-y-1.5 text-xs text-rose-600 dark:text-rose-400">
              {["Generic opener the client has seen 50 times", "No mention of the actual job requirements", "No concrete outcomes or proof", "Clearly copy-pasted"].map((t) => (
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
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Proposalio output</p>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-5 text-sm leading-6 text-slate-700 dark:border-emerald-900/30 dark:bg-emerald-900/10 dark:text-slate-300">
              <p>Your checkout flow bottleneck is real — a 2s load delta at the payment step typically costs 8–12% of conversions. I rebuilt a similar flow for a D2C brand recently: moved to edge rendering, lazy-loaded the payment SDK, and cut their LCP from 3.4s to 1.1s. Revenue per session jumped noticeably in the first month.</p>
              <p className="mt-3">Happy to audit your current waterfall and share a quick breakdown of the 3 highest-leverage fixes. Worth a look before your launch?</p>
            </div>
            <ul className="space-y-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              {["Opens by naming the client's exact problem", "Relevant past experience, not a skills list", "Concrete outcome that builds credibility", "Low-friction, specific call to action"].map((t) => (
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
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Everything a serious freelancer needs.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Built specifically for freelancers and agencies who send proposals every week and need results — not just output.
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
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">How it works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl">
              From job post to sent proposal in three steps.
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
              No prompting skills needed. No templates to fill. Just paste, generate, and send.
            </p>
            <Link
              href="/signup"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Try it free
            </Link>
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
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Early access</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Be one of the first to use it.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
              Proposalio is new and actively being built. Early users get the full product for free while we grow,
              and direct input on what gets built next. No waitlist — sign up and start generating right now.
            </p>
          </div>
          <Link
            href="/signup"
            className="shrink-0 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            Join early access →
          </Link>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section className="space-y-8" id="pricing">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500">Pricing</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-4xl">
            Simple, honest pricing.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
            Start free. Upgrade when you need more volume. No annual lock-in.
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
            <Link
              href="/signup"
              className="mt-8 block rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Get started
            </Link>
          </div>

          {/* Pro */}
          <div className="relative rounded-2xl border-2 border-indigo-500 bg-gradient-to-b from-indigo-50 to-white p-8 shadow-lg dark:border-indigo-500 dark:from-indigo-950/40 dark:to-slate-900">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-500 px-3 py-0.5 text-xs font-semibold text-white">
              Most popular
            </span>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">Pro</p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-100">$19</p>
            <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">per month, cancel anytime.</p>
            <ul className="mt-6 space-y-3">
              {pricingPro.map((item) => (
                <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                  <span className="text-indigo-500"><IconCheck /></span>
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/signup"
              className="mt-8 block rounded-xl bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
            >
              Start Pro — $19/mo
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="mx-auto w-full max-w-2xl space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Common questions</h2>
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
          Your next winning proposal is{" "}
          <span className="bg-gradient-to-r from-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">
            90 seconds away.
          </span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-sm leading-6 text-slate-300 sm:text-base">
          Stop starting from scratch. Stop sending generic pitches. Start writing proposals that prove you actually read the job post.
        </p>
        <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="rounded-xl bg-white px-7 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100 active:scale-95"
          >
            Create your free account →
          </Link>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/20 bg-white/10 px-7 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Skip to dashboard
          </Link>
        </div>
        <p className="relative mt-4 text-xs text-slate-500">No credit card · Free plan · Upgrade when you&apos;re ready</p>
      </section>

    </div>
  );
}
