"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import React from "react";

export function ClerkThemeProvider({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: resolvedTheme === "dark" ? dark : undefined,
        variables: { 
          colorPrimary: '#6366f1',
          colorBackground: resolvedTheme === "dark" ? '#020617' : undefined,
        },
        elements: resolvedTheme === "dark" ? {
          card: 'bg-slate-950 border border-white/10 shadow-2xl',
          headerTitle: 'text-white',
          headerSubtitle: 'text-slate-400',
          socialButtonsBlockButton: 'border-white/10 hover:bg-white/5 text-slate-300',
          socialButtonsBlockButtonText: 'text-slate-300 font-medium',
          formButtonPrimary: 'bg-indigo-500 hover:bg-indigo-400 text-white',
          formFieldInput: 'bg-slate-900 border-white/10 text-slate-200 focus:border-indigo-500',
          formFieldLabel: 'text-slate-400',
          footerActionLink: 'text-indigo-400 hover:text-indigo-300',
          dividerLine: 'bg-white/10',
          dividerText: 'text-slate-500',
          formFieldAction: 'text-indigo-400 hover:text-indigo-300',
        } : undefined
      }}
    >
      {children}
    </ClerkProvider>
  );
}
