"use client";

import { useState } from 'react';
import AdminStats from '@/components/admin/admin-stats';
import AdminQueues from '@/components/admin/admin-queues';
import AdminUsers from '@/components/admin/admin-users';
import AdminJobs from '@/components/admin/admin-jobs';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'stats' | 'queues' | 'users' | 'jobs' | 'ai'>('stats');

  const tabs = [
    { id: 'stats', label: 'Overview Metrics' },
    { id: 'queues', label: 'Scrapers & Queues' },
    { id: 'users', label: 'User Management' },
    { id: 'jobs', label: 'Job Database' },
  ] as const;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4 border-b border-gray-200 dark:border-white/10 pb-4 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-gray-200 dark:bg-white/10 text-gray-900 dark:text-white shadow-[0_0_15px_rgba(0,0,0,0.05)] dark:shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {activeTab === 'stats' && <AdminStats />}
        {activeTab === 'queues' && <AdminQueues />}
        {activeTab === 'users' && <AdminUsers />}
        {activeTab === 'jobs' && <AdminJobs />}
      </div>
    </div>
  );
}
