"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { toast } from "@/components/ui/use-toast";

export default function ProposalEditorPage({ params }: { params: { id: string } }) {
  const { getToken } = useAuth();
  const router = useRouter();
  
  const [proposal, setProposal] = useState<any>(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadProposal() {
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        const res = await fetch(`${apiUrl}/api/proposals/${params.id}/get`, {
          method: "POST",
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
        } else {
          toast({ title: "Error", description: "Proposal not found.", variant: "destructive" });
        }
      } catch (err) {
        toast({ title: "Error", description: "Could not fetch proposal.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    }
    
    loadProposal();
  }, [params.id, getToken]);

  async function handleSave() {
    setSaving(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const res = await fetch(`${apiUrl}/api/proposals/${params.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ text })
      });

      if (!res.ok) throw new Error("Failed to save");
      toast({ title: "Success", description: "Changes saved successfully." });
    } catch (err) {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDownloadPdf() {
    setDownloading(true);
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const res = await fetch(`${apiUrl}/api/proposals/${params.id}/pdf`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to generate PDF");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proposal-${params.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Downloaded", description: "Your PDF is ready!" });
    } catch (err) {
      toast({ title: "Error", description: "Failed to generate PDF.", variant: "destructive" });
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
          <h1 className="text-2xl font-bold text-white tracking-tight">Interactive Editor</h1>
          <p className="mt-1 text-sm text-slate-400">Refine your AI-generated proposal before sending.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 border border-white/10"
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
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-1 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-black/40 rounded-t-xl">
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Proposal Content</span>
            </div>
            <textarea 
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full min-h-[500px] p-6 bg-transparent text-slate-300 resize-y focus:outline-none focus:ring-0 text-sm leading-relaxed"
              placeholder="Your proposal content goes here..."
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6">
            <h3 className="text-sm font-semibold text-white mb-4">Job Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Title</p>
                <p className="text-sm font-medium text-slate-300">{proposal.jobTitle || "Confidential Role"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Generated At</p>
                <p className="text-sm font-medium text-slate-300">{new Date(proposal.createdAt).toLocaleString()}</p>
              </div>
              {proposal.jobLink && (
                <div className="pt-2">
                  <a href={proposal.jobLink} target="_blank" rel="noreferrer" className="text-sm text-indigo-400 hover:text-indigo-300 transition">
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
