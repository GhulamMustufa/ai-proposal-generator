import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkThemeProvider } from "@/components/providers/clerk-theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-proposal-generator-chi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "PitchPilot — The AI-Powered Copilot for Remote Freelancers",
    template: "%s | PitchPilot",
  },
  description:
    "Generate winning proposals for remote jobs in seconds with AI. Tailored to your profile, your writing style, and the job description.",
  keywords: [
    "remote job proposal",
    "freelance cover letter",
    "AI proposal generator",
    "freelance proposal writer",
    "AI writing tool for freelancers",
  ],
  authors: [{ name: "PitchPilot" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "PitchPilot",
    title: "PitchPilot — The AI-Powered Copilot for Remote Freelancers",
    description:
      "Generate winning proposals for remote jobs in seconds with AI. Tailored to your profile, your writing style, and the job description.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "PitchPilot — AI Proposal Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "PitchPilot — The AI-Powered Copilot for Remote Freelancers",
    description:
      "Generate winning proposals for remote jobs in seconds with AI. Tailored to your profile, your writing style, and the job description.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <ClerkThemeProvider>
            <Navbar />
            <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
            <Toaster />
          </ClerkThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
