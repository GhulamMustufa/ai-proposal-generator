"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

export default function AdminQueues() {
  const { getToken } = useAuth();
  const [queues, setQueues] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [activeJobs, setActiveJobs] = useState<any[] | null>(null);
  const [failedJobs, setFailedJobs] = useState<any[] | null>(null);
  const [completedJobs, setCompletedJobs] = useState<any[] | null>(null);
  const [waitingJobs, setWaitingJobs] = useState<any[] | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [viewType, setViewType] = useState<'active' | 'failed' | 'completed' | 'waiting' | null>(null);

  async function fetchQueues() {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/admin/queues`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setQueues(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchQueues();
    const interval = setInterval(fetchQueues, 5000);
    return () => clearInterval(interval);
  }, [getToken]);

  const handleTriggerScrapers = async () => {
    if (!confirm("Are you sure you want to run all 22 scrapers? This will hit rate limits if done too frequently.")) return;
    setTriggering(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/admin/scrapers/trigger`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Scrapers triggered successfully!");
        fetchQueues();
      } else {
        toast.error("Failed to trigger scrapers");
      }
    } finally {
      setTriggering(false);
    }
  };

  const handleClearQueues = async () => {
    if (!confirm("EMERGENCY STOP: This will obliterate all active and pending background jobs. Proceed?")) return;
    setClearing(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/admin/queues/clear`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success("Queues obliterated!");
        fetchQueues();
      }
    } finally {
      setClearing(false);
    }
  };

  const fetchJobsList = async (queueName: string, type: 'active' | 'failed' | 'completed' | 'waiting') => {
    setSelectedQueue(queueName);
    setViewType(type);
    setLoadingList(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/admin/queues/${queueName}/${type}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        if (type === 'failed') setFailedJobs(await res.json());
        else if (type === 'active') setActiveJobs(await res.json());
        else if (type === 'completed') setCompletedJobs(await res.json());
        else setWaitingJobs(await res.json());
      } else {
        if (type === 'failed') setFailedJobs([]);
        else if (type === 'active') setActiveJobs([]);
        else if (type === 'completed') setCompletedJobs([]);
        else setWaitingJobs([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(`Failed to fetch ${type} jobs`);
    } finally {
      setLoadingList(false);
    }
  };

  if (loading && !queues) {
    return (
      <div className="space-y-8">
        <div className="flex gap-4">
          <div className="h-12 w-40 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse"></div>
          <div className="h-12 w-64 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 h-48 animate-pulse shadow-sm dark:shadow-none"></div>
          ))}
        </div>
      </div>
    );
  }
  if (!queues) return <div className="text-red-400">Failed to load queue status.</div>;

  return (
    <div className="space-y-8">
      <div className="flex gap-4">
        <button
          onClick={handleTriggerScrapers}
          disabled={triggering}
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 shadow-[0_0_20px_rgba(147,51,234,0.3)]"
        >
          {triggering ? "Triggering..." : "Run All Scrapers"}
        </button>
        <button
          onClick={handleClearQueues}
          disabled={clearing}
          className="bg-red-50 dark:bg-red-600/20 hover:bg-red-100 dark:hover:bg-red-600 border border-red-200 dark:border-red-500/50 text-red-600 dark:text-red-500 hover:text-red-700 dark:hover:text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50"
        >
          {clearing ? "Clearing..." : "Emergency Stop (Clear Queues)"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(queues).map(([name, counts]: [string, any]) => (
          <div key={name} className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
            <h3 className="text-xl font-semibold mb-4 capitalize text-gray-900 dark:text-white">{name.replace("-", " ")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div 
                className="bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-transparent rounded-lg p-4 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                onClick={() => fetchJobsList(name, 'active')}
              >
                <div className="text-xs text-blue-500 dark:text-blue-400 uppercase font-bold mb-1">Active (Click)</div>
                <div className="text-3xl font-mono text-gray-900 dark:text-white">{counts.active}</div>
              </div>
              <div 
                className="bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-transparent rounded-lg p-4 cursor-pointer hover:bg-yellow-50 dark:hover:bg-yellow-900/20 transition-colors"
                onClick={() => fetchJobsList(name, 'waiting')}
              >
                <div className="text-xs text-yellow-500 dark:text-yellow-400 uppercase font-bold mb-1">Waiting (Click)</div>
                <div className="text-3xl font-mono text-gray-900 dark:text-white">{counts.waiting}</div>
              </div>
              <div 
                className="bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-transparent rounded-lg p-4 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                onClick={() => fetchJobsList(name, 'failed')}
              >
                <div className="text-xs text-red-500 dark:text-red-400 uppercase font-bold mb-1">Failed (Click)</div>
                <div className="text-3xl font-mono text-gray-900 dark:text-white">{counts.failed}</div>
              </div>
              <div 
                className="bg-gray-50 dark:bg-black/50 border border-gray-100 dark:border-transparent rounded-lg p-4 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                onClick={() => fetchJobsList(name, 'completed')}
              >
                <div className="text-xs text-green-500 dark:text-green-400 uppercase font-bold mb-1">Completed (Click)</div>
                <div className="text-3xl font-mono text-gray-900 dark:text-white">{counts.completed}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedQueue && viewType && (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none mt-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold capitalize text-gray-900 dark:text-white">{viewType} Jobs: {selectedQueue.replace("-", " ")}</h3>
            <button onClick={() => { setSelectedQueue(null); setViewType(null); }} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">Close</button>
          </div>
          
          {loadingList ? (
            <div className="h-20 bg-gray-100 dark:bg-white/5 rounded-lg animate-pulse w-full"></div>
          ) : viewType === 'active' ? (
            activeJobs?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No active jobs right now.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {activeJobs?.map((job) => (
                  <div key={job.id} className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{job.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {job.id} • Started: {new Date(job.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40 px-3 py-1 rounded-full">
                      {job.progress ? (typeof job.progress === 'object' ? JSON.stringify(job.progress) : `${job.progress}%`) : 'Running...'}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : viewType === 'waiting' ? (
            waitingJobs?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No waiting jobs found.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {waitingJobs?.map((job) => (
                  <div key={job.id} className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{job.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {job.id} • Queued: {new Date(job.timestamp).toLocaleTimeString()}</p>
                    </div>
                    <div className="text-sm font-medium text-yellow-700 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40 px-3 py-1 rounded-full">
                      Queued
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : viewType === 'completed' ? (
            completedJobs?.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No completed jobs found.</p>
            ) : (
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {completedJobs?.map((job) => (
                  <div key={job.id} className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg p-4 flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{job.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">ID: {job.id} • Completed: {new Date(job.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 px-3 py-1 rounded-full">
                      {job.returnvalue?.insertedCount !== undefined ? (
                        <>Added <b>{job.returnvalue.insertedCount}</b> new jobs</>
                      ) : (
                        "Success"
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : failedJobs?.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No failed jobs found in this queue.</p>
          ) : (
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {failedJobs?.map((job) => (
                <div key={job.id} className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm font-bold text-red-800 dark:text-red-400">ID: {job.id}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(job.timestamp).toLocaleString()}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">{job.name}</h4>
                  <div className="text-sm text-red-600 dark:text-red-400 mb-4 whitespace-pre-wrap font-mono bg-red-100 dark:bg-black/30 p-2 rounded">
                    {job.failedReason}
                  </div>
                  {job.data && (
                    <details className="text-sm text-gray-700 dark:text-gray-300">
                      <summary className="cursor-pointer text-gray-500 font-medium mb-2">View Job Data</summary>
                      <pre className="bg-white dark:bg-black/50 p-3 rounded border border-gray-200 dark:border-white/10 overflow-x-auto text-xs mt-2">
                        {JSON.stringify(job.data, null, 2)}
                      </pre>
                    </details>
                  )}
                  {job.stacktrace?.length > 0 && (
                    <details className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                      <summary className="cursor-pointer text-gray-500 font-medium mb-2">View Stacktrace</summary>
                      <pre className="bg-white dark:bg-black/50 p-3 rounded border border-gray-200 dark:border-white/10 overflow-x-auto text-xs mt-2 text-red-700 dark:text-red-400">
                        {job.stacktrace.join('\n')}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-12 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm dark:shadow-none">
        <h3 className="text-xl font-semibold mb-6 text-gray-900 dark:text-white">Individual Scrapers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[
            'scrape-remotive', 'scrape-wwr', 'scrape-remoteok', 'scrape-upwork', 'scrape-freelancer',
            'scrape-workingnomads', 'scrape-himalayas', 'scrape-jobicy', 'scrape-arbeitnow', 'scrape-remoteco',
            'scrape-dribbble', 'scrape-relocateme', 'scrape-ats-greenhouse', 'scrape-ats-lever', 'scrape-ats-smartrecruiters',
            'scrape-ats-workable', 'scrape-ats-breezy', 'scrape-ats-ashby', 'scrape-dorks', 'scrape-jobcity',
            'scrape-hackernews', 'scrape-braintrust'
          ].map((scraper) => (
            <button
              key={scraper}
              disabled={triggeringId === scraper}
              onClick={async () => {
                setTriggeringId(scraper);
                try {
                  const token = await getToken();
                  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                  const res = await fetch(`${apiUrl}/api/admin/scrapers/trigger/${scraper}`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (res.ok) {
                    toast.success(`Triggered ${scraper}`);
                    fetchQueues();
                  } else {
                    toast.error(`Failed to trigger ${scraper}`);
                  }
                } catch (e) {
                  toast.error("Error triggering scraper");
                } finally {
                  setTriggeringId(null);
                }
              }}
              className="bg-gray-100 dark:bg-white/10 hover:bg-purple-100 dark:hover:bg-purple-900/30 text-gray-700 dark:text-gray-300 hover:text-purple-700 dark:hover:text-purple-300 border border-gray-200 dark:border-white/10 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center truncate disabled:opacity-50 disabled:cursor-wait"
              title={scraper}
            >
              {triggeringId === scraper ? "Starting..." : scraper.replace('scrape-', '')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
