import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Brand */}
      <div className="text-center">
        <p className="font-heading text-2xl text-brand">Manwhaki</p>
        <p className="mt-1 text-sm text-zinc-500">Tu lector de manhwas</p>
      </div>

      {/* Glass card */}
      <div className="glass-card rounded-3xl p-6">
        <h1 className="text-base font-semibold text-zinc-100">Iniciar sesión</h1>
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          Próximamente: email, OAuth y magic link con Supabase Auth.
        </p>

        <form className="mt-5 space-y-4" aria-label="Formulario de acceso">
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
              className="w-full rounded-xl border border-white/8 bg-surface px-3.5 py-2.5 text-sm text-zinc-200 outline-none placeholder:text-zinc-600 focus:border-gold/40 focus:ring-0 disabled:opacity-40"
              disabled
            />
          </div>

          <button
            type="button"
            disabled
            className="w-full rounded-xl bg-gold-shine py-2.5 text-sm font-bold text-black opacity-40 transition active:scale-95"
          >
            Continuar
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
