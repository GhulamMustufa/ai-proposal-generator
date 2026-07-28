"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export function UpgradeModal({ isOpen, onClose, message }: UpgradeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md bg-white/90 dark:bg-black/80 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl rounded-3xl overflow-hidden z-10 flex flex-col">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-pink-500/10 pointer-events-none" />
        
        <div className="pt-6 px-6 relative z-10 flex flex-col items-center">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-center">
            Upgrade to PitchPilot Pro
          </h2>
          <p className="text-center text-slate-600 dark:text-slate-300 mt-2 text-base">
            {message || "You've reached the limits of the free plan."}
          </p>
        </div>

        <div className="p-6 relative z-10 flex flex-col gap-6">
          <ul className="space-y-3">
            {[
              "Unlimited AI Proposals",
              "Unlimited Personas",
              "Automated Cold Email Generation",
              "Priority Support",
            ].map((feature, i) => (
              <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                <div className="h-6 w-6 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => {
                onClose();
                router.push("/pricing");
              }}
              className="w-full relative overflow-hidden rounded-xl bg-slate-900 dark:bg-white px-4 py-3.5 text-sm font-semibold text-white dark:text-black transition-all hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-95 flex items-center justify-center gap-2 group shadow-xl shadow-indigo-500/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity" />
              View Pricing & Upgrade
              <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
            <button
              onClick={onClose}
              className="w-full text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors py-2"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
