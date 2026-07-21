"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "@/lib/toast";

type JobFilters = {
  targetRegions: string[];
  employmentTypes: string[];
  salaryFloor: string;
};

export default function ProfilePage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [filters, setFilters] = useState<JobFilters>({
    targetRegions: [],
    employmentTypes: [],
    salaryFloor: "",
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Constants for checkboxes
  const REGIONS = ["Remote Worldwide", "United States", "Europe", "Middle East", "Asia"];
  const EMPLOYMENT_TYPES = ["Full-Time (W2)", "Contract", "Freelance/1099", "Part-Time"];

  useEffect(() => {
    async function fetchProfile() {
      if (!isLoaded || !isSignedIn) return;
      
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        const res = await fetch(`${apiUrl}/api/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data && data.jobFilters) {
            setFilters({
              targetRegions: data.jobFilters.targetRegions || [],
              employmentTypes: data.jobFilters.employmentTypes || [],
              salaryFloor: data.jobFilters.salaryFloor || "",
            });
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (isLoaded) {
      fetchProfile();
    }
  }, [isLoaded, isSignedIn, getToken]);

  function handleRegionToggle(region: string) {
    setFilters(prev => {
      const isSelected = prev.targetRegions.includes(region);
      return {
        ...prev,
        targetRegions: isSelected 
          ? prev.targetRegions.filter(r => r !== region)
          : [...prev.targetRegions, region]
      };
    });
  }

  function handleTypeToggle(type: string) {
    setFilters(prev => {
      const isSelected = prev.employmentTypes.includes(type);
      return {
        ...prev,
        employmentTypes: isSelected 
          ? prev.employmentTypes.filter(t => t !== type)
          : [...prev.employmentTypes, type]
      };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const res = await fetch(`${apiUrl}/api/profile/filters`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobFilters: filters
        }),
      });
      
      if (!res.ok) {
        toast.error("Failed to save profile");
        return;
      }
      
      toast.success("Job filters successfully updated.");
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-slate-200 p-8">
        <div className="animate-pulse space-y-6 max-w-2xl mx-auto rounded-2xl border border-white/5 bg-white/[0.02] p-10">
          <div className="h-6 w-48 rounded bg-white/10" />
          <div className="h-4 w-96 rounded bg-white/10" />
          <div className="space-y-4 pt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-400">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Job Matching Filters</h1>
          <p className="mt-2 text-slate-400">
            Configure your preferences. The AI Matcher will strictly adhere to these rules when scoring jobs, ignoring any listings that don't meet your criteria.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Target Regions */}
          <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-white mb-1">Target Regions</h2>
            <p className="text-sm text-slate-400 mb-6">Select the geographic areas you are eligible to work in.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REGIONS.map(region => (
                <label key={region} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  filters.targetRegions.includes(region) 
                    ? "border-emerald-500/50 bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    filters.targetRegions.includes(region) ? "bg-emerald-500 border-emerald-500" : "border-white/20"
                  }`}>
                    {filters.targetRegions.includes(region) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{region}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Employment Types */}
          <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-white mb-1">Employment Type</h2>
            <p className="text-sm text-slate-400 mb-6">What type of contracts are you looking for?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EMPLOYMENT_TYPES.map(type => (
                <label key={type} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  filters.employmentTypes.includes(type) 
                    ? "border-indigo-500/50 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    filters.employmentTypes.includes(type) ? "bg-indigo-500 border-indigo-500" : "border-white/20"
                  }`}>
                    {filters.employmentTypes.includes(type) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-white">{type}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Salary Floor */}
          <section className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-white mb-1">Compensation Floor</h2>
            <p className="text-sm text-slate-400 mb-6">Jobs with listed compensation below this will be penalized by the matcher.</p>
            
            <div>
              <input
                type="text"
                value={filters.salaryFloor}
                onChange={(e) => setFilters(prev => ({ ...prev, salaryFloor: e.target.value }))}
                placeholder="e.g., $150k annually or $80/hr"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50"
              />
            </div>
          </section>

          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-500 px-8 py-3 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
            >
              {saving ? "Saving Preferences..." : "Save Preferences"}
            </button>
            <span className="text-sm text-emerald-400/80 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              AI Engine reads this live
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
