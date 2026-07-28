import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";

export type UserPlan = {
  subscriptionStatus: 'free' | 'pro';
  generationsCount: number;
  monthlyLimit: number | 'unlimited';
};

export function useUserPlan() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [plan, setPlan] = useState<UserPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlan() {
      if (!isLoaded || !isSignedIn) {
        setLoading(false);
        return;
      }
      
      try {
        const token = await getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const res = await fetch(`${apiUrl}/api/profile/plan`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setPlan(data);
        }
      } catch (error) {
        console.error("Failed to fetch user plan", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPlan();
  }, [isLoaded, isSignedIn, getToken]);

  return { plan, loading };
}
