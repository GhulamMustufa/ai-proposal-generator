"use client";

import { useState, useEffect, use } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "@/lib/toast";

export default function ProposalEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [proposal, setProposal] = useState<any>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<"proposal" | "resume">("proposal");
  const [resumeText, setResumeText] = useState("");
  const [tailoring, setTailoring] = useState(false);
  useEffect(() => {
    async function loadProposal() {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        const res = await fetch(`${apiUrl}/api/proposals/${id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        
        if (data.success && data.data) {
          setProposal(data.data);
          setText(data.data.generatedProposal || "");
          setResumeText(data.data.generatedResume || "");
          if (data.data.generatedResume) {
            setActiveTab("resume");
          }
        } else {
          toast.error("Proposal not found.");
        }
      } catch (err) {
        toast.error("Could not fetch proposal.");
      } finally {
        setLoading(false);
      }
    }
    
    loadProposal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const res = await fetch(`${apiUrl}/api/proposals/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (!res.ok) throw new Error("Failed to save");
      toast.success("Changes saved successfully.");
    } catch (err) {
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handleTailorResume() {
    setTailoring(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const res = await fetch(`${apiUrl}/api/proposals/${id}/resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to tailor resume");
      }
      
      const data = await res.json();
      if (data.success && data.data) {
        setResumeText(data.data.generatedResume || "");
        setActiveTab("resume");
        toast.success("Resume tailored successfully!");
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("base resume not found")) {
        toast.error("Please add a base resume or bio to your Persona first.");
        router.push("/personas");
      } else {
        toast.error(err.message || "Failed to tailor resume.");
      }
    } finally {
      setTailoring(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const res = await fetch(`${apiUrl}/api/proposals/${id}/pdf`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to generate PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposal-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success("Your PDF is ready!");
    } catch (err) {
      toast.error("Failed to generate PDF.");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (!proposal) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Interactive Editor</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Refine your AI-generated proposal before sending.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleTailorResume}
            disabled={tailoring}
            className="inline-flex items-center justify-center rounded-xl bg-purple-100 dark:bg-purple-900/30 px-6 py-2.5 text-sm font-medium text-purple-700 dark:text-purple-300 transition hover:bg-purple-200 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800"
          >
            {tailoring ? "Tailoring..." : "Tailor Resume ✨"}
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 px-6 py-2.5 text-sm font-medium text-slate-700 dark:text-white transition hover:bg-slate-200 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          
          <button 
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 shadow-lg shadow-indigo-500/25 gap-2"
          >
            {downloading ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-4 border-b border-slate-200 dark:border-white/10 mb-4">
            <button
              onClick={() => setActiveTab("proposal")}
              className={`pb-3 text-sm font-medium transition ${
                activeTab === "proposal"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Proposal Letter
            </button>
            <button
              onClick={() => setActiveTab("resume")}
              className={`pb-3 text-sm font-medium transition ${
                activeTab === "resume"
                  ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              Tailored Resume
            </button>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-1 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-black/40 rounded-t-xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                {activeTab === "proposal" ? "Proposal Content" : "Tailored Resume Content"}
              </span>
            </div>
            {activeTab === "proposal" ? (
              <textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full min-h-[500px] p-6 bg-transparent text-slate-800 dark:text-slate-300 resize-y focus:outline-none focus:ring-0 text-sm leading-relaxed"
                placeholder="Your proposal content goes here..."
              />
            ) : (
              <textarea 
                value={resumeText}
                readOnly
                className="w-full min-h-[500px] p-6 bg-slate-50/50 dark:bg-black/20 text-slate-800 dark:text-slate-300 resize-y focus:outline-none focus:ring-0 text-sm leading-relaxed cursor-default"
                placeholder={tailoring ? "Generating tailored resume..." : "Click 'Tailor Resume' to generate a job-specific resume based on your profile."}
              />
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Title</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-300">{proposal.jobTitle || "Confidential Role"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Generated At</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-300">{new Date(proposal.createdAt).toLocaleString()}</p>
              </div>
              {proposal.jobLink && (
                <div className="pt-2">
                  <a href={proposal.jobLink} target="_blank" rel="noreferrer" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition">
                    View original listing &rarr;
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
