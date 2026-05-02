import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: async () =>
          request.cookies.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value ?? "",
          })),
        setAll: async (setCookies) => {
          for (const { name, value, options } of setCookies) {
            response.cookies.set({ name, value, ...options });
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPaths = ["/dashboard", "/profile", "/history", "/proposals"];
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p));

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return response;
}
