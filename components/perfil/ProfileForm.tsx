"use client";

import { useState, useTransition } from "react";
import { updateProfileUsername } from "@/app/actions/profile";

type Props = {
  initialUsername: string;
  email: string | null;
};

export function ProfileForm({ initialUsername, email }: Props) {
  const [username, setUsername] = useState(initialUsername);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="glass-card space-y-4 rounded-2xl p-5"
      onSubmit={(e) => {
        e.preventDefault();
        setOk(null);
        setErr(null);
        start(async () => {
          const r = await updateProfileUsername(username);
          if (r.ok) setOk("Cambios guardados.");
          else setErr(r.error);
        });
      }}
    >
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Correo</p>
        <p className="mt-1 truncate text-sm text-zinc-300">{email ?? "—"}</p>
        <p className="mt-1 text-[11px] text-zinc-400">El correo se gestiona desde el proveedor de acceso (Google, etc.).</p>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="username" className="text-xs font-medium text-zinc-400">
          Nombre de usuario público
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded-xl border border-white/8 bg-surface px-3.5 py-2.5 text-sm text-zinc-200 outline-none focus:border-gold/40"
          disabled={pending}
          minLength={3}
          maxLength={30}
        />
        <p className="text-[11px] text-zinc-400">3–30 caracteres: letras, números y _</p>
      </div>

      {err ? (
        <p className="rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs text-red-200" role="alert">
          {err}
        </p>
      ) : null}
      {ok ? (
        <p className="rounded-lg border border-emerald-900/40 bg-emerald-950/25 px-3 py-2 text-xs text-emerald-100/90">
          {ok}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-gold-shine py-2.5 text-sm font-bold text-black transition hover:brightness-105 disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
