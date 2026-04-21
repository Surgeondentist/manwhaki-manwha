"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  addComicToLibrary,
  removeFromLibrary,
  updateLibraryStatus,
} from "@/app/actions/library";
import type { LibraryStatus } from "@/types/database";

const STATUS_LABEL: Record<LibraryStatus, string> = {
  reading: "Leyendo",
  completed: "Completado",
  dropped: "Abandonado",
};

type Props = {
  comicId: string;
  isLoggedIn: boolean;
  initialStatus: LibraryStatus | null;
};

export function ComicLibraryControls({ comicId, isLoggedIn, initialStatus }: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!isLoggedIn) {
    return (
      <div className="mt-5 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
        <p className="text-xs text-zinc-400">
          Inicia sesión para guardar este manhwa en tu biblioteca.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(`/comic/${comicId}`)}`}
          className="mt-2 inline-flex rounded-full bg-gold-shine px-4 py-1.5 text-xs font-bold text-black transition hover:brightness-105"
        >
          Entrar
        </Link>
      </div>
    );
  }

  if (!initialStatus) {
    return (
      <div className="mt-5">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            start(async () => {
              const r = await addComicToLibrary(comicId);
              if (r.ok) router.refresh();
            });
          }}
          className="w-full rounded-xl border border-gold/25 bg-gold/10 py-2.5 text-sm font-semibold text-gold transition hover:border-gold/40 hover:bg-gold/15 disabled:opacity-50 sm:w-auto sm:px-6"
        >
          {pending ? "Añadiendo…" : "Añadir a mi biblioteca"}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-5 flex flex-col gap-2 rounded-2xl border border-white/8 bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          En tu biblioteca
        </span>
        <select
          disabled={pending}
          value={initialStatus}
          onChange={(e) => {
            const v = e.target.value as LibraryStatus;
            start(async () => {
              const r = await updateLibraryStatus(comicId, v);
              if (r.ok) router.refresh();
            });
          }}
          className="rounded-lg border border-white/10 bg-surface px-2 py-1.5 text-xs font-medium text-zinc-200 outline-none focus:border-gold/40"
        >
          {(Object.keys(STATUS_LABEL) as LibraryStatus[]).map((k) => (
            <option key={k} value={k}>
              {STATUS_LABEL[k]}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          start(async () => {
            const r = await removeFromLibrary(comicId);
            if (r.ok) router.refresh();
          });
        }}
        className="text-xs font-medium text-zinc-500 underline-offset-2 hover:text-red-200 hover:underline disabled:opacity-50"
      >
        Quitar de la biblioteca
      </button>
    </div>
  );
}
