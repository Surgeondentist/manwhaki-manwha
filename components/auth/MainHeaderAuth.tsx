import Link from "next/link";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";

export async function MainHeaderAuth() {
  const supabase = createServerSupabaseClientOptional();
  if (!supabase) {
    return (
      <Link
        href="/login"
        className="glass-gold rounded-full px-4 py-1.5 text-xs font-semibold text-gold transition-all duration-200 hover:brightness-110 active:scale-95"
      >
        Entrar
      </Link>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <Link
        href="/login"
        className="glass-gold rounded-full px-4 py-1.5 text-xs font-semibold text-gold transition-all duration-200 hover:brightness-110 active:scale-95"
      >
        Entrar
      </Link>
    );
  }

  const label =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "Cuenta";

  return (
    <div className="flex max-w-[55%] items-center gap-2">
      <span className="truncate text-xs text-zinc-400" title={user.email ?? undefined}>
        {label}
      </span>
      <form action="/auth/sign-out" method="post">
        <button
          type="submit"
          className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] font-medium text-zinc-300 transition hover:border-gold/30 hover:text-gold"
        >
          Salir
        </button>
      </form>
    </div>
  );
}
