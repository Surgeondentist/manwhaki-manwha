"use client";

import { useCallback, useEffect, useState } from "react";

const SHOW_AFTER_PX = 380;

function getScrollY(): number {
  if (typeof document === "undefined") return 0;
  const root = document.scrollingElement ?? document.documentElement;
  const y = root.scrollTop;
  if (y > 0) return y;
  return window.scrollY || document.body.scrollTop || 0;
}

function scrollDocumentToTop(smooth: boolean) {
  const root = document.scrollingElement ?? document.documentElement;
  root.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
}

/**
 * Botón flotante kawaii para volver arriba (lector largo / webtoon).
 * Escucha scroll en `window`, `document`, raíz de scroll y `visualViewport`
 * (evita fallos en escritorio con `html, body { height: 100% }`).
 */
export function KawaiiScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(getScrollY() > SHOW_AFTER_PX);
    };

    onScroll();

    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("scroll", onScroll, opts);
    document.addEventListener("scroll", onScroll, opts);
    document.documentElement.addEventListener("scroll", onScroll, opts);
    document.body.addEventListener("scroll", onScroll, opts);

    const vv = window.visualViewport;
    vv?.addEventListener("scroll", onScroll, opts);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll);
      document.documentElement.removeEventListener("scroll", onScroll);
      document.body.removeEventListener("scroll", onScroll);
      vv?.removeEventListener("scroll", onScroll);
    };
  }, []);

  const goTop = useCallback(() => {
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollDocumentToTop(!reduce);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={goTop}
      title="Volver arriba ✨"
      aria-label="Volver arriba del capítulo"
      className="fixed z-[45] flex h-[3.25rem] w-[3.25rem] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-pink-300 via-rose-200 to-amber-100 text-rose-950 shadow-[0_6px_24px_rgba(244,114,182,0.45)] ring-2 ring-white/70 transition hover:brightness-110 hover:shadow-[0_8px_28px_rgba(251,113,133,0.55)] active:brightness-95 motion-safe:animate-kawaii-float sm:h-14 sm:w-14"
      style={{
        bottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))",
        right: "max(1rem, env(safe-area-inset-right, 0px))",
      }}
    >
      <span className="relative flex items-center justify-center" aria-hidden>
        <svg
          width="22"
          height="22"
          viewBox="0 0 32 32"
          fill="none"
          className="drop-shadow-sm"
        >
          <ellipse cx="10" cy="14" rx="2.2" ry="2.8" fill="currentColor" />
          <ellipse cx="22" cy="14" rx="2.2" ry="2.8" fill="currentColor" />
          <path
            d="M11 20c1.8 2.2 8.2 2.2 10 0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
        <span className="pointer-events-none absolute -right-0.5 -top-1 text-[10px]">✨</span>
      </span>
      <span className="mt-0.5 text-[9px] font-extrabold leading-none tracking-wide opacity-90">
        TOP
      </span>
    </button>
  );
}
