import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ProposalGenerator } from "@/components/dashboard/proposal-generator";

export default async function ProposalGeneratorPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-200">
      {/* Premium Header */}
      <header className="relative overflow-hidden border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0A0A0B]/80 px-6 py-12 backdrop-blur-xl">
        <div className="absolute -top-40 right-20 h-96 w-96 rounded-full bg-purple-500/10 blur-[100px]" />
        <div className="absolute left-20 top-0 h-64 w-64 rounded-full bg-indigo-500/10 blur-[80px]" />
        
        <div className="relative mx-auto max-w-5xl">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Dashboard
          </Link>
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400">
            AI Proposal Crafter
          </p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Custom Proposal Engine
            </h1>
          </div>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            Found a job off-platform? Paste the description below, select a Persona, and add optional voice samples to generate a hyper-personalized cover letter or cold email.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        <ProposalGenerator />
      </main>
    </div>
  );
}
