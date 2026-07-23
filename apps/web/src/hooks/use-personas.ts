import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export type Persona = {
  id: string;
  name: string;
  skills: string[];
  idealSalary: string;
  yearsOfExperience: number;
  resumeText: string;
};

export function usePersonas() {
  const { getToken } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPersonas() {
      try {
        const token = await getToken();
        if (!token) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/personas`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setPersonas(data);
        }
      } catch (e) {
        console.error("Failed to fetch personas", e);
      } finally {
        setLoading(false);
      }
    }
    fetchPersonas();
  }, [getToken]);

  return { personas, loading };
}
