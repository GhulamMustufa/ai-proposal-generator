"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";

export function SyncButton() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const handleSync = async () => {
    try {
      setLoading(true);
      setMessage(null);

      const token = await getToken();
      if (!token) {
        throw new Error("Authentication token not found.");
      }

      const res = await fetch("http://localhost:3001/api/ingestion/trigger-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to trigger sync. Please try again.");
      }

      setMessage({ text: data.message, type: "success" });
    } catch (error: any) {
      setMessage({ text: error.message, type: "error" });
    } finally {
      setLoading(false);
      
      // Clear message after 10 seconds
      setTimeout(() => {
        setMessage(null);
      }, 10000);
    }
  };

  return (
    <div className="relative inline-block">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-5 py-2.5 text-sm font-medium text-emerald-600 transition-all hover:bg-emerald-500/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-emerald-500/20 dark:text-emerald-400 dark:hover:bg-emerald-500/30"
      >
        {loading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )}
        {loading ? "Syncing..." : "Sync New Jobs"}
      </button>

      {message && (
        <div 
          className={`absolute left-0 xl:right-0 xl:left-auto top-full mt-2 w-64 rounded-xl border p-3 text-xs shadow-lg backdrop-blur-md z-50 ${
            message.type === 'success' 
              ? 'border-emerald-500/20 bg-emerald-50/90 text-emerald-700 dark:bg-emerald-900/90 dark:text-emerald-200' 
              : 'border-rose-500/20 bg-rose-50/90 text-rose-700 dark:bg-rose-900/90 dark:text-rose-200'
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
