"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "@/lib/toast";

type JobCardProps = {
  job: any;
};

export function JobCard({ job }: JobCardProps) {
  const { getToken, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generationType, setGenerationType] = useState<'proposal' | 'cold_email'>('proposal');

  const isElite = job.matchScore >= 90;
  const isGood = job.matchScore >= 80 && job.matchScore < 90;
  
  const scoreColor = isElite 
    ? "text-emerald-600 dark:text-emerald-400" 
    : isGood 
      ? "text-blue-600 dark:text-blue-400" 
      : "text-amber-600 dark:text-amber-400";
      
  const scoreBg = isElite 
    ? "bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20 shadow-[0_0_15px_rgba(52,211,153,0.05)] dark:shadow-[0_0_15px_rgba(52,211,153,0.15)]" 
    : isGood 
      ? "bg-blue-50 dark:bg-blue-400/10 border-blue-200 dark:border-blue-400/20" 
      : "bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20";

  async function handleGenerate() {
    setLoading(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const res = await fetch(`${apiUrl}/api/proposals/enqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: job.id,
          jobTitle: job.title,
          jobDescription: job.description,
          company: job.company,
          generationType
        })
      });

      if (!res.ok) {
        throw new Error("Failed to enqueue job");
      }

      toast.success(`${generationType === 'proposal' ? 'Proposal' : 'Cold Email'} generation started in background.`);

      // Subscribe to Server-Sent Events for real-time completion
      const eventSource = new EventSource(`${apiUrl}/api/proposals/status/${userId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.jobId === job.id) {
            if (data.status === 'generated') {
              setLoading(false);
              setGenerated(true);
              toast.success("Your AI draft has been generated!");
              eventSource.close();
            } else if (data.status === 'error') {
              setLoading(false);
              toast.error("Background generation failed.");
              eventSource.close();
            }
          }
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error", error);
        eventSource.close();
        setLoading(false); // Fallback to avoid hanging
      };

    } catch (error) {
      setLoading(false);
      toast.error("Failed to generate text.");
    }
  }

  return (
    <div 
      className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 transition-all duration-300 hover:border-slate-300 dark:hover:border-white/10 hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-indigo-500/5"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 dark:from-white/[0.03] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      
      <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        
        {/* Left Column: Job Info */}
        <div className="flex-1 space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl font-semibold text-slate-900 dark:text-white tracking-tight">{job.title}</h3>
              <span className="rounded-full bg-slate-100 dark:bg-white/10 px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/5">
                {job.platform}
              </span>
            </div>
            <div className="mt-1.5 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span className="h-4 w-4 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">{job.company?.charAt(0) || "C"}</span>
                {job.company || "Confidential Company"}
              </p>
              
              {(job.createdAt || job.scrapedAt) && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {new Date(job.createdAt || job.scrapedAt).toLocaleDateString(undefined, { 
                    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 p-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/50 to-purple-500/50" />
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {job.matchReasoning || "AI Evaluation completed. Profile alignment is strong across core requirements."}
            </p>
          </div>
        </div>

        {/* Right Column: Score & Action */}
        <div className="flex flex-col items-start md:items-end justify-between shrink-0 gap-6">
          <div className="flex flex-col items-start md:items-end">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Match Score</p>
            <div className={`flex items-center justify-center h-16 w-16 rounded-2xl border ${scoreBg} backdrop-blur-md`}>
              <span className={`text-2xl font-bold ${scoreColor}`}>
                {job.matchScore}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-stretch gap-2 w-full md:w-auto min-w-[180px]">
            <a 
              href={job.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 mb-2"
            >
              View Job
            </a>
            
            {!loading && !generated && (
              <div className="flex items-center justify-center gap-1 mb-2 p-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-white/5">
                <button
                  onClick={() => setGenerationType('proposal')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${generationType === 'proposal' ? 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Proposal
                </button>
                <button
                  onClick={() => setGenerationType('cold_email')}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition ${generationType === 'cold_email' ? 'bg-purple-500/20 text-purple-700 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                  Cold Email
                </button>
              </div>
            )}
            
            {loading ? (
              <div className="flex items-center justify-center h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 px-6 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                AI Generating...
              </div>
            ) : generated ? (
              <div className="inline-flex items-center justify-center rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 px-6 py-2.5 text-sm font-medium text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-emerald-500/30">
                Generated ✨
              </div>
            ) : (
              <button 
                onClick={handleGenerate}
                className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 shadow-lg shadow-indigo-500/25"
              >
                Generate ✨
              </button>
            )}
          </div>
        </div>
        
      </div>
    </div>
  );
}
