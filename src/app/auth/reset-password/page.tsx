"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="space-y-4">
      <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900/80">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Set new password</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Choose a strong password for your account.</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-200 placeholder:text-slate-400 focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-slate-600"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-200 placeholder:text-slate-400 focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-slate-600"
            />
          </label>
          {error && (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
