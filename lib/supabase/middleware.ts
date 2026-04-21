import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

type CookieToSet = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Refresca la sesión de Supabase en cada petición (cookies).
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */
export function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // En la vuelta de OAuth / magic link (PKCE), getUser() puede reescribir cookies
  // y borrar el code verifier antes de que /auth/callback haga exchangeCodeForSession.
  if (request.nextUrl.pathname.startsWith("/auth/callback")) {
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Dispara refresh de JWT si hace falta; no uses getSession() en el servidor para autorización crítica.
  void supabase.auth.getUser();

  return supabaseResponse;
}
