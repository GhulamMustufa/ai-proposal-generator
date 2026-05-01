"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { toast } from "@/lib/toast";

type Job = {
  title: string;
  link: string;
  description: string;
  date: string;
};

function CopyButton({ text, size = "sm" }: { text: string; size?: "xs" | "sm" }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  const base = size === "xs" ? "px-3 py-1 text-xs" : "px-3 py-1.5 text-sm";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`rounded-xl border font-medium transition-all duration-200 ${base} ${
        copied
          ? "scale-95 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

function JobCard({ job }: { job: Job }) {
  const [generating, setGenerating] = useState(false);
  const [proposal, setProposal] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setProposal("");

    try {
      const response = await fetch("/api/generate-proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_description: job.description,
          job_title: job.title,
          job_link: job.link,
        }),
      });

      const data = (await response.json()) as {
        generated_proposal?: string;
        error?: string | { code?: string; message?: string };
      };

      if (!response.ok || !data.generated_proposal) {
        const msg =
          typeof data.error === "string"
            ? data.error
            : (data.error?.message ?? "Failed to generate proposal.");
        toast.error(msg);
        return;
      }

      setProposal(data.generated_proposal);
      toast.success("Proposal generated");
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <article className="rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
      <h3 className="text-sm font-semibold leading-snug text-slate-900 dark:text-slate-100">{job.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{job.description}</p>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {generating ? "Generating..." : "Generate Proposal"}
        </button>
        <a
          href={job.link}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          View Job ↗
        </a>
      </div>

      {proposal && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Generated Proposal
            </p>
            <CopyButton text={proposal} size="xs" />
          </div>
          <div className="whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100">
            {proposal}
          </div>
        </div>
      )}
    </article>
  );
}

export function JobFeed({ defaultKeywords = "" }: { defaultKeywords?: string }) {
  const [query, setQuery] = useState(defaultKeywords);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const [editing, setEditing] = useState(false);
  const [keywordsInput, setKeywordsInput] = useState(defaultKeywords);
  const [savedKeywords, setSavedKeywords] = useState(defaultKeywords);
  const [saving, setSaving] = useState(false);

  const didAutoFetch = useRef(false);

  async function fetchJobs(q: string) {
    setLoading(true);
    setJobs([]);
    setSearched(true);

    try {
      const response = await fetch(`/api/jobs?query=${encodeURIComponent(q)}`);
      const data = (await response.json()) as Job[] | { error?: string };

      if (!response.ok) {
        toast.error((data as { error?: string }).error ?? "Failed to fetch jobs.");
        return;
      }

      setJobs(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (didAutoFetch.current || !defaultKeywords.trim()) return;
    didAutoFetch.current = true;
    void fetchJobs(defaultKeywords.trim());
  }, []); // intentionally runs once on mount

  async function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (trimmed) void fetchJobs(trimmed);
  }

  async function handleSaveKeywords() {
    setSaving(true);

    try {
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_keywords: keywordsInput }),
      });

      const data = (await response.json()) as { default_keywords?: string; error?: string };

      if (!response.ok) {
        toast.error(data.error ?? "Failed to save keywords.");
        return;
      }

      const saved = data.default_keywords ?? keywordsInput;
      setSavedKeywords(saved);
      setQuery(saved);
      setEditing(false);
      toast.success("Default keywords saved");
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCancelEdit() {
    setKeywordsInput(savedKeywords);
    setEditing(false);
  }

  return (
    <div className="space-y-4">
      {/* Default keywords editor */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        {editing ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Default Keywords
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={keywordsInput}
                onChange={(e) => setKeywordsInput(e.target.value)}
                placeholder="e.g. react native, node.js"
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
              />
              <button
                type="button"
                onClick={handleSaveKeywords}
                disabled={saving}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                {saving ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Default Keywords
              </p>
              <p className="mt-0.5 truncate text-sm text-slate-700 dark:text-slate-200">
                {savedKeywords || <span className="italic text-slate-400 dark:text-slate-500">None set</span>}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setKeywordsInput(savedKeywords);
                setEditing(true);
              }}
              className="shrink-0 rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
            >
              Edit
            </button>
          </div>
        )}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search jobs (e.g. react native, node.js)"
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      {!loading && searched && jobs.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">No jobs found. Try different keywords.</p>
      )}

      {jobs.length > 0 && (
        <ul className="space-y-4">
          {jobs.map((job, index) => (
            <li key={index}>
              <JobCard job={job} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
