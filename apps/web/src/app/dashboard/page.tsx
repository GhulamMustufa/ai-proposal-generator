"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ListView } from "@/components/dashboard/list-view";
import { SyncButton } from "@/components/dashboard/sync-button";
import { PersonaFilter } from "@/components/dashboard/persona-filter";

export default function DashboardPage() {
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePersonaId = searchParams.get("personaId");

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in");
    }
  }, [userId, router]);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async (personaId?: string) => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const url = new URL(`${apiUrl}/api/jobs`);
      if (personaId) {
        url.searchParams.append("personaId", personaId);
      }
      url.searchParams.append("statuses", "pending,accepted,rejected,generated");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data = await res.json();
      setJobs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchJobs(activePersonaId || undefined);
  }, [activePersonaId]);

  const updateJobStatus = async (jobId: string, status: string) => {
    setJobs((prev) => prev.map((j) => j.id === jobId ? { ...j, status } : j));
    
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      await fetch(`${apiUrl}/api/jobs/${jobId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status, personaId: activePersonaId || undefined })
      });
    } catch (e) {
      console.error("Failed to update status", e);
    }
  };

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
          </div>
          <PersonaFilter />
        </div>

        <div className="relative min-h-[600px] w-full max-w-4xl mx-auto flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              <p className="text-sm font-medium text-slate-500">Loading matches...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
          ) : !activePersonaId ? (
            <div className="flex flex-col items-center justify-center py-24 text-center rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] w-full">
              <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">Create or Select a Persona</h3>
              <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6">
                You need to create at least one Persona before the AI can automatically match you with jobs.
              </p>
              <Link href="/personas" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 transition">
                Create Persona
              </Link>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center rounded-2xl border border-slate-200 border-dashed bg-white/50 p-12 dark:border-white/10 dark:bg-black/20 w-full">
              <p className="text-slate-500">No jobs found for this persona. Try syncing latest jobs.</p>
            </div>
          ) : (
            <div className="w-full">
              <ListView jobs={jobs} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
