import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { JobCard } from "@/components/dashboard/job-card";

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

export default async function DashboardPage() {
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const token = await getToken();
  let matchedJobs: any[] = [];
  let apiError = false;

  try {
    // Attempt to fetch from NestJS Backend (Assuming it's running on port 3001)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const res = await fetch(`${apiUrl}/api/jobs`, {
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
  const displayJobs = matchedJobs.filter((job) => job.matchScore >= 70);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200">
      {/* Premium Header */}
      <header className="relative overflow-hidden border-b border-white/5 bg-[#0A0A0B]/80 px-6 py-12 backdrop-blur-xl">
        <div className="absolute -top-40 right-20 h-96 w-96 rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute left-20 top-0 h-64 w-64 rounded-full bg-emerald-500/10 blur-[80px]" />
        
        <div className="relative mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-400">
            ATS Sourcing Engine Active
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Your Match Dashboard
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            We have scanned thousands of jobs across 14+ platforms. These roles have successfully bypassed your strict AI pre-filters. Review your highest probability matches below.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {apiError && (
          <div className="mb-8 rounded-xl border border-rose-500/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            <strong>API Connection Warning:</strong> Could not reach the NestJS backend on port 3001. Displaying mock data for UI preview.
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-medium text-white">Highly Qualified Leads</h2>
          <span className="rounded-full bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-400 border border-white/10">
            {displayJobs.length} Matches Found
          </span>
        </div>

        <div className="grid gap-6">
          {displayJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}

          {displayJobs.length === 0 && !apiError && (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-white mb-2">No matches found yet</h3>
              <p className="text-muted-foreground max-w-md mx-auto">No matching jobs found at the moment. Check back soon for roles that meet your &gt;70% criteria.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
