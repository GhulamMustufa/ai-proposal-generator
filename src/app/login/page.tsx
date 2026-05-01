import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { login } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams: {
    error?: string;
    next?: string;
  };
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-4">
      <AuthForm
        title="Login"
        actionLabel="Sign in"
        action={login}
        error={searchParams.error}
        next={searchParams.next}
        showForgotPassword
      />
      <p className="text-center text-sm text-slate-600 dark:text-slate-300">
        No account yet?{" "}
        <Link href="/signup" className="font-medium text-slate-900 hover:underline dark:text-slate-100">
          Create one
        </Link>
      </p>
    </div>
  );
}
