import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/history/status-badge";

function EmptyState() {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <svg width="64" height="64" viewBox="0 0 64 64" fill="none" className="text-slate-300 dark:text-slate-600">
        <rect x="10" y="8" width="36" height="46" rx="4" stroke="currentColor" strokeWidth="2.5" />
        <rect x="18" y="20" width="20" height="2.5" rx="1.25" fill="currentColor" />
        <rect x="18" y="27" width="20" height="2.5" rx="1.25" fill="currentColor" />
        <rect x="18" y="34" width="13" height="2.5" rx="1.25" fill="currentColor" />
        <circle cx="46" cy="46" r="12" fill="currentColor" className="text-slate-100 dark:text-slate-800" />
        <circle cx="46" cy="46" r="12" stroke="currentColor" strokeWidth="2.5" className="text-slate-300 dark:text-slate-600" />
        <path d="M41 46h10M46 41v10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-slate-400 dark:text-slate-500" />
      </svg>
      <p className="mt-4 text-base font-medium text-slate-700 dark:text-slate-200">No proposals yet</p>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Head to the dashboard to generate your first one.</p>
      <Link
        href="/dashboard"
        className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/history");
  }

  const { data: proposals, error } = await supabase
    .from("proposals")
    .select("id, job_title, job_link, job_description, created_at, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return (
      <section className="rounded-xl border border-slate-200 bg-white p-10 dark:border-slate-700 dark:bg-slate-900/80">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">History</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Previous proposals</h1>
        <p className="mt-3 text-sm text-rose-700">Failed to load history: {error.message}</p>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-10 dark:border-slate-700 dark:bg-slate-900/80">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">History</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Previous proposals</h1>

      {proposals.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="mt-6 space-y-3">
          {proposals.map((proposal) => {
            const title = proposal.job_title ?? null;
            const snippet = proposal.job_description.length > 160
              ? `${proposal.job_description.slice(0, 160)}...`
              : proposal.job_description;
            const status = (proposal.status ?? "draft") as "draft" | "sent" | "interview" | "won" | "lost";

            return (
              <li
                key={proposal.id}
                className="rounded-xl border border-slate-200 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:hover:border-slate-600 dark:hover:bg-slate-800"
              >
                <div className="flex items-start gap-4 px-5 py-4">
                  <Link href={`/proposals/${proposal.id}`} className="min-w-0 flex-1">
                    {title ? (
                      <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                    ) : null}
                    <p className={`text-sm text-slate-600 dark:text-slate-300 ${title ? "mt-0.5" : ""}`}>{snippet}</p>
                    <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
                      {new Date(proposal.created_at).toLocaleString()}
                    </p>
                  </Link>
                  <div className="flex shrink-0 items-center gap-2 pt-0.5">
                    <StatusBadge proposalId={proposal.id} initialStatus={status} />
                    {proposal.job_link ? (
                      <a
                        href={proposal.job_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                      >
                        View Job ↗
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
