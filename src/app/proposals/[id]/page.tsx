import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatusBadge } from "@/components/history/status-badge";

type ProposalPageProps = {
  params: { id: string };
};

export default async function ProposalPage({ params }: ProposalPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=/proposals/${params.id}`);
  }

  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("id, job_title, job_link, job_description, generated_proposal, created_at, status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (error || !proposal) {
    notFound();
  }

  const status = (proposal.status ?? "draft") as "draft" | "sent" | "interview" | "won" | "lost";

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900/80">
        <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Proposal</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              {proposal.job_title ?? "Proposal details"}
            </h1>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {new Date(proposal.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <StatusBadge proposalId={proposal.id} initialStatus={status} />
            {proposal.job_link ? (
              <a
                href={proposal.job_link}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                View Job ↗
              </a>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Job description</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{proposal.job_description}</p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900/80">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Generated proposal</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-800 dark:text-slate-200">
          {proposal.generated_proposal}
        </p>
      </section>
    </div>
  );
}
