import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) return null;
  return { url, anonKey };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseEnv() !== null;
}

function createClientWithCookies(url: string, anonKey: string) {
  const cookieStore = cookies();

  type CookieToSet = {
    name: string;
    value: string;
    options?: Parameters<typeof cookieStore.set>[2];
  };

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // set puede fallar en RSC puros; middleware suele refrescar la sesión
        }
      },
    },
    global: {
      fetch: (
        input: RequestInfo | URL,
        init?: RequestInit
      ): ReturnType<typeof fetch> =>
        fetch(input, {
          ...init,
          cache: "no-store",
        }),
    },
  // El cliente SSR infiere mal nuestro `Database` manual → tablas como `never` sin este refuerzo.
  }) as unknown as SupabaseClient<Database>;
}

/**
 * Cliente Supabase para Server Components cuando las variables de entorno existen.
 * Si faltan, devuelve `null` (mostrar estado vacío o aviso en UI).
 */
export function createServerSupabaseClientOptional() {
  const env = getSupabaseEnv();
  if (!env) return null;
  return createClientWithCookies(env.url, env.anonKey);
}

/**
 * Cliente Supabase para Server Components, Server Actions y Route Handlers.
 * Lanza si faltan `NEXT_PUBLIC_SUPABASE_URL` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
 */
export function createServerSupabaseClient() {
  const env = getSupabaseEnv();
  if (!env) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en el entorno."
    );
  }
  return createClientWithCookies(env.url, env.anonKey);
}
