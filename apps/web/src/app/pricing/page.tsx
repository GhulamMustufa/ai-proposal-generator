'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import axios from 'axios';
import { ShieldCheckIcon, BoltIcon, CheckIcon } from '@heroicons/react/24/solid';

export default function PricingPage() {
  const { isSignedIn, isLoaded } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    if (!isSignedIn) {
      // Need to sign in first
      window.location.href = '/sign-in';
      return;
    }
    
    setLoading(true);
    try {
      // 1. Call our Next.js API route which forwards to NestJS, OR call NestJS directly if using axios with Clerk token
      // Assuming Next.js /api rewrites or direct call with auth header.
      // We will assume standard direct call to NestJS backend at process.env.NEXT_PUBLIC_API_URL or relative /api/billing/checkout
      
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/billing/checkout`, {
        headers: {
          // This requires the Clerk token to be passed, which is usually handled via an interceptor or explicit passing.
          // For simplicity in this component, let's just let the user click and if it fails due to auth, handle it.
          // In a real app we'd fetch the token: const token = await getToken();
        }
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to get checkout URL', error);
      alert('Failed to initiate checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0A0A0B] text-gray-900 dark:text-white py-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-base font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide uppercase">Pricing</h2>
        <p className="mt-2 text-4xl font-extrabold text-gray-900 dark:text-white sm:text-5xl sm:tracking-tight lg:text-6xl">
          Supercharge your Job Search.
        </p>
        <p className="max-w-xl mt-5 mx-auto text-xl text-gray-600 dark:text-gray-400">
          Land your dream job faster with unlimited AI-tailored proposals and priority ATS ingestion.
        </p>
      </div>

      <div className="mt-24 max-w-7xl mx-auto grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8 px-4 sm:px-6 lg:px-8">
        
        {/* FREE TIER */}
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-3xl shadow-xl overflow-hidden backdrop-blur-md">
          <div className="px-6 py-8 sm:p-10 sm:pb-6">
            <div>
              <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                Free Tier
              </h3>
            </div>
            <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900 dark:text-white">
              $0
              <span className="ml-1 text-2xl font-medium text-gray-500 dark:text-gray-400">/mo</span>
            </div>
            <p className="mt-5 text-lg text-gray-600 dark:text-gray-400">
              Perfect for testing the waters and seeing the AI Matcher in action.
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 sm:p-10 sm:pt-6">
            <ul className="space-y-4">
              <li className="flex items-start">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                <p className="ml-3 text-base text-gray-700 dark:text-gray-300">Access to AI Job Matcher</p>
              </li>
              <li className="flex items-start">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                <p className="ml-3 text-base text-gray-700 dark:text-gray-300">Basic Filters (Remote, Experience)</p>
              </li>
              <li className="flex items-start">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                <p className="ml-3 text-base text-gray-900 dark:text-white font-bold">3 Free AI Proposals (Total)</p>
              </li>
            </ul>
            <div className="mt-8">
              <button disabled className="w-full bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-white hover:bg-gray-300 dark:hover:bg-white/20 px-4 py-3 border border-transparent rounded-xl text-lg font-medium transition-colors cursor-not-allowed">
                Current Plan
              </button>
            </div>
          </div>
        </div>

        {/* PRO TIER */}
        <div className="bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-900/40 dark:to-[#0A0A0B] border border-emerald-300 dark:border-emerald-500/50 rounded-3xl shadow-2xl shadow-emerald-200 dark:shadow-emerald-900/20 overflow-hidden backdrop-blur-md relative transform lg:-translate-y-4">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-emerald-300 dark:bg-emerald-500/30 rounded-full blur-3xl"></div>
          
          <div className="px-6 py-8 sm:p-10 sm:pb-6 relative z-10">
            <div>
              <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                Pro Tier
              </h3>
            </div>
            <div className="mt-4 flex items-baseline text-6xl font-extrabold text-gray-900 dark:text-white">
              $29
              <span className="ml-1 text-2xl font-medium text-gray-500 dark:text-gray-400">/mo</span>
            </div>
            <p className="mt-5 text-lg text-emerald-800 dark:text-emerald-200">
              Unlock unlimited power. Generate tailored proposals for every job you apply to.
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 sm:p-10 sm:pt-6 relative z-10">
            <ul className="space-y-4">
              <li className="flex items-start">
                <BoltIcon className="flex-shrink-0 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                <p className="ml-3 text-base text-gray-900 dark:text-white font-bold">Unlimited AI Proposals</p>
              </li>
              <li className="flex items-start">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                <p className="ml-3 text-base text-gray-700 dark:text-gray-300">Priority ATS Ingestion</p>
              </li>
              <li className="flex items-start">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                <p className="ml-3 text-base text-gray-700 dark:text-gray-300">Advanced Salary Insights</p>
              </li>
              <li className="flex items-start">
                <CheckIcon className="flex-shrink-0 h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                <p className="ml-3 text-base text-gray-700 dark:text-gray-300">Priority Support</p>
              </li>
            </ul>
            <div className="mt-8">
              <button
                onClick={handleUpgrade}
                disabled={loading || !isLoaded}
                className="w-full bg-emerald-500 text-black hover:bg-emerald-400 px-4 py-3 border border-transparent rounded-xl text-lg font-bold transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex justify-center items-center"
              >
                {loading ? 'Securing checkout...' : 'Upgrade to Pro'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
