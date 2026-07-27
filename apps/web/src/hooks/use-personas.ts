import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export type Persona = {
  id: string;
  name: string;
  skills: string[];
  yearsOfExperience: number;
  resumeText: string;
  lastSyncedAt?: string;
};

// Global cache to prevent N+1 API calls when usePersonas is used in multiple components
let cachedPersonas: Persona[] | null = null;
let fetchPromise: Promise<Persona[]> | null = null;

export function clearPersonasCache() {
  cachedPersonas = null;
  fetchPromise = null;
}

export function usePersonas() {
  const { getToken } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>(cachedPersonas || []);
  const [loading, setLoading] = useState(!cachedPersonas);

  useEffect(() => {
    if (cachedPersonas) {
      setPersonas(cachedPersonas);
      setLoading(false);
      return;
    }

    async function fetchPersonas() {
      try {
        const token = await getToken();
        if (!token) return [];
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/personas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.error("Failed to fetch personas", e);
      }
      return [];
    }

    if (!fetchPromise) {
      fetchPromise = fetchPersonas().then(data => {
        cachedPersonas = data;
        return data;
      });
    }

    let isMounted = true;
    fetchPromise.then(data => {
      if (isMounted) {
        setPersonas(data);
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [getToken]);

  return { personas, loading, mutate: clearPersonasCache };
}
