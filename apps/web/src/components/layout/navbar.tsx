import Link from "next/link";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
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
          
          <SignedOut>
            <li>
              <SignInButton mode="modal">
                <button className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                  Login
                </button>
              </SignInButton>
            </li>
            <li>
              <SignUpButton mode="modal">
                <button className="text-sm font-medium text-slate-600 transition-colors hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100">
                  Sign Up
                </button>
              </SignUpButton>
            </li>
          </SignedOut>
          <SignedIn>
            <li>
              <UserButton afterSignOutUrl="/" />
            </li>
          </SignedIn>

          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
