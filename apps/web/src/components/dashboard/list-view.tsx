"use client";

import { useState } from "react";
import { JobCard } from "./job-card";

type ListViewProps = {
  jobs: any[];
};

export function ListView({ jobs }: ListViewProps) {
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  const filteredJobs = jobs.filter((job) => {
    if (activeTab === "all") return true;
    if (activeTab === "accepted") return job.status === "accepted" || job.status === "generated";
    return job.status === activeTab;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "all"
              ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "pending"
              ? "bg-indigo-500 text-white"
              : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
          }`}
        >
          Pending Review
        </button>
        <button
          onClick={() => setActiveTab("accepted")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "accepted"
              ? "bg-emerald-500 text-white"
              : "text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          }`}
        >
          Accepted
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "rejected"
              ? "bg-rose-500 text-white"
              : "text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          }`}
        >
          Rejected
        </button>
      </div>

      <div className="space-y-4 min-h-[400px]">
        {filteredJobs.length === 0 ? (
          <div className="flex h-full min-h-[400px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/50 p-12 dark:border-white/10 dark:bg-black/20">
            <p className="text-slate-500">No jobs found in this tab.</p>
          </div>
        ) : (
          filteredJobs.map((job, index) => (
            <JobCard key={`${job.id}-${index}`} job={job} />
          ))
        )}
      </div>
    </div>
  );
}
