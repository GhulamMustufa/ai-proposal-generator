"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { PersonaForm } from "@/components/personas/persona-form";
import { toast } from "@/lib/toast";
import { BUILT_IN_PERSONAS } from "@/lib/built-in-personas";

export default function PersonasPage() {
  const { getToken } = useAuth();
  const [personas, setPersonas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPersona, setEditingPersona] = useState<any | null>(null);

  const fetchPersonas = async () => {
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/personas`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPersonas(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPersonas();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this persona?")) return;
    
    try {
      const token = await getToken();
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const res = await fetch(`${apiUrl}/api/personas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.ok) {
        toast.success("Persona deleted");
        fetchPersonas();
      } else {
        toast.error("Failed to delete");
      }
    } catch (e) {
      toast.error("Error deleting persona");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Personas</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your profiles to let AI tailor proposals for specific roles.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingPersona(null);
            setShowForm(true);
          }}
          className="inline-flex items-center justify-center rounded-xl bg-indigo-500 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 shadow-lg shadow-indigo-500/25"
        >
          + New Persona
        </button>
      </div>

      <div className="mb-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 flex gap-3 text-blue-800 dark:text-blue-300">
        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm leading-relaxed">
          <strong>Note:</strong> Whether you create a new schema from scratch or use a built-in template below, the AI will use your selected schema to automatically filter and score job matches. Be sure to customize your resume text for the best personalized AI proposals!
        </p>
      </div>

      {showForm && (
        <div className="mb-8">
          <PersonaForm 
            initialData={editingPersona} 
            onSuccess={() => {
              setShowForm(false);
              fetchPersonas();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.02] p-6 shadow-sm">
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-2/3 mb-5"></div>
              <div className="flex gap-2 mb-6">
                <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
                <div className="h-5 w-12 bg-slate-200 dark:bg-slate-700 rounded"></div>
              </div>
              <div className="space-y-3 mb-6">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : personas.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-300 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-white/[0.02]">
          <p className="text-slate-500 dark:text-slate-400">You haven't created any personas yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {personas.map(p => (
            <div key={p.id} className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] p-6 shadow-sm hover:border-indigo-500/50 transition">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{p.name}</h3>
              
              {p.skills?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {p.skills.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded">
                      {s}
                    </span>
                  ))}
                  {p.skills.length > 3 && (
                    <span className="text-[10px] uppercase tracking-wider font-semibold px-2 py-1 bg-slate-100 dark:bg-white/5 text-slate-500 rounded">
                      +{p.skills.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1 mb-6">
                {p.idealSalary && <p>Salary: {p.idealSalary}</p>}
                {p.yearsOfExperience && <p>Experience: {p.yearsOfExperience} yrs</p>}
              </div>

              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => {
                    setEditingPersona(p);
                    setShowForm(true);
                  }}
                  className="text-slate-400 hover:text-indigo-500 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  onClick={() => handleDelete(p.id)}
                  className="text-slate-400 hover:text-rose-500 transition"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Built-in Templates Section */}
      <div className="mt-16">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Template Library</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Need a starting point? Select a template below to quickly create a highly optimized persona schema.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BUILT_IN_PERSONAS.map(template => (
            <div 
              key={template.id} 
              className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-white/[0.01] p-6 hover:bg-white dark:hover:bg-white/[0.03] hover:border-indigo-500/30 hover:shadow-lg transition cursor-pointer flex flex-col justify-between"
              onClick={() => {
                // Remove the template ID so it creates a NEW persona when saved
                const { id, ...templateData } = template;
                setEditingPersona(templateData);
                setShowForm(true);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition">{template.name}</h3>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {template.skills.slice(0, 4).map(s => (
                    <span key={s} className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded">
                      {s}
                    </span>
                  ))}
                  {template.skills.length > 4 && (
                    <span className="text-[10px] px-2 py-0.5 text-slate-500">
                      +{template.skills.length - 4} more
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
                <span>{template.yearsOfExperience} yrs exp</span>
                <span className="font-medium text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  Use Template &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
