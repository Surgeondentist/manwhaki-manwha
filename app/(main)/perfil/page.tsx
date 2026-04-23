import Link from "next/link";
import { redirect } from "next/navigation";
import { ProfileForm } from "@/components/perfil/ProfileForm";
import { SupabaseSetupHint } from "@/components/ui/SupabaseSetupHint";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const supabase = createServerSupabaseClientOptional();
  if (!supabase) {
    return (
      <div className="space-y-6 animate-fade-up">
        <SupabaseSetupHint />
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/perfil");
  }

  const { data: profileRow, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        {error.message}
      </div>
    );
  }

  const profile = profileRow as Pick<Tables<"profiles">, "username"> | null;

  const username =
    profile?.username ??
    user.user_metadata?.username ??
    user.email?.split("@")[0] ??
    "lector";

  return (
    <div className="mx-auto max-w-lg space-y-6 animate-fade-up">
      <div>
        <h1 className="font-heading text-2xl text-zinc-100">Perfil</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Cómo te muestran otros en la app y datos básicos de la cuenta.
        </p>
      </div>

      <ProfileForm initialUsername={username} email={user.email ?? null} />

      <p className="text-center text-xs text-zinc-400">
        <Link href="/" className="text-gold/70 hover:text-gold">
          ← Volver al inicio
        </Link>
      </p>
    </div>
  );
}
