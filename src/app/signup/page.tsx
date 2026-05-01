import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { signup } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

type SignupPageProps = {
  searchParams: {
    error?: string;
  };
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <AuthForm title="Sign up" actionLabel="Create account" action={signup} error={searchParams.error} />
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Login
        </Link>
      </p>
    </div>
  );
}
