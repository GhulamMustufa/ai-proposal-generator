import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProposalGenerator } from "@/components/dashboard/proposal-generator";
import { JobFeed } from "@/components/dashboard/job-feed";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/dashboard");
  }

  const [{ count: totalProposals }, { data: recentProposals }, { data: preferences }] = await Promise.all([
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
    supabase
      .from("proposals")
      .select("id, job_description, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("user_preferences")
      .select("default_keywords")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);
  const lastCreatedAt = recentProposals?.[0]?.created_at;
  const defaultKeywords = preferences?.default_keywords ?? "";

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-8 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-2xl" />
        <div className="absolute -bottom-16 left-1/3 h-40 w-40 rounded-full bg-cyan-400/10 blur-2xl" />
        <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-indigo-200">
          Premium Proposal Studio
        </p>
        <h1 className="relative mt-3 max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">
          Convert job posts into high-converting proposals in minutes.
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm text-slate-200">
          Built for consultants and agencies who want polished positioning, stronger response rates, and less
          repetitive writing.
        </p>
        <div className="relative mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-200">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Voice-aligned writing</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Personalized hooks</span>
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Client-ready output</span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Total Proposals</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{totalProposals ?? 0}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Generated across your workspace.</p>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Last Activity</p>
          <p className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">
            {lastCreatedAt ? new Date(lastCreatedAt).toLocaleString() : "No activity yet"}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Most recent proposal generation time.</p>
        </article>

        <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Account</p>
          <p className="mt-3 truncate text-lg font-semibold text-slate-900 dark:text-slate-100">{user.email}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Signed in and ready to generate.</p>
        </article>
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Recent Proposals</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Last 5 generated proposals</h2>
          </div>
          <Link
            href="/history"
            className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
          >
            View full history
          </Link>
        </div>

        {recentProposals && recentProposals.length > 0 ? (
          <ul className="mt-4 space-y-2">
            {recentProposals.map((proposal) => (
              <li key={proposal.id}>
                <Link
                  href={`/proposals/${proposal.id}`}
                  className="block rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                >
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {proposal.job_description.length > 140
                      ? `${proposal.job_description.slice(0, 140)}...`
                      : proposal.job_description}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{new Date(proposal.created_at).toLocaleString()}</p>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">No proposals yet. Generate your first one below.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/90 p-8 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Job Feed</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Find jobs and generate proposals</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Search remote jobs and generate a tailored proposal for any listing in one click.
          </p>
        </div>
        <JobFeed defaultKeywords={defaultKeywords} />
      </section>

      <section className="rounded-2xl border border-slate-200/70 bg-white/70 p-1 dark:border-slate-700 dark:bg-slate-900/70">
        <div className="rounded-2xl bg-slate-50/70 p-5 dark:bg-slate-900/60">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Generator</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Create a market-winning proposal</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Paste the job details, optionally include voice samples, and generate polished proposals instantly.
          </p>
        </div>
      </section>

      <section>
        <ProposalGenerator />
      </section>
    </div>
  );
}
