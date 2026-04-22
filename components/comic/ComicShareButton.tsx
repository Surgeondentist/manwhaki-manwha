"use client";

import { useCallback, useState } from "react";

type Props = {
  shareUrl: string;
  title: string;
};

export function ComicShareButton({ shareUrl, title }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(shareUrl);
  const textShare = encodeURIComponent(`${title} · Manwhaki`);
  const waText = encodeURIComponent(`${title}\n${shareUrl}`);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [shareUrl]);

  const nativeShare = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.share) return;
    try {
      await navigator.share({ title, text: title, url: shareUrl });
      setOpen(false);
    } catch {
      /* usuario canceló o error */
    }
  }, [shareUrl, title]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-gold/25 hover:bg-gold/[0.06]"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
        </svg>
        Compartir
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/40"
            aria-label="Cerrar menú"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,18rem)] rounded-2xl border border-white/10 bg-surface py-2 shadow-xl">
            {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
              <button
                type="button"
                onClick={nativeShare}
                className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5"
              >
                Compartir en el dispositivo…
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                void copyLink();
              }}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-zinc-200 hover:bg-white/5"
            >
              {copied ? "¡Enlace copiado!" : "Copiar URL"}
            </button>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${textShare}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              X (Twitter)
            </a>
            <a
              href={`https://wa.me/?text=${waText}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-200 hover:bg-white/5"
              onClick={() => setOpen(false)}
            >
              Facebook
            </a>
          </div>
        </>
      )}
    </div>
  );
}
