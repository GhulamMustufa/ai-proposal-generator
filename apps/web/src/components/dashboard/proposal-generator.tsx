"use client";

import { FormEvent, useMemo, useState } from "react";
import { toast } from "@/lib/toast";
import { useAuth } from "@clerk/nextjs";
import { usePersonas } from "@/hooks/use-personas";
import { JobAnalyzerWidget } from "./job-analyzer-widget";

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const MAX_VOICE_SAMPLES = 3;

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className={`rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
        copied
          ? "scale-95 border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
      }`}
    >
      {copied ? "✓ Copied" : "Copy"}
    </button>
  );
}

export function ProposalGenerator({ initialPersonaId }: { initialPersonaId?: string }) {
  const { getToken } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [voiceSamples, setVoiceSamples] = useState<string[]>(["", "", ""]);
  const [generatedProposal, setGeneratedProposal] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [twoVariations, setTwoVariations] = useState(false);
  const { personas } = usePersonas();
  const [selectedPersonaId, setSelectedPersonaId] = useState(initialPersonaId || "");

  // Update selected if initial changes (e.g. from nav)
  useMemo(() => {
    if (initialPersonaId && !selectedPersonaId) setSelectedPersonaId(initialPersonaId);
  }, [initialPersonaId]);

  const activeSamples = useMemo(
    () => voiceSamples.map((sample) => sample.trim()).filter(Boolean),
    [voiceSamples],
  );

  function getErrorMessage(err: unknown) {
    if (typeof err === "string") return err;
    if (typeof err === "object" && err !== null) {
      const message = (err as { message?: unknown }).message;
      if (typeof message === "string") return message;
    }
    return "Unable to generate proposal.";
  }

  async function handleGenerate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGeneratedProposal("");

    if (!jobDescription.trim()) {
      toast.error("Please add a job description.");
      return;
    }

    setIsGenerating(true);

    try {
      const token = await getToken();
      const response = await fetch(`${apiUrl}/api/proposals/generate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          job_description: jobDescription,
          voice_samples: activeSamples,
          two_variations: twoVariations,
          stream: !twoVariations,
          personaId: selectedPersonaId || undefined,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as {
          error?: string | { code?: string; message?: string };
        };
        toast.error(getErrorMessage(data.error));
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("text/plain") && response.body) {
        // Streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let raw = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });

          // Show text up to but not including the DONE sentinel
          const sentinelIdx = raw.indexOf("\n\n[DONE:");
          const display = sentinelIdx >= 0 ? raw.slice(0, sentinelIdx) : raw;
          setGeneratedProposal(display.trim());
        }

        // Final cleanup after stream closes
        const sentinelIdx = raw.indexOf("\n\n[DONE:");
        const finalText = sentinelIdx >= 0 ? raw.slice(0, sentinelIdx).trim() : raw.trim();
        setGeneratedProposal(finalText);
        toast.success("Proposal generated");
      } else {
        // JSON response (two_variations or cached)
        const data = (await response.json()) as {
          error?: string | { code?: string; message?: string };
          generated_proposal?: string;
        };

        if (!data.generated_proposal) {
          toast.error(getErrorMessage(data.error));
          return;
        }

        setGeneratedProposal(data.generated_proposal);
        toast.success("Proposal generated");
      }
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleGenerate}
        className="space-y-8 rounded-2xl border border-slate-200/70 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80"
      >
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">1. Persona Selection</h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Select a persona to inject your verified skills and resume background. The AI uses this to prevent hallucinating false credentials.
          </p>
          {personas.length > 0 ? (
            <select
              value={selectedPersonaId}
              onChange={(e) => setSelectedPersonaId(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:ring-indigo-500/20"
            >
              <option value="">-- Optional: Select a Persona (Uses default profile if none) --</option>
              {personas.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-slate-500">No personas found. Fallback to base profile will be used.</p>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">2. Job Input</h2>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300">
              Core Context
            </span>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={12}
              placeholder="Paste the job description or URL text..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
            />
            <JobAnalyzerWidget jobDescription={jobDescription} />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">3. Voice Samples</h2>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Paste 1-3 previous proposals that successfully got you hired. The AI will analyze them to mimic your sentence structure, vocabulary, and tone so the final output sounds exactly like you wrote it.
          </p>
          <div className="space-y-3">
            {voiceSamples.map((sample, index) => (
              <textarea
                key={index}
                value={sample}
                onChange={(event) => {
                  const next = [...voiceSamples];
                  next[index] = event.target.value;
                  setVoiceSamples(next);
                }}
                rows={4}
                placeholder={`Sample ${index + 1} (optional)`}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-indigo-100 transition placeholder:text-slate-400 focus:ring-4 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-400 dark:ring-indigo-500/20"
              />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">4. Generate</h2>
          <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <input
              type="checkbox"
              checked={twoVariations}
              onChange={(event) => setTwoVariations(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            Return two proposal variations
          </label>
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full sm:w-auto rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {isGenerating ? "Generating..." : "Generate Premium Proposal"}
          </button>
        </section>
      </form>

      <section className="space-y-3 rounded-2xl border border-slate-200/70 bg-white/90 p-8 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">5. Output</h2>
          <CopyButton text={generatedProposal} />
        </div>
        <div className="relative min-h-48 whitespace-pre-wrap rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-sm leading-6 text-slate-800 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-100">
          {generatedProposal || (
            <span className="text-slate-400 dark:text-slate-500">
              {isGenerating ? (
                <span className="inline-flex items-center gap-1.5">
                  <span className="animate-pulse">Generating</span>
                  <span className="inline-flex gap-0.5">
                    <span className="animate-bounce" style={{ animationDelay: "0ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "150ms" }}>.</span>
                    <span className="animate-bounce" style={{ animationDelay: "300ms" }}>.</span>
                  </span>
                </span>
              ) : (
                "Generated proposal will appear here."
              )}
            </span>
          )}
        </div>
      </section>
    </div>
  );
}
