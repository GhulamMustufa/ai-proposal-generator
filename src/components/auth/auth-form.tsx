import Link from "next/link";

type AuthFormProps = {
  title: string;
  actionLabel: string;
  action: (formData: FormData) => Promise<void>;
  error?: string;
  next?: string;
  showForgotPassword?: boolean;
};

export function AuthForm({ title, actionLabel, action, error, next, showForgotPassword }: AuthFormProps) {
  return (
    <section className="mx-auto w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-700 dark:bg-slate-900/80">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">{title}</h1>
      <form action={action} className="mt-6 flex flex-col gap-4">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <label className="flex flex-col gap-1 text-sm font-medium text-slate-700 dark:text-slate-300">
          Email
          <input
            name="email"
            type="email"
            required
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-200 placeholder:text-slate-400 focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-slate-600"
            placeholder="you@example.com"
          />
        </label>
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</span>
            {showForgotPassword && (
              <Link
                href="/forgot-password"
                className="text-xs text-slate-500 hover:text-slate-900 hover:underline dark:text-slate-400 dark:hover:text-slate-100"
              >
                Forgot password?
              </Link>
            )}
          </div>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            className="rounded-md border border-slate-300 px-3 py-2 text-slate-900 outline-none ring-slate-200 placeholder:text-slate-400 focus:ring dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-slate-600"
            placeholder="••••••••"
          />
        </div>
        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <button
          type="submit"
          className="mt-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {actionLabel}
        </button>
      </form>
    </section>
  );
}
