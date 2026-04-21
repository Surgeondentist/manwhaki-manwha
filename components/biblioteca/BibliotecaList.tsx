"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  removeFromLibrary,
  updateLibraryStatus,
} from "@/app/actions/library";
import { isSupabaseStoragePublicUrl } from "@/lib/supabase-image";
import type { ComicStatus, LibraryStatus } from "@/types/database";

export type BibliotecaEntry = {
  status: LibraryStatus;
  updated_at: string;
  comics: {
    id: string;
    title: string;
    cover_url: string | null;
    author_name: string | null;
    status: ComicStatus;
  } | null;
};

const STATUS_LABEL: Record<LibraryStatus, string> = {
  reading: "Leyendo",
  completed: "Completado",
  dropped: "Abandonado",
};

export function BibliotecaList({ entries }: { entries: BibliotecaEntry[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();

  return (
    <ul className="space-y-3">
      {entries.map((row) => {
        const c = row.comics;
        if (!c) return null;

        return (
          <li key={c.id}>
            <div className="glass-card flex gap-3 rounded-2xl p-3 sm:gap-4 sm:p-4">
              <Link
                href={`/comic/${c.id}`}
                className="relative h-28 w-[4.5rem] shrink-0 overflow-hidden rounded-xl bg-surface-elevated sm:h-32 sm:w-24"
              >
                {c.cover_url ? (
                  <Image
                    src={c.cover_url}
                    alt={c.title}
                    fill
                    unoptimized={isSupabaseStoragePublicUrl(c.cover_url)}
                    className="object-cover"
                    sizes="96px"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-gold/10 to-petal/5 font-heading text-xl text-gold/25">
                    M
                  </div>
                )}
              </Link>

              <div className="flex min-w-0 flex-1 flex-col justify-between gap-2">
                <div>
                  <Link
                    href={`/comic/${c.id}`}
                    className="line-clamp-2 text-sm font-semibold text-zinc-100 hover:text-gold"
                  >
                    {c.title}
                  </Link>
                  {c.author_name ? (
                    <p className="mt-0.5 truncate text-[11px] text-zinc-500">{c.author_name}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor={`lib-status-${c.id}`}>
                    Estado en biblioteca
                  </label>
                  <select
                    id={`lib-status-${c.id}`}
                    disabled={pending}
                    value={row.status}
                    onChange={(e) => {
                      const v = e.target.value as LibraryStatus;
                      start(async () => {
                        const r = await updateLibraryStatus(c.id, v);
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="rounded-lg border border-white/10 bg-black/30 px-2 py-1.5 text-[11px] font-medium text-zinc-200 outline-none focus:border-gold/40"
                  >
                    {(Object.keys(STATUS_LABEL) as LibraryStatus[]).map((k) => (
                      <option key={k} value={k}>
                        {STATUS_LABEL[k]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      start(async () => {
                        const r = await removeFromLibrary(c.id);
                        if (r.ok) router.refresh();
                      });
                    }}
                    className="rounded-lg border border-red-900/40 px-2 py-1.5 text-[11px] text-red-200/90 transition hover:bg-red-950/30 disabled:opacity-50"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
