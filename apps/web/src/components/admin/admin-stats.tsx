"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AdminStats() {
  const { getToken } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [getToken]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-2xl h-32 animate-pulse"></div>
        ))}
      </div>
    );
  }
  if (!stats) return <div className="text-red-400">Failed to load stats. Check your admin privileges.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[
        { label: "Total Users", value: stats.totalUsers },
        { label: "Jobs in DB", value: stats.totalJobs },
        { label: "Total Personas", value: stats.totalPersonas },
        { label: "Matches Generated", value: stats.totalMatches },
      ].map((stat, i) => (
        <div key={i} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 p-6 rounded-2xl flex flex-col justify-center shadow-sm dark:shadow-none">
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium tracking-wide uppercase mb-1">{stat.label}</div>
          <div className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{stat.value?.toLocaleString()}</div>
        </div>
      ))}
    </div>
  );
}
