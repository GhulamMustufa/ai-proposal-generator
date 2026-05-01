import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requestPasswordReset } from "@/app/auth/actions";

type ForgotPasswordPageProps = {
  searchParams: { error?: string; success?: string };
};

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="space-y-4">
      <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900/80">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">Reset password</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        {searchParams.success ? (
          <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200">
            Check your inbox — a reset link is on its way.
          </div>
        ) : (
          <form action={requestPasswordReset} className="mt-6 flex flex-col gap-4">
            <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-200 placeholder:text-slate-400 focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-slate-600"
              />
            </label>
            {searchParams.error && (
              <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {searchParams.error}
              </p>
            )}
            <button
              type="submit"
              className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Send reset link
            </button>
          </form>
        )}
      </section>

      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        <Link href="/login" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Back to login
        </Link>
      </p>
    </div>
  );
}
