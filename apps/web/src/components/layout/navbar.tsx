"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/history", label: "History" },
  { href: "/personas", label: "Personas" },
  { href: "/profile", label: "Profile" },
];

export function Navbar() {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up");

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
          
          {!isAuthPage && (
            <Show when="signed-out">
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
            </Show>
          )}
          <Show when="signed-in">
            <li>
              <UserButton />
            </li>
          </Show>

          </ul>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
