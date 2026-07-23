"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export function ManualJobEntry() {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [generationType, setGenerationType] = useState<'proposal' | 'cold_email'>('proposal');
  const [generatedProposal, setGeneratedProposal] = useState<string | null>(null);

  async function handleGenerate(type: 'proposal' | 'cold_email') {
    if (!jobDescription.trim()) {
      toast.error("Job description is required!");
      return;
    }

    setGenerationType(type);
    setLoading(true);
    setGenerated(false);
    setGeneratedProposal(null);
    
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const clientReferenceId = crypto.randomUUID();

      const res = await fetch(`${apiUrl}/api/proposals/enqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          jobTitle: jobTitle.trim() || undefined,
          jobDescription: jobDescription.trim(),
          company: company.trim() || undefined,
          generationType: type,
          clientReferenceId,
        })
      });

      if (res.status === 403) {
        toast.error("You have reached your free generation limit! Please upgrade to Pro.");
        router.push("/pricing");
        setLoading(false);
        return;
      }

      if (res.status === 429) {
        toast.error("You are generating too fast. Please wait a moment.");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        throw new Error("Failed to enqueue job");
      }

      toast.success(`${type === 'proposal' ? 'Proposal' : 'Cold Email'} generation started in background.`);

      // Subscribe to Server-Sent Events for real-time completion
      const eventSource = new EventSource(`${apiUrl}/api/proposals/status/${userId}`);
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.clientReferenceId === clientReferenceId) {
            if (data.status === 'generated') {
              setLoading(false);
              setGenerated(true);
              if (data.generatedText) {
                setGeneratedProposal(data.generatedText);
              }
              toast.success("Your AI draft has been generated!");
              eventSource.close();
            } else if (data.status === 'error') {
              setLoading(false);
              toast.error("Background generation failed.");
              eventSource.close();
            }
          }
        } catch (e) {
          console.error("Error parsing SSE data", e);
        }
      };

      eventSource.onerror = (error) => {
        console.error("SSE error", error);
        eventSource.close();
        setLoading(false); // Fallback to avoid hanging
      };

    } catch (error) {
      setLoading(false);
      toast.error("Failed to generate text.");
    }
  }

  function handleReset() {
    setJobTitle("");
    setCompany("");
    setJobDescription("");
    setGenerated(false);
    setGeneratedProposal(null);
    setLoading(false);
  }

  return (
    <div className="mb-12 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] shadow-xl shadow-slate-200/20 dark:shadow-none">
      <div className="border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] px-6 py-4">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center gap-2">
          <svg className="h-5 w-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          Paste &amp; Generate
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Found a job elsewhere? Paste the description here to generate a tailored proposal or cold email.
        </p>
      </div>

      <div className="p-6">
        {!generatedProposal && !loading ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Job Title <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Senior Frontend Developer"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Company Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Corp"
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Job Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={6}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => handleGenerate('proposal')}
                disabled={!jobDescription.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/25"
              >
                Generate Proposal ✨
              </button>
              <button
                onClick={() => handleGenerate('cold_email')}
                disabled={!jobDescription.trim()}
                className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-white/10"
              >
                Generate Cold Email 📧
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex items-center justify-center h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 px-8 py-3 text-sm font-medium text-indigo-600 dark:text-indigo-300 border border-indigo-500/20 dark:border-indigo-500/30">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-indigo-500 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              AI is crafting your {generationType === 'proposal' ? 'proposal' : 'cold email'}...
            </div>
          </div>
        ) : generatedProposal ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                ✨ Your Generated {generationType === 'proposal' ? 'Proposal' : 'Cold Email'}
              </h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReset}
                  className="text-xs px-3 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-medium"
                >
                  Create Another
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!generatedProposal) return;
                    
                    const fallbackCopy = () => {
                      const textArea = document.createElement("textarea");
                      textArea.value = generatedProposal;
                      textArea.style.position = "fixed";
                      textArea.style.left = "-999999px";
                      textArea.style.top = "-999999px";
                      document.body.appendChild(textArea);
                      textArea.focus();
                      textArea.select();
                      try {
                        document.execCommand("copy");
                        toast.success('Copied to clipboard!');
                      } catch (err) {
                        toast.error('Failed to copy. Please copy manually.');
                      }
                      textArea.remove();
                    };

                    if (navigator.clipboard && window.isSecureContext) {
                      navigator.clipboard.writeText(generatedProposal)
                        .then(() => toast.success('Copied to clipboard!'))
                        .catch(() => fallbackCopy());
                    } else {
                      fallbackCopy();
                    }
                  }}
                  className="text-xs px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30 transition-colors font-medium border border-indigo-500/20"
                >
                  Copy Text
                </button>
              </div>
            </div>
            <div className="bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-xl p-5 md:p-6 text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed shadow-inner">
              {generatedProposal}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
