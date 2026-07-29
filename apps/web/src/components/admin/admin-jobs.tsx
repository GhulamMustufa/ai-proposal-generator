"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { toast } from "@/lib/toast";

export default function AdminJobs() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/admin/jobs?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        // Fallback for backwards compatibility with un-paginated API
        if (Array.isArray(json)) {
            setJobs(json);
            setTotalCount(json.length);
            setTotalPages(1);
        } else {
            setJobs(json.data);
            setTotalCount(json.total);
            setTotalPages(json.totalPages);
        }
      } else {
          toast.error("Failed to load jobs");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred loading jobs");
    } finally {
      setLoading(false);
    }
  }, [getToken, page, limit]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handlePrevious = () => {
      if (page > 1) setPage(p => p - 1);
  };

  const handleNext = () => {
      if (page < totalPages) setPage(p => p + 1);
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
        <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20">
            <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded animate-pulse"></div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-black/50 border-b border-gray-200 dark:border-white/10 h-12">
              <tr><th colSpan={5}></th></tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-white/5 h-16">
                  <td colSpan={5} className="px-6 py-4">
                    <div className="h-4 bg-gray-200 dark:bg-white/10 rounded w-full animate-pulse"></div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
      <div className="p-4 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              Total Scraped Jobs: <span className="font-bold text-indigo-600 dark:text-indigo-400">{totalCount.toLocaleString()}</span>
          </h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
              Showing page {page} of {totalPages}
          </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-black/50 border-b border-gray-200 dark:border-white/10">
            <tr>
              <th className="px-6 py-4 font-medium">Platform</th>
              <th className="px-6 py-4 font-medium">Company</th>
              <th className="px-6 py-4 font-medium">Title</th>
              <th className="px-6 py-4 font-medium">Scraped At</th>
              <th className="px-6 py-4 font-medium">Link</th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-50 pointer-events-none' : ''}>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white capitalize">{job.platform}</td>
                <td className="px-6 py-4">{job.company || '-'}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]" title={job.title}>{job.title}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(job.scrapedAt).toLocaleString()}</td>
                <td className="px-6 py-4">
                  <a href={job.url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">View</a>
                </td>
              </tr>
            ))}
            {jobs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No jobs found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="p-4 border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={page === 1 || loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-400">
              Page {page} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={page === totalPages || loading}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
