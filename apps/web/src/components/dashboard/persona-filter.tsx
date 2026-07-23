"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { usePersonas } from "@/hooks/use-personas";

export function PersonaFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { personas, loading } = usePersonas();
  
  const currentPersonaId = searchParams.get("personaId");

  // Auto-select the first persona if none is selected
  useEffect(() => {
    if (!loading && personas.length > 0 && !currentPersonaId) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("personaId", personas[0].id);
      router.replace(`?${params.toString()}`);
    }
  }, [loading, personas, currentPersonaId, router, searchParams]);

  if (loading) {
    return <div className="text-sm text-slate-500 animate-pulse">Loading personas...</div>;
  }

  if (personas.length === 0) {
    return null; // Don't render dropdown if no personas exist
  }

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
        Showing matches for:
      </label>
      <select
        value={currentPersonaId || ""}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          if (e.target.value) {
            params.set("personaId", e.target.value);
          } else {
            params.delete("personaId");
          }
          router.push(`?${params.toString()}`);
        }}
        className="h-9 rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 px-3 py-1.5 text-sm font-medium text-slate-900 dark:text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
      >
        <option value="" disabled>Select a persona</option>
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
