"use client";

import { useState, useRef } from "react";
import { toast } from "@/lib/toast";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { TagsInput } from "./tags-input";
import { SUGGESTED_SKILLS, SUGGESTED_COMPANIES } from "@/lib/constants";
import { clearPersonasCache } from "@/hooks/use-personas";
import { useUpgradeModal } from "@/context/upgrade-modal-context";

type Persona = {
  id: string;
  name: string;
  skills: string[];
  yearsOfExperience: number;
  resumeText: string;
  dreamCompanies?: string[];
  jobFilters?: any;
};

type PersonaFormProps = {
  initialData?: Persona;
  onSuccess?: () => void;
  onCancel?: () => void;
};

const REGIONS = ["Remote Worldwide", "United States", "Europe", "Middle East", "Asia"];
const EMPLOYMENT_TYPES = ["Full-Time (W2)", "Contract", "Freelance/1099", "Part-Time"];
const EXPERIENCE_LEVELS = ["Junior (0-2y)", "Mid-Level (3-5y)", "Senior (6-9y)", "Staff/Lead (10y+)"];
const COMPANY_SIZES = ["Early-stage Startup (1-50)", "Mid-size (51-500)", "Enterprise (500+)"];
const INDUSTRIES = ["FinTech / Crypto", "Healthcare / MedTech", "E-Commerce", "AI / Machine Learning", "SaaS / B2B", "Developer Tools"];

export function PersonaForm({ initialData, onSuccess, onCancel }: PersonaFormProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const { openModal } = useUpgradeModal();
  
  const [name, setName] = useState(initialData?.name || "");
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">(initialData?.yearsOfExperience || "");
  const [resumeText, setResumeText] = useState(initialData?.resumeText || "");
  const [dreamCompanies, setDreamCompanies] = useState<string[]>(initialData?.dreamCompanies || []);
  const [jobFilters, setJobFilters] = useState<any>(initialData?.jobFilters || {
    targetRegions: [],
    employmentTypes: [],
    experienceLevels: [],
    companySizes: [],
    industries: [],
    salaryFloor: "",
  });
  const [loading, setLoading] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Only PDF files are supported");
      return;
    }
    
    setUploadingPdf(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${apiUrl}/api/profile/parse-pdf`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to parse PDF");
      const data = await res.json();
      if (data.text) {
        setResumeText(data.text);
        toast.success("Resume text extracted successfully");
      }
    } catch (err) {
      toast.error("Failed to parse PDF");
    } finally {
      setUploadingPdf(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFilterToggle(field: string, value: string) {
    setJobFilters((prev: any) => {
      const current = prev[field] || [];
      const isSelected = current.includes(value);
      return {
        ...prev,
        [field]: isSelected 
          ? current.filter((item: string) => item !== value)
          : [...current, value]
      };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Persona name is required");
      return;
    }
    if (skills.length < 5) {
      toast.error("At least 5 skills are required for accurate matching");
      return;
    }
    if (typeof yearsOfExperience !== 'number') {
      toast.error("Years of Experience is required");
      return;
    }
    if (!resumeText.trim() || resumeText.trim().length < 10) {
      toast.error("A professional bio (min 10 chars) is required");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const payload = {
        name: name.trim(),
        skills,
        yearsOfExperience: typeof yearsOfExperience === 'number' ? yearsOfExperience : undefined,
        resumeText: resumeText.trim() || undefined,
        dreamCompanies,
        jobFilters,
      };

      const res = await fetch(
        initialData?.id ? `${apiUrl}/api/personas/${initialData.id}` : `${apiUrl}/api/personas`,
        {
          method: initialData?.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        }
      );

      if (res.status === 402) {
        openModal("You've reached your free plan limit for Personas. Upgrade to Pro to create multiple personas.");
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to save persona");
      }

      clearPersonasCache(); // Clear the global cache so Dashboard dropdown updates
      toast.success(`Persona ${initialData ? "updated" : "created"}!`);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (error) {
      toast.error("Failed to save persona");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-[#0A0A0B] p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-xl">
      <div>
        <label htmlFor="persona-name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Persona Name <span className="text-rose-500">*</span>
        </label>
        <input
          id="persona-name"
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Senior React Developer"
          required
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          The AI uses this title as the main context for evaluating job fit.
        </p>
      </div>

      <div>
        <label htmlFor="persona-skills" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Core Skills <span className="text-rose-500">*</span>
        </label>
        <TagsInput
          value={skills}
          onChange={setSkills}
          suggestions={SUGGESTED_SKILLS}
          placeholder="e.g. React, Node.js, Python"
          theme="amber"
        />
        <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          Required. The more skills you add, the better the job matches. Please add at least 5 skills for the AI to calculate an accurate fit score.
        </p>
      </div>

      <div>
        <label htmlFor="persona-dream-companies" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Target Companies
        </label>
        <TagsInput 
          value={dreamCompanies} 
          onChange={setDreamCompanies} 
          suggestions={SUGGESTED_COMPANIES}
          placeholder="e.g. Stripe, Vercel, OpenAI"
          theme="indigo"
        />
        <p className="mt-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400">
          Jobs matching any of these target companies will get a massive score boost. Supports regex intelligently.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">

        <div>
          <label htmlFor="persona-experience" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Years of Experience <span className="text-rose-500">*</span>
          </label>
          <select
            id="persona-experience"
            value={yearsOfExperience}
            onChange={e => setYearsOfExperience(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select Experience</option>
            <option value={0}>Less than 1 year</option>
            <option value={1}>1 year</option>
            <option value={2}>2 years</option>
            <option value={3}>3 years</option>
            <option value={4}>4 years</option>
            <option value={5}>5+ years</option>
            <option value={10}>10+ years</option>
            <option value={15}>15+ years</option>
          </select>
          <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            Required. Essential for preventing the AI from matching you with roles outside your seniority level.
          </p>
        </div>

        <div>
          <label htmlFor="persona-compensation" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Compensation Floor
          </label>
          <select
            id="persona-compensation"
            value={jobFilters.salaryFloor || ""}
            onChange={(e) => setJobFilters((prev: any) => ({ ...prev, salaryFloor: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">No minimum requirement</option>
            <option value="$50k / year ($25/hr)">$50,000+ / year ($25/hr)</option>
            <option value="$75k / year ($35/hr)">$75,000+ / year ($35/hr)</option>
            <option value="$100k / year ($50/hr)">$100,000+ / year ($50/hr)</option>
            <option value="$125k / year ($60/hr)">$125,000+ / year ($60/hr)</option>
            <option value="$150k / year ($75/hr)">$150,000+ / year ($75/hr)</option>
            <option value="$200k / year ($100/hr)">$200,000+ / year ($100/hr)</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Helps the AI score budget fit.
          </p>
        </div>
      </div>

      <div className="pt-4 pb-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-200 dark:border-white/10 pb-2">Job Match Filters</h3>
        
        {/* Target Regions */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Target Regions</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {REGIONS.map(region => (
              <label key={region} onClick={() => handleFilterToggle('targetRegions', region)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                jobFilters.targetRegions?.includes(region) 
                  ? "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-500/10" 
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  jobFilters.targetRegions?.includes(region) ? "bg-emerald-500 border-emerald-500" : "border-slate-300 dark:border-white/20"
                }`}>
                  {jobFilters.targetRegions?.includes(region) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{region}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Employment Types */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Employment Types</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {EMPLOYMENT_TYPES.map(type => (
              <label key={type} onClick={() => handleFilterToggle('employmentTypes', type)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                jobFilters.employmentTypes?.includes(type) 
                  ? "border-indigo-500/50 bg-indigo-50 dark:bg-indigo-500/10" 
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  jobFilters.employmentTypes?.includes(type) ? "bg-indigo-500 border-indigo-500" : "border-slate-300 dark:border-white/20"
                }`}>
                  {jobFilters.employmentTypes?.includes(type) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Experience Levels */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Experience Levels</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EXPERIENCE_LEVELS.map(level => (
              <label key={level} onClick={() => handleFilterToggle('experienceLevels', level)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                jobFilters.experienceLevels?.includes(level) 
                  ? "border-amber-500/50 bg-amber-50 dark:bg-amber-500/10" 
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  jobFilters.experienceLevels?.includes(level) ? "bg-amber-500 border-amber-500" : "border-slate-300 dark:border-white/20"
                }`}>
                  {jobFilters.experienceLevels?.includes(level) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{level}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Company Sizes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Company Sizes</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {COMPANY_SIZES.map(size => (
              <label key={size} onClick={() => handleFilterToggle('companySizes', size)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                jobFilters.companySizes?.includes(size) 
                  ? "border-sky-500/50 bg-sky-50 dark:bg-sky-500/10" 
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  jobFilters.companySizes?.includes(size) ? "bg-sky-500 border-sky-500" : "border-slate-300 dark:border-white/20"
                }`}>
                  {jobFilters.companySizes?.includes(size) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{size}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Industries */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Industries</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {INDUSTRIES.map(ind => (
              <label key={ind} onClick={() => handleFilterToggle('industries', ind)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${
                jobFilters.industries?.includes(ind) 
                  ? "border-fuchsia-500/50 bg-fuchsia-50 dark:bg-fuchsia-500/10" 
                  : "border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5"
              }`}>
                <div className={`w-4 h-4 rounded flex items-center justify-center border ${
                  jobFilters.industries?.includes(ind) ? "bg-fuchsia-500 border-fuchsia-500" : "border-slate-300 dark:border-white/20"
                }`}>
                  {jobFilters.industries?.includes(ind) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{ind}</span>
              </label>
            ))}
          </div>
        </div>

      </div>

      <div>
        <div className="flex justify-between items-end mb-1.5">
          <label htmlFor="persona-resume" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
            Professional Bio / Background <span className="text-rose-500">*</span>
          </label>
          <div>
            <input
              type="file"
              accept="application/pdf"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPdf}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 disabled:opacity-50"
            >
              {uploadingPdf ? (
                <>
                  <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Extracting...
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Upload PDF Resume
                </>
              )}
            </button>
          </div>
        </div>
        <textarea
          id="persona-resume"
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Paste a short bio, your background story, or a base resume..."
          rows={6}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
        />
        <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          Required. This is the most critical field. The AI relies heavily on this background context to write highly personalized proposals.
        </p>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition border border-slate-200 dark:border-white/10"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 shadow-lg shadow-indigo-500/25 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Persona"}
        </button>
      </div>
    </form>
  );
}
