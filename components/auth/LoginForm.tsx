"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase";

function callbackUrl(next: string) {
  if (typeof window === "undefined") return "";
  const origin = window.location.origin;
  return `${origin}/auth/callback?next=${encodeURIComponent(next)}`;
}

export function LoginForm() {
  const searchParams = useSearchParams();
  const initialError = searchParams.get("error");
  const initialMessage = searchParams.get("message");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState<"idle" | "google" | "email">("idle");
  const [error, setError] = useState<string | null>(initialError);
  const [info, setInfo] = useState<string | null>(
    initialMessage === "check_email"
      ? "Revisa tu bandeja: te enviamos un enlace para entrar."
      : null
  );

  const supabase = useMemo(() => {
    try {
      return createClient();
    } catch {
      return null;
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    if (!supabase) {
      setError("Supabase no está configurado en este entorno.");
      return;
    }
    setError(null);
    setLoading("google");
    const { data, error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: callbackUrl("/"),
      },
    });
    setLoading("idle");
    if (err) {
      setError(err.message);
      return;
    }
    if (data.url) {
      window.location.href = data.url;
    }
  }, [supabase]);

  const signInEmail = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!supabase) {
        setError("Supabase no está configurado en este entorno.");
        return;
      }
      const trimmed = email.trim().toLowerCase();
      if (!trimmed) {
        setError("Introduce un correo válido.");
        return;
      }
      setError(null);
      setInfo(null);
      setLoading("email");
      const { error: err } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: callbackUrl("/"),
          shouldCreateUser: true,
        },
      });
      setLoading("idle");
      if (err) {
        setError(err.message);
        return;
      }
      setInfo("Te enviamos un enlace mágico. Abre el correo y pulsa el enlace para entrar.");
    },
    [email, supabase]
  );

  if (!supabase) {
    return (
      <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 p-4 text-sm text-amber-100/90">
        Configura <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
        <code className="text-amber-50">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> en{" "}
        <code className="text-amber-50">.env.local</code>.
      </p>
    );
  }

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="text-center">
        <p className="font-heading text-2xl text-brand">Manwhaki</p>
        <p className="mt-1 text-sm text-zinc-500">Tu lector de manhwas</p>
      </div>

      <div className="glass-card rounded-3xl p-6">
        <h1 className="text-base font-semibold text-zinc-100">Iniciar sesión</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Google o enlace mágico por correo (sin contraseña).
        </p>

        {error ? (
          <p
            className="mt-3 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-200"
            role="alert"
          >
            {error}
          </p>
        ) : null}
        {info ? (
          <p className="mt-3 rounded-lg border border-emerald-900/40 bg-emerald-950/25 px-3 py-2 text-xs text-emerald-100/90">
            {info}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void signInGoogle()}
          disabled={loading !== "idle"}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-100 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          {loading === "google" ? "Conectando…" : "Continuar con Google"}
        </button>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden>
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-surface px-2 text-zinc-500">o correo</span>
          </div>
        </div>

        <form onSubmit={(e) => void signInEmail(e)} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-zinc-400">
              Correo electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="tu@correo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-white/8 bg-surface px-3.5 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-gold/40 focus:ring-0 disabled:opacity-40"
              disabled={loading !== "idle"}
            />
          </div>

          <button
            type="submit"
            disabled={loading !== "idle"}
            className="w-full rounded-xl bg-gold-shine py-2.5 text-sm font-bold text-black transition hover:brightness-105 active:scale-[0.98] disabled:opacity-50"
          >
            {loading === "email" ? "Enviando…" : "Enviar enlace mágico"}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-zinc-600">
        <Link href="/" className="text-gold/70 hover:text-gold transition-colors">
          ← Volver al catálogo
        </Link>
      </p>
    </div>
  );
}
