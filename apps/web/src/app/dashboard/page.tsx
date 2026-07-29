"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { ListView } from "@/components/dashboard/list-view";
import { SyncButton } from "@/components/dashboard/sync-button";
import { PersonaFilter } from "@/components/dashboard/persona-filter";
import { usePersonas } from "@/hooks/use-personas";
import { useUserPlan } from "@/hooks/use-user-plan";
import { useUpgradeModal } from "@/context/upgrade-modal-context";

// Global cache to prevent refetching jobs when switching back to a persona
const jobsCache: Record<string, any[]> = {};

export default function DashboardPage() {
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePersonaId = searchParams.get("personaId");
  const { personas, loading: personasLoading } = usePersonas();
  const { plan } = useUserPlan();
  const { openModal } = useUpgradeModal();

  useEffect(() => {
    if (!userId) {
      router.push("/sign-in");
    }
  }, [userId, router]);

  // Set default persona if none is selected
  useEffect(() => {
    if (!activePersonaId && personas && personas.length > 0) {
      router.replace(`/dashboard?personaId=${personas[0].id}`);
    }
  }, [activePersonaId, personas, router]);

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const fetchJobs = async (personaId?: string, forceRefresh = false) => {
    if (!personaId) {
      setLoading(false);
      return;
    }

    // Check cache first for instantaneous loading, unless forcing refresh (polling)
    if (jobsCache[personaId] && !forceRefresh) {
      setJobs(jobsCache[personaId]);
      setLoading(false);
      return;
    }

    try {
      if (!forceRefresh) setLoading(true);
      const token = await getToken();
      if (!token) return;

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const url = new URL(`${apiUrl}/api/jobs`);
      url.searchParams.append("personaId", personaId);
      url.searchParams.append("statuses", "pending,accepted,rejected,generated");

      const res = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to fetch jobs");

      const data = await res.json();
      
      // Save to cache and state
      jobsCache[personaId] = data;
      setJobs(data);
      
      return data; // Return data so polling logic can check it
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      if (!forceRefresh) setLoading(false);
    }
  };

  // Setup Polling Effect
  useEffect(() => {
    if (!isPolling || !activePersonaId) return;

    const currentJobsCount = jobs.length;
    let pollAttempts = 0;
    const maxAttempts = 6; // 30 seconds total at 5s interval

    const intervalId = setInterval(async () => {
      pollAttempts++;
      const updatedJobs = await fetchJobs(activePersonaId, true);
      
      // Stop polling if we found new jobs, or if we timed out
      if ((updatedJobs && updatedJobs.length > currentJobsCount) || pollAttempts >= maxAttempts) {
        setIsPolling(false);
        clearInterval(intervalId);
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [isPolling, activePersonaId, jobs.length]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    fetchJobs(activePersonaId || undefined).then(data => {
      // If we just landed on the dashboard and have 0 jobs, it might be because the backend is
      // currently processing the newly created Persona in the background. Start polling automatically!
      if (data && data.length === 0) {
        const activePersona = personas.find(p => p.id === activePersonaId);
        const lastSynced = activePersona?.lastSyncedAt ? new Date(activePersona.lastSyncedAt).getTime() : 0;
        const secondsSinceSync = (new Date().getTime() - lastSynced) / 1000;
        
        // Only auto-poll if the persona has never been synced, or was synced in the last 60 seconds
        if (!activePersona?.lastSyncedAt || secondsSinceSync < 60) {
          setIsPolling(true);
        }
      }
    });
    
    // Auto-sync check
    if (activePersonaId && personas.length > 0) {
      const activePersona = personas.find(p => p.id === activePersonaId);
      if (activePersona && activePersona.lastSyncedAt) {
        const lastSynced = new Date(activePersona.lastSyncedAt).getTime();
        const now = new Date().getTime();
        const hoursDiff = (now - lastSynced) / (1000 * 60 * 60);
        
        if (hoursDiff > 6) {
          // Trigger auto-sync silently
          getToken().then(token => {
            if (token) {
              const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
              fetch(`${apiUrl}/api/personas/${activePersonaId}/sync`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                }
              }).then(() => setIsPolling(true)).catch(console.error);
            }
          });
        }
      }
    }
  }, [activePersonaId, personas]);

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
            <SyncButton 
              activePersonaId={activePersonaId || undefined} 
              onSyncStarted={() => setIsPolling(true)}
            />
          </div>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
            We have scanned thousands of jobs across 25+ platforms. These roles have successfully bypassed your strict AI pre-filters. Review your highest probability matches below.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-5xl px-6 py-12">
        {plan && plan.subscriptionStatus === 'free' && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/10 p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300">Free Plan Usage</h3>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1">
                You have used {plan.generationsCount} of {plan.monthlyLimit} proposals this month.
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 px-4 py-2 rounded-lg transition-colors shadow-sm"
            >
              Upgrade to Pro
            </button>
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
              href={`/proposal-generator${activePersonaId ? `?personaId=${activePersonaId}` : ''}`}
              className="whitespace-nowrap inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-500 shadow-lg shadow-indigo-500/25 shrink-0"
            >
              Open Proposal Crafter ✨
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-slate-900 dark:text-white flex items-center gap-3">
              Highly Qualified Leads
              {jobs.length > 0 && !loading && (
                <span className="inline-flex items-center justify-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm font-medium text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {jobs.length}
                </span>
              )}
            </h2>
          </div>
          <PersonaFilter />
        </div>

        <div className="relative min-h-[600px] w-full max-w-4xl mx-auto">
          {loading || personasLoading ? (
            <div className="w-full space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex flex-col md:flex-row gap-4 p-6 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02]">
                  <div className="flex-1 space-y-4">
                    <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="flex gap-2 pt-2">
                      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                      <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700 rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-full md:w-32 h-10 bg-slate-200 dark:bg-slate-700 rounded-xl mt-auto md:mt-0"></div>
                </div>
              ))}
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
            isPolling ? (
              <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-indigo-200 border-dashed bg-indigo-50/50 py-24 px-12 dark:border-indigo-900/50 dark:bg-indigo-900/10 w-full relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-indigo-500/[0.025] dark:bg-grid-white/[0.02] bg-[length:32px_32px]" />
                <div className="relative h-20 w-20 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                  <div className="absolute inset-2 rounded-full border-4 border-indigo-500/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] animation-delay-500"></div>
                  <div className="relative h-12 w-12 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                    <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-semibold text-slate-900 dark:text-white mb-3 relative animate-pulse">AI is scanning the database...</h3>
                <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto relative text-base">
                  Evaluating thousands of jobs against your persona. High-quality matches will appear here shortly.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center rounded-2xl border border-slate-200 border-dashed bg-white/50 py-24 px-12 dark:border-white/10 dark:bg-black/20 w-full">
                <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                  <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-slate-900 dark:text-white mb-2">No Jobs Found Yet</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-8">
                  Your AI hasn't found any matching jobs for this Persona yet. Click the button below to start scanning for high-quality leads.
                </p>
                <SyncButton 
                  activePersonaId={activePersonaId || undefined} 
                  onSyncStarted={() => setIsPolling(true)}
                />
              </div>
            )
          ) : (
            <div className="w-full">
              <ListView jobs={jobs} updateJobStatus={updateJobStatus} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
