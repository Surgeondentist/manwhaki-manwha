export function SupabaseSetupHint() {
  return (
    <div className="rounded-2xl border border-amber-900/60 bg-amber-950/40 p-4 text-sm text-amber-100/90">
      <p className="font-medium text-amber-100">Supabase no está configurado</p>
      <p className="mt-2 text-xs leading-relaxed text-amber-200/80">
        Crea <code className="rounded bg-black/30 px-1">.env.local</code> con{" "}
        <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_URL</code>{" "}
        y{" "}
        <code className="rounded bg-black/30 px-1">
          NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>{" "}
        (copia desde <code className="rounded bg-black/30 px-1">.env.example</code>
        ) y ejecuta <code className="rounded bg-black/30 px-1">supabase/schema.sql</code>{" "}
        en el SQL Editor del proyecto.
      </p>
    </div>
  );
}
