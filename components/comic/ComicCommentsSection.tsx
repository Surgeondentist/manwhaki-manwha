"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addComicComment, deleteComicComment } from "@/app/actions/comic-engagement";

export type ComicCommentItem = {
  id: string;
  body: string;
  created_at: string;
  user_id: string;
  username: string;
};

type Props = {
  comicId: string;
  initialComments: ComicCommentItem[];
  currentUserId: string | null;
  isLoggedIn: boolean;
};

function formatCommentDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("es", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function ComicCommentsSection({
  comicId,
  initialComments,
  currentUserId,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <section
      id="comentarios"
      tabIndex={-1}
      className="mt-8 scroll-mt-24 rounded-2xl border border-white/10 bg-black/25 px-4 py-6 sm:px-5"
    >
      <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">
        Comentarios · {initialComments.length}
      </h2>

      {isLoggedIn ? (
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            start(async () => {
              const r = await addComicComment(comicId, body);
              if (r.ok) {
                setBody("");
                router.refresh();
              } else {
                setMsg(r.error);
              }
            });
          }}
        >
          <label htmlFor="comic-comment" className="sr-only">
            Tu comentario
          </label>
          <textarea
            id="comic-comment"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="¿Qué te parece este manhwa?"
            className="w-full resize-y rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-zinc-100 outline-none ring-gold/30 placeholder:text-zinc-600 focus:border-gold/30 focus:ring-1"
          />
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] text-zinc-600">{body.length}/2000</span>
            <button
              type="submit"
              disabled={pending || !body.trim()}
              className="rounded-full bg-gold-shine px-5 py-2 text-xs font-bold text-black transition hover:brightness-105 disabled:opacity-40"
            >
              {pending ? "Publicando…" : "Publicar"}
            </button>
          </div>
          {msg && <p className="mt-2 text-xs text-red-300">{msg}</p>}
        </form>
      ) : (
        <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
          <p className="text-xs text-zinc-400">
            Inicia sesión para dejar un comentario.
          </p>
          <Link
            href={`/login?next=${encodeURIComponent(`/comic/${comicId}`)}`}
            className="mt-2 inline-flex rounded-full bg-gold-shine px-4 py-1.5 text-xs font-bold text-black transition hover:brightness-105"
          >
            Entrar
          </Link>
        </div>
      )}

      <ul className="mt-6 space-y-4">
        {initialComments.length === 0 ? (
          <li className="text-sm text-zinc-600">Sé el primero en comentar.</li>
        ) : (
          initialComments.map((c) => (
            <li
              key={c.id}
              className="rounded-xl border border-white/8 bg-black/20 px-4 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-gold/90">{c.username}</span>
                <time className="text-[10px] text-zinc-600" dateTime={c.created_at}>
                  {formatCommentDate(c.created_at)}
                </time>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-zinc-300">
                {c.body}
              </p>
              {currentUserId && c.user_id === currentUserId && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    start(async () => {
                      const r = await deleteComicComment(c.id, comicId);
                      if (r.ok) router.refresh();
                    });
                  }}
                  className="mt-2 text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-red-300 hover:underline disabled:opacity-50"
                >
                  Eliminar
                </button>
              )}
            </li>
          ))
        )}
      </ul>
    </section>
  );
}
