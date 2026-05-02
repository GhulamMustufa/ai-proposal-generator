import type { Metadata } from "next";
import { Navbar } from "@/components/layout/navbar";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ai-proposal-generator-chi.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Proposalio — AI Proposal Generator for Upwork Freelancers",
    template: "%s | Proposalio",
  },
  description:
    "Generate winning Upwork proposals in seconds with AI. Tailored to your profile, your writing style, and the job. Free to start.",
  keywords: [
    "upwork proposal",
    "upwork cover letter",
    "AI proposal generator",
    "freelance proposal writer",
    "upwork proposal template",
    "AI writing tool for freelancers",
  ],
  authors: [{ name: "Proposalio" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "Proposalio",
    title: "Proposalio — AI Proposal Generator for Upwork Freelancers",
    description:
      "Generate winning Upwork proposals in seconds with AI. Tailored to your profile, your writing style, and the job.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Proposalio — AI Proposal Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Proposalio — AI Proposal Generator for Upwork Freelancers",
    description:
      "Generate winning Upwork proposals in seconds with AI. Tailored to your profile, your writing style, and the job.",
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
          <Navbar />
          <main className="mx-auto w-full max-w-5xl px-6 py-10">{children}</main>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
