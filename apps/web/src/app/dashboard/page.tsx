import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { JobCard } from "@/components/dashboard/job-card";
import { SyncButton } from "@/components/dashboard/sync-button";
import { PersonaFilter } from "@/components/dashboard/persona-filter";


// Optional: Fallback data for preview/development if backend is offline
const MOCK_JOBS = [
  {
    id: "1",
    title: "Senior Full-Stack Engineer",
    company: "Stripe",
    url: "https://stripe.com/jobs",
    platform: "greenhouse",
    matchScore: 98,
    matchReasoning: "Exceptional alignment. Your experience with Node.js and FinTech completely satisfies their requirements, and the $320k salary floor is well within their listed range.",
    scrapedAt: new Date().toISOString(),
  },
  {
    id: "2",
    title: "Lead Backend Developer",
    company: "Netflix",
    url: "https://netflix.com/jobs",
    platform: "lever",
    matchScore: 92,
    matchReasoning: "Strong match for your advanced PostgreSQL skills. They require high-scale architecture experience which you possess. Passes all remote and region constraints.",
    scrapedAt: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    title: "Blockchain Protocol Engineer",
    company: "Phantom",
    url: "https://phantom.app",
    platform: "web3",
    matchScore: 85,
    matchReasoning: "Meets the Web3 niche constraint. Requires some Rust which you are learning, but your core TypeScript skills cover 80% of the daily responsibilities.",
    scrapedAt: new Date(Date.now() - 7200000).toISOString(),
  },
  {
    id: "4",
    title: "React Native Developer",
    company: "Discord",
    url: "https://discord.com",
    platform: "greenhouse",
    matchScore: 72,
    matchReasoning: "Technically a match for your frontend skills, but the compensation is slightly ambiguous. Meets the 70% skill threshold.",
    scrapedAt: new Date(Date.now() - 86400000).toISOString(),
  }
];

export default async function DashboardPage(props: {
  searchParams: Promise<{ personaId?: string }>;
}) {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const searchParams = await props.searchParams;
  const token = await getToken();
  let matchedJobs: any[] = [];
  let apiError = false;

  const personaId = searchParams?.personaId;

  try {
    // Attempt to fetch from NestJS Backend (Assuming it's running on port 3001)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    
    let url = `${apiUrl}/api/jobs`;
    if (personaId) {
      url += `?personaId=${personaId}`;
    }

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Cache settings for dynamic data
      cache: "no-store",
    });

    if (res.ok) {
      matchedJobs = await res.json();
    } else {
      console.warn("NestJS API returned an error, falling back to mock data.");
      apiError = true;
      matchedJobs = MOCK_JOBS;
    }
  } catch (error) {
    console.error("Failed to connect to NestJS API. Is it running? Falling back to mock data.");
    apiError = true;
    matchedJobs = MOCK_JOBS; // Use mock data if API is down for demo purposes
  }

  // Filter to show only jobs > 70 score (just in case)
  // Filter to show only jobs > 70 score
  const displayJobs = matchedJobs.filter((job) => job.matchScore >= 70);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-200">
      {/* Premium Header */}
      <header className="relative overflow-hidden border-b border-slate-200 dark:border-white/5 bg-white/80 dark:bg-[#0A0A0B]/80 px-6 py-12 backdrop-blur-xl">
        <div className="absolute -top-40 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute left-20 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
        
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600 dark:text-emerald-400">
            ATS Sourcing Engine Active
          </p>
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              Your Match Dashboard
            </h1>
            <SyncButton />
          </div>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            We have scanned thousands of jobs across 14+ platforms. These roles have successfully bypassed your strict AI pre-filters. Review your highest probability matches below.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {apiError && (
          <div className="mb-8 rounded-xl border border-rose-500/20 bg-rose-50 dark:bg-rose-500/10 p-4 text-sm text-rose-600 dark:text-rose-300">
            <strong>API Connection Warning:</strong> Could not reach the NestJS backend on port 3001. Displaying mock data for UI preview.
          </div>
        )}

        <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Want to apply for a custom job?</h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xl">
                Found a job off-platform? Use our dedicated AI Proposal Crafter. Paste the job description, select your Persona, run the Keyword Analyzer, and provide voice samples for a perfectly tailored response.
              </p>
            </div>
            <Link 
              href="/proposal-generator" 
              className="whitespace-nowrap inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 shrink-0"
            >
              Open Proposal Crafter ✨
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-slate-900 dark:text-white">Highly Qualified Leads</h2>
            <span className="rounded-full bg-slate-200 dark:bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-white/10">
              {displayJobs.length} Matches Found
            </span>
          </div>
          <PersonaFilter />
        </div>

        <div className="grid gap-6">
          {!personaId && !apiError ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
              <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Create a Persona First</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                You need to create at least one Persona before the AI can automatically match you with jobs.
              </p>
              <Link href="/personas" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition">
                Create Persona
              </Link>
            </div>
          ) : (
            displayJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))
          )}

          {displayJobs.length === 0 && personaId && !apiError && (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
              <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No matches found yet</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">No matching jobs found at the moment. Check back soon for roles that meet your &gt;70% criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
