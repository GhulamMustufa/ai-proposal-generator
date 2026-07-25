"use client";

import { useState } from "react";
import { toast } from "@/lib/toast";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type Persona = {
  id: string;
  name: string;
  skills: string[];
  idealSalary: string;
  yearsOfExperience: number;
  resumeText: string;
};

type PersonaFormProps = {
  initialData?: Persona;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function PersonaForm({ initialData, onSuccess, onCancel }: PersonaFormProps) {
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [name, setName] = useState(initialData?.name || "");
  const [skillsStr, setSkillsStr] = useState(initialData?.skills?.join(", ") || "");
  const [idealSalary, setIdealSalary] = useState(initialData?.idealSalary || "");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">(initialData?.yearsOfExperience || "");
  const [resumeText, setResumeText] = useState(initialData?.resumeText || "");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Persona name is required");
      return;
    }

    setLoading(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const payload = {
        name: name.trim(),
        skills: skillsStr.split(",").map(s => s.trim()).filter(Boolean),
        idealSalary: idealSalary.trim() || undefined,
        yearsOfExperience: typeof yearsOfExperience === 'number' ? yearsOfExperience : undefined,
        resumeText: resumeText.trim() || undefined,
      };

      const res = await fetch(
        initialData ? `${apiUrl}/api/personas/${initialData.id}` : `${apiUrl}/api/personas`,
        {
          method: initialData ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to save persona");
      }

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
          placeholder="e.g. Senior Frontend Developer"
          required
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          The AI uses this title as the main context for evaluating job fit.
        </p>
      </div>

      <div>
        <label htmlFor="persona-skills" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Skills (comma separated)
        </label>
        <input
          id="persona-skills"
          type="text"
          value={skillsStr}
          onChange={e => setSkillsStr(e.target.value)}
          placeholder="e.g. React, TypeScript, Node.js"
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
        <p className="mt-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
          CRITICAL: The AI automatically rejects jobs that don't mention at least 3 of these skills. List your core technologies.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="persona-ideal-salary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Ideal Salary
          </label>
          <select
            id="persona-ideal-salary"
            value={idealSalary}
            onChange={e => setIdealSalary(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">Select Salary Range</option>
            <option value="<$50,000/yr">&lt;$50,000/yr</option>
            <option value="$50,000 - $75,000/yr">$50,000 - $75,000/yr</option>
            <option value="$75,000 - $100,000/yr">$75,000 - $100,000/yr</option>
            <option value="$100,000 - $150,000/yr">$100,000 - $150,000/yr</option>
            <option value="$150,000 - $200,000/yr">$150,000 - $200,000/yr</option>
            <option value="$200,000+/yr">$200,000+/yr</option>
          </select>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Helps the AI score budget fit.
          </p>
        </div>
        <div>
          <label htmlFor="persona-experience" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Years of Experience
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
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            Helps the AI avoid jobs where you are overqualified or underqualified.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="persona-resume" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Professional Bio / Background
        </label>
        <textarea
          id="persona-resume"
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Paste a short bio, your background story, or a base resume..."
          rows={6}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
        />
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          The AI uses this to judge deep role fit, and relies on it heavily to write your highly personalized proposals.
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
