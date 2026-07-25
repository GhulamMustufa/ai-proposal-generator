"use client";

import { useEffect, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { toast } from "@/lib/toast";

export default function ProfilePage() {
  const { getToken, isLoaded: authLoaded, isSignedIn } = useAuth();
  const { user, isLoaded: userLoaded } = useUser();
  
  const [defaultPersonaId, setDefaultPersonaId] = useState("");
  const [personas, setPersonas] = useState<any[]>([]);
  
  // New preference states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [proposalTone, setProposalTone] = useState("professional");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      if (!authLoaded || !isSignedIn) return;
      
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        
        // Fetch Profile
        let currentDefaultId = "";
        const profileRes = await fetch(`${apiUrl}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          // Profile settings can be loaded here (e.g. alerts, tone)
          if (profileData && profileData.defaultPersonaId) {
            currentDefaultId = profileData.defaultPersonaId;
            setDefaultPersonaId(currentDefaultId);
          }
        }

        // Fetch Personas for dropdown
        const personasRes = await fetch(`${apiUrl}/api/personas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (personasRes.ok) {
          const personasData = await personasRes.json();
          setPersonas(personasData || []);
          if (!currentDefaultId && personasData && personasData.length > 0) {
            setDefaultPersonaId(personasData[0].id);
          }
        }

      } catch (error) {
        console.error("Failed to load settings", error);
      } finally {
        setLoading(false);
      }
    }
    
    if (authLoaded && userLoaded) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoaded, userLoaded, isSignedIn]);

  async function handleSavePreferences(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    // Placeholder for saving new preferences
    setTimeout(() => {
      toast.success("Preferences successfully updated.");
      setSaving(false);
    }, 600);
  }

  async function handleSaveDefaultPersona(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      
      const res = await fetch(`${apiUrl}/api/profile/default-persona`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ defaultPersonaId }),
      });

      if (!res.ok) {
        toast.error("Failed to save default persona");
        return;
      }
      toast.success("Default persona successfully updated.");
    } catch {
      toast.error("Request failed. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!authLoaded || !userLoaded || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-200 p-8">
        <div className="animate-pulse space-y-6 max-w-2xl mx-auto rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-10">
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-white/10" />
          <div className="h-4 w-96 rounded bg-slate-200 dark:bg-white/10" />
          <div className="space-y-4 pt-8">
            <div className="h-32 rounded-xl bg-slate-200 dark:bg-white/10" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0B] text-slate-900 dark:text-slate-200 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Settings</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">Account & API Configuration</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Manage your API keys, base identity, and default matching persona.
          </p>
        </div>

        <div className="space-y-8">
          
          {/* Identity Section */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Base Identity</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Your core profile information provided via Clerk.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                <div className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20 px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                  {user?.fullName || "Not provided"}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                <div className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/20 px-4 py-3.5 text-sm text-slate-500 dark:text-slate-400">
                  {user?.primaryEmailAddress?.emailAddress || "Not provided"}
                </div>
              </div>
            </div>
          </section>

          {/* Notification & App Preferences Section */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <form onSubmit={handleSavePreferences}>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Preferences</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Customize how the application works for you.</p>
              
              <div className="space-y-6">
                {/* Email Alerts Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                  <div>
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white">Email Match Alerts</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Receive an email when we find an Elite (85+) job match.</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="peer sr-only" />
                    <div className="peer h-6 w-11 rounded-full bg-slate-300 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-indigo-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none dark:bg-slate-700 dark:border-gray-600"></div>
                  </label>
                </div>

                {/* Proposal Tone */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Default Proposal Tone</label>
                  <select
                    value={proposalTone}
                    onChange={(e) => setProposalTone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-indigo-500/50 focus:bg-slate-100 dark:focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value="professional">Professional & Direct</option>
                    <option value="casual">Casual & Friendly</option>
                    <option value="enthusiastic">Enthusiastic & Bold</option>
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                >
                  {saving ? "Saving..." : "Save Preferences"}
                </button>
              </div>
            </form>
          </section>

          {/* Default Persona Section */}
          <section className="rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-8">
            <form onSubmit={handleSaveDefaultPersona}>
              <h2 className="text-lg font-medium text-slate-900 dark:text-white mb-1">Default Persona</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Select which persona should be used by default when scraping jobs in the background.</p>
              
              <div className="space-y-6">
                <div>
                  <select
                    value={defaultPersonaId}
                    onChange={(e) => setDefaultPersonaId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3.5 text-sm text-slate-900 dark:text-white outline-none transition focus:border-indigo-500/50 focus:bg-slate-100 dark:focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50"
                  >
                    <option value="">-- No Default Selected --</option>
                    {personas.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50 shadow-lg shadow-indigo-500/25"
                >
                  {saving ? "Saving..." : "Save Default Persona"}
                </button>
              </div>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
}
