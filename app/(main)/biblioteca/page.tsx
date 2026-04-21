import Link from "next/link";
import { redirect } from "next/navigation";
import { BibliotecaList, type BibliotecaEntry } from "@/components/biblioteca/BibliotecaList";
import { SupabaseSetupHint } from "@/components/ui/SupabaseSetupHint";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function BibliotecaPage() {
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
    redirect("/login?next=/biblioteca");
  }

  const { data: rows, error } = await supabase
    .from("library")
    .select(
      "status, updated_at, comics ( id, title, cover_url, author_name, status )"
    )
    .order("updated_at", { ascending: false });

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        {error.message}
      </div>
    );
  }

  const entries = (rows ?? []) as BibliotecaEntry[];

  return (
    <div className="space-y-6 animate-fade-up">
      <div>
        <h1 className="font-heading text-2xl text-zinc-100">Biblioteca</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manhwas que sigues. Actualiza el estado o quita títulos cuando quieras.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="glass-card rounded-2xl p-6 text-center">
          <p className="text-sm text-zinc-400">Aún no tienes nada guardado.</p>
          <p className="mt-2 text-xs text-zinc-600">
            Explora el catálogo y pulsa <span className="text-gold/80">Añadir a mi biblioteca</span> en la ficha de un manhwa.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-full bg-gold-shine px-5 py-2 text-xs font-bold text-black transition hover:brightness-105"
          >
            Ir al inicio
          </Link>
        </div>
      ) : (
        <BibliotecaList entries={entries} />
      )}
    </div>
  );
}
