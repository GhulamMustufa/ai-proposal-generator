import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function normalizeCookies(cookieStore: ReturnType<typeof cookies>) {
  return cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value ?? "" }));
}

export function createClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: async () => normalizeCookies(cookieStore),
    },
  });
}

export function createActionClient() {
  const cookieStore = cookies();

  return createSupabaseServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: async () => normalizeCookies(cookieStore),
      setAll: async (setCookies) => {
        for (const { name, value, options } of setCookies) {
          cookieStore.set({ name, value, ...options });
        }
      },
    },
  });
}
