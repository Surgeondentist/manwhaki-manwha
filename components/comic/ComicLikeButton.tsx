"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toggleComicLike } from "@/app/actions/comic-engagement";

type Props = {
  comicId: string;
  initialCount: number;
  initialLiked: boolean;
  isLoggedIn: boolean;
};

export function ComicLikeButton({
  comicId,
  initialCount,
  initialLiked,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();

  if (!isLoggedIn) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
        <span className="text-lg leading-none" aria-hidden>
          🤍
        </span>
        <span className="text-sm font-semibold tabular-nums text-zinc-200">{initialCount}</span>
        <Link
          href={`/login?next=${encodeURIComponent(`/comic/${comicId}`)}`}
          className="ml-1 text-[11px] font-medium text-gold/80 underline-offset-2 hover:text-gold hover:underline"
        >
          Entrar para dar me gusta
        </Link>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        start(async () => {
          const r = await toggleComicLike(comicId);
          if (r.ok) router.refresh();
        });
      }}
      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 transition hover:border-gold/25 hover:bg-gold/[0.06] disabled:opacity-50"
      aria-pressed={initialLiked}
      aria-label={initialLiked ? "Quitar me gusta" : "Dar me gusta"}
    >
      <span className="text-lg leading-none" aria-hidden>
        {initialLiked ? "❤️" : "🤍"}
      </span>
      <span className="text-sm font-semibold tabular-nums text-zinc-200">{initialCount}</span>
    </button>
  );
}
