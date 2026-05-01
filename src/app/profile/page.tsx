"use client";

import { useEffect, useState } from "react";
import { toast } from "@/lib/toast";

type ProfileData = {
  display_name: string;
  bio: string;
  skills: string;
  hourly_rate: string;
  experience_years: number | null;
};

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileData>({
    display_name: "",
    bio: "",
    skills: "",
    hourly_rate: "",
    experience_years: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/preferences");
        if (!res.ok) return;
        const data = (await res.json()) as Partial<ProfileData>;
        setForm({
          display_name: data.display_name ?? "",
          bio: data.bio ?? "",
          skills: data.skills ?? "",
          hourly_rate: data.hourly_rate ?? "",
          experience_years: data.experience_years ?? null,
        });
      } finally {
        setLoading(false);
      }
    }
    void fetchProfile();
  }, []);

  function handleChange(field: keyof ProfileData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          display_name: form.display_name,
          bio: form.bio,
          skills: form.skills,
          hourly_rate: form.hourly_rate,
          experience_years: form.experience_years !== null && form.experience_years !== undefined
            ? Number(form.experience_years)
            : null,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast.error(data.error ?? "Failed to save profile");
        return;
      }
      toast.success("Profile saved");
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 rounded-xl border border-slate-200 bg-white p-10 dark:border-slate-700 dark:bg-slate-900/80">
        <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="h-8 w-48 rounded bg-slate-200 dark:bg-slate-700" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded bg-slate-200 dark:bg-slate-700" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-10 dark:border-slate-700 dark:bg-slate-900/80">
      <p className="text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Settings</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Your profile</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        This information is injected into the AI prompt to personalize every proposal you generate.
      </p>

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Display name
            </label>
            <input
              type="text"
              value={form.display_name}
              onChange={(e) => handleChange("display_name", e.target.value)}
              placeholder="e.g. Alex Johnson"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Hourly rate
            </label>
            <input
              type="text"
              value={form.hourly_rate}
              onChange={(e) => handleChange("hourly_rate", e.target.value)}
              placeholder="e.g. $85/hr or $60–100/hr"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Years of experience
            </label>
            <input
              type="number"
              min={0}
              max={60}
              value={form.experience_years ?? ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  experience_years: e.target.value === "" ? null : Number(e.target.value),
                }))
              }
              placeholder="e.g. 7"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Core skills
            </label>
            <input
              type="text"
              value={form.skills}
              onChange={(e) => handleChange("skills", e.target.value)}
              placeholder="e.g. React, Node.js, TypeScript, PostgreSQL"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Professional background
          </label>
          <textarea
            value={form.bio}
            onChange={(e) => handleChange("bio", e.target.value)}
            rows={4}
            placeholder="Brief summary of your background, niche, and what makes you different…"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {saving ? "Saving..." : "Save profile"}
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Profile data is only used to improve your generated proposals.
          </p>
        </div>
      </form>
    </section>
  );
}
