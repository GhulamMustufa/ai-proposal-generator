"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "@/lib/toast";

type JobFilters = {
  targetRegions: string[];
  employmentTypes: string[];
  salaryFloor: string;
  experienceLevels: string[];
  companySizes: string[];
  industries: string[];
};

export default function ProfilePage() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  
  const [filters, setFilters] = useState<JobFilters>({
    targetRegions: [],
    employmentTypes: [],
    salaryFloor: "",
    experienceLevels: [],
    companySizes: [],
    industries: [],
  });
  
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState("");
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Constants for checkboxes
  const REGIONS = ["Remote Worldwide", "United States", "Europe", "Middle East", "Asia"];
  const EMPLOYMENT_TYPES = ["Full-Time (W2)", "Contract", "Freelance/1099", "Part-Time"];
  const EXPERIENCE_LEVELS = ["Junior (0-2y)", "Mid-Level (3-5y)", "Senior (6-9y)", "Staff/Lead (10y+)"];
  const COMPANY_SIZES = ["Early-stage Startup (1-50)", "Mid-size (51-500)", "Enterprise (500+)"];
  const INDUSTRIES = ["FinTech / Crypto", "Healthcare / MedTech", "E-Commerce", "AI / Machine Learning", "SaaS / B2B", "Developer Tools"];

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
              experienceLevels: data.jobFilters.experienceLevels || [],
              companySizes: data.jobFilters.companySizes || [],
              industries: data.jobFilters.industries || [],
            });
          }
          if (data && data.skills) {
            setSkills(data.skills);
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

  function handleFilterToggle(field: 'experienceLevels' | 'companySizes' | 'industries', value: string) {
    setFilters(prev => {
      const isSelected = prev[field].includes(value);
      return {
        ...prev,
        [field]: isSelected 
          ? prev[field].filter(item => item !== value)
          : [...prev[field], value]
      };
    });
  }

  function handleAddSkill(e: React.KeyboardEvent<HTMLInputElement> | React.MouseEvent<HTMLButtonElement>) {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (!newSkill.trim()) return;
    if (skills.includes(newSkill.trim())) return;
    
    setSkills([...skills, newSkill.trim()]);
    setNewSkill("");
  }

  function handleRemoveSkill(skillToRemove: string) {
    setSkills(skills.filter(skill => skill !== skillToRemove));
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

      const skillsRes = await fetch(`${apiUrl}/api/profile/skills`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ skills }),
      });
      
      if (!res.ok || !skillsRes.ok) {
        toast.error("Failed to save profile");
        return;
      }
      
      toast.success("Job filters and skills successfully updated.");
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-200 p-8">
        <div className="animate-pulse space-y-6 max-w-2xl mx-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-10">
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-96 rounded bg-slate-200 dark:bg-white/10" />
          <div className="space-y-4 pt-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200 dark:bg-white/10" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Job Matching Filters</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Configure your preferences. The AI Matcher will strictly adhere to these rules when scoring jobs, ignoring any listings that don't meet your criteria.
          </p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Core Skills */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Core Skills</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">These are the skills the AI will use to match you with jobs. We require at least 3 matching skills for a job to pass.</p>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {skills.map((skill, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">
                  {skill}
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSkill(skill)}
                    className="ml-1 rounded-full p-0.5 hover:bg-emerald-500/20 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              {skills.length === 0 && (
                <span className="text-sm text-slate-400 italic">No skills added yet.</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={handleAddSkill}
                placeholder="e.g., React.js, Node.js, TypeScript"
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-emerald-500/50 focus:bg-slate-100 dark:focus:bg-white/10 focus:ring-1 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="rounded-xl bg-emerald-500 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-emerald-400 shadow-lg shadow-emerald-500/25 shrink-0"
              >
                Add Skill
              </button>
            </div>
          </section>

          {/* Target Regions */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Target Regions</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Select the geographic areas you are eligible to work in.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {REGIONS.map(region => (
                <label key={region} onClick={() => handleRegionToggle(region)} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  filters.targetRegions.includes(region) 
                    ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10 shadow-[0_0_15px_rgba(52,211,153,0.1)]" 
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    filters.targetRegions.includes(region) ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-white/20"
                  }`}>
                    {filters.targetRegions.includes(region) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-white">{region}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Employment Types */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Employment Type</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">What type of contracts are you looking for?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EMPLOYMENT_TYPES.map(type => (
                <label key={type} onClick={() => handleTypeToggle(type)} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  filters.employmentTypes.includes(type) 
                    ? "border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.1)]" 
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    filters.employmentTypes.includes(type) ? "bg-indigo-500 border-indigo-500" : "border-slate-300 dark:border-white/20"
                  }`}>
                    {filters.employmentTypes.includes(type) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-white">{type}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Experience Levels */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Experience Level</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Filter out jobs that require significantly more or less experience than you have.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {EXPERIENCE_LEVELS.map(level => (
                <label key={level} onClick={() => handleFilterToggle('experienceLevels', level)} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  filters.experienceLevels.includes(level) 
                    ? "border-amber-500/50 bg-amber-50 dark:bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.1)]" 
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    filters.experienceLevels.includes(level) ? "bg-amber-500 border-amber-500" : "border-slate-300 dark:border-white/20"
                  }`}>
                    {filters.experienceLevels.includes(level) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-white">{level}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Company Sizes */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Company Size</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Do you prefer fast-paced startups or stable enterprises?</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COMPANY_SIZES.map(size => (
                <label key={size} onClick={() => handleFilterToggle('companySizes', size)} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  filters.companySizes.includes(size) 
                    ? "border-sky-500/50 bg-sky-50 dark:bg-sky-500/10 shadow-[0_0_15px_rgba(14,165,233,0.1)]" 
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    filters.companySizes.includes(size) ? "bg-sky-500 border-sky-500" : "border-slate-300 dark:border-white/20"
                  }`}>
                    {filters.companySizes.includes(size) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-white">{size}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Industries */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Preferred Industries</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Select your favorite niches. The AI will boost jobs matching these industries.</p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {INDUSTRIES.map(ind => (
                <label key={ind} onClick={() => handleFilterToggle('industries', ind)} className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer border transition-all ${
                  filters.industries.includes(ind) 
                    ? "border-fuchsia-500/50 bg-fuchsia-50 dark:bg-fuchsia-500/10 shadow-[0_0_15px_rgba(217,70,239,0.1)]" 
                    : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10"
                }`}>
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${
                    filters.industries.includes(ind) ? "bg-fuchsia-500 border-fuchsia-500" : "border-slate-300 dark:border-white/20"
                  }`}>
                    {filters.industries.includes(ind) && (
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-white">{ind}</span>
                </label>
              ))}
            </div>
          </section>

          {/* Salary Floor */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Compensation Floor</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Jobs with listed compensation below this will be penalized by the matcher.</p>
            
            <div>
              <select
                value={filters.salaryFloor}
                onChange={(e) => setFilters(prev => ({ ...prev, salaryFloor: e.target.value }))}
                className="w-full appearance-none rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-indigo-500/50 focus:bg-slate-100 dark:focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50"
              >
                <option value="">No minimum requirement</option>
                <option value="$50k / year ($25/hr)">$50,000+ / year ($25/hr)</option>
                <option value="$75k / year ($35/hr)">$75,000+ / year ($35/hr)</option>
                <option value="$100k / year ($50/hr)">$100,000+ / year ($50/hr)</option>
                <option value="$125k / year ($60/hr)">$125,000+ / year ($60/hr)</option>
                <option value="$150k / year ($75/hr)">$150,000+ / year ($75/hr)</option>
                <option value="$200k / year ($100/hr)">$200,000+ / year ($100/hr)</option>
              </select>
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
            <span className="text-sm text-emerald-600 dark:text-emerald-400/80 flex items-center gap-2">
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
