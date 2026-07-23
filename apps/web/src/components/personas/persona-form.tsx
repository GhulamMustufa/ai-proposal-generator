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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label htmlFor="persona-ideal-salary" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Ideal Salary
          </label>
          <input
            id="persona-ideal-salary"
            type="text"
            value={idealSalary}
            onChange={e => setIdealSalary(e.target.value)}
            placeholder="e.g. $120,000/yr"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label htmlFor="persona-experience" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Years of Experience
          </label>
          <input
            id="persona-experience"
            type="number"
            value={yearsOfExperience}
            onChange={e => setYearsOfExperience(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="e.g. 5"
            className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="persona-resume" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          Resume Details / Base Cover Letter
        </label>
        <textarea
          id="persona-resume"
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Paste your base resume or generic cover letter here..."
          rows={6}
          className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-y"
        />
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
