import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/layout/theme-toggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
      <nav className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          Proposalio
        </Link>
        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-6">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              >
                {link.label}
              </Link>
            </li>
          ))}
          {user ? (
            <li>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
                >
                  Logout
                </button>
              </form>
            </li>
          ) : (
            <li>
              <Link
                href="/login"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100"
              >
                Login
              </Link>
            </li>
          )}
          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
