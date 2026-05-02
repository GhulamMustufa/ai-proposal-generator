import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Proposalio privacy policy — how we collect, use, and protect your data.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl py-12">
      <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
      <p className="mb-10 text-sm text-slate-500">Last updated: May 2, 2026</p>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">What we collect</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-600 dark:text-slate-400">
          <li><strong>Email and password</strong> — used to create and authenticate your account via Supabase.</li>
          <li><strong>Profile information</strong> — display name, bio, skills, hourly rate, and experience years that you optionally enter. Used only to personalize your proposals.</li>
          <li><strong>Job descriptions and proposals</strong> — the job text you generate proposals for, and the resulting proposals, are stored in your account history.</li>
          <li><strong>Usage data</strong> — request counts are logged for rate limiting. No behavioral tracking or analytics beyond this.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">How we use it</h2>
        <ul className="list-disc space-y-2 pl-5 text-slate-600 dark:text-slate-400">
          <li>Job descriptions are sent to <strong>OpenAI</strong> to generate proposals. OpenAI&apos;s data usage policy applies to this content.</li>
          <li>Your profile and proposals are stored in <strong>Supabase</strong> (hosted on AWS). All data is scoped to your account and protected by row-level security.</li>
          <li>We do not sell, share, or rent your data to any third party.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">Chrome extension</h2>
        <p className="text-slate-600 dark:text-slate-400">
          The Proposalio Chrome extension runs only on <code className="rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800">upwork.com</code> pages.
          It reads the job title and description from the page to pre-fill the proposal generator.
          No data from your Upwork account is stored — only the job text you explicitly choose to generate a proposal for.
          Your login token is stored locally in <code className="rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800">chrome.storage.local</code> on your device and is never transmitted to anyone other than Supabase for authentication.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">Data retention and deletion</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Your proposals and profile data are retained as long as your account exists. To delete your account and all associated data, email us at the address below and we will remove it within 7 days.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">Cookies</h2>
        <p className="text-slate-600 dark:text-slate-400">
          We use a single session cookie set by Supabase to keep you logged in. No advertising or tracking cookies are used.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-800 dark:text-slate-200">Contact</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Questions or deletion requests: <a href="mailto:ghulam@lumida.com" className="text-indigo-600 underline dark:text-indigo-400">ghulam@lumida.com</a>
        </p>
      </section>
    </div>
  );
}
