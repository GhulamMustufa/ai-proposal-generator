"use client";

import { useState } from "react";
import { JobCard } from "./job-card";

type ListViewProps = {
  jobs: any[];
  updateJobStatus: (id: string, status: string) => void;
};

export function ListView({ jobs, updateJobStatus }: ListViewProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "accepted" | "rejected">("pending");

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "accepted") return job.status === "accepted" || job.status === "generated";
    return job.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-white/10 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "pending"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            📥 Inbox
          </button>
          <button
            onClick={() => setActiveTab("accepted")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "accepted"
                ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
            }`}
          >
            ⭐ Saved
          </button>
          <button
            onClick={() => setActiveTab("rejected")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "rejected"
                ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-md"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
            }`}
          >
            🗑️ Hidden
          </button>
        </div>
        
        {/* Score Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-wide">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shadow-sm">
            <span>85-100: Elite <span className="font-normal opacity-80 ml-1">(Perfect role alignment)</span></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-500/30 shadow-sm">
            <span>70-84: Good <span className="font-normal opacity-80 ml-1">(Meets core requirements)</span></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/30 shadow-sm">
            <span>50-69: Basic <span className="font-normal opacity-80 ml-1">(Missing nice-to-haves)</span></span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-500/30 shadow-sm">
            <span>Target Co: +15 <span className="font-normal opacity-80 ml-1">(Massive score boost)</span></span>
          </div>
        </div>
      </div>

      <div className="space-y-4 min-h-[400px]">
        {filteredJobs.length === 0 ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center text-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 dark:border-white/10 dark:bg-black/20">
            <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">It's quiet in here...</h3>
            <p className="text-sm text-slate-500">No jobs found in this tab.</p>
          </div>
        ) : (
          filteredJobs.map((job, index) => (
            <JobCard key={`${job.id}-${index}`} job={job} updateJobStatus={updateJobStatus} />
          ))
        )}
      </div>
    </div>
  );
}
