"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AdminJobs() {
  const { getToken } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchJobs() {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/admin/jobs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setJobs(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, [getToken]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
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
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white capitalize">{job.platform}</td>
                <td className="px-6 py-4">{job.company || '-'}</td>
                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 line-clamp-1 max-w-[200px]">{job.title}</td>
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
    </div>
  );
}
