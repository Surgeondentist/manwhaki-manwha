import Link from "next/link";

export type KawaiiChapterNavItem = {
  id: string;
  /** Título del capítulo (tooltip y aria-label). */
  label: string;
};

type KawaiiChapterNavProps = {
  prev: KawaiiChapterNavItem | null;
  next: KawaiiChapterNavItem | null;
};

const btnBase =
  "pointer-events-auto flex h-[3.25rem] w-[3.25rem] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-pink-300 via-rose-200 to-amber-100 text-rose-950 shadow-[0_6px_24px_rgba(244,114,182,0.45)] ring-2 ring-white/70 transition hover:brightness-110 hover:shadow-[0_8px_28px_rgba(251,113,133,0.55)] active:brightness-95 active:scale-95 motion-safe:animate-kawaii-float sm:h-14 sm:w-14";

function KawaiiFace() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 32 32"
      fill="none"
      className="drop-shadow-sm"
      aria-hidden
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
  );
}

/**
 * Botones flotantes izquierda / derecha (estilo kawaii alineado con KawaiiScrollToTop).
 */
export function KawaiiChapterNav({ prev, next }: KawaiiChapterNavProps) {
  if (!prev && !next) return null;

  return (
    <>
      {prev ? (
        <Link
          href={`/read/${prev.id}`}
          prefetch={false}
          title={prev.label}
          aria-label={`Capítulo anterior: ${prev.label}`}
          className={`${btnBase} fixed top-1/2 z-40 -translate-y-1/2 left-[max(0.5rem,env(safe-area-inset-left,0px))]`}
        >
          <span className="relative flex items-center justify-center" aria-hidden>
            <KawaiiFace />
            <span className="pointer-events-none absolute -left-0.5 -top-1 text-[10px]">✨</span>
          </span>
          <span className="mt-0.5 text-[9px] font-extrabold leading-none tracking-wide opacity-90">
            ANT
          </span>
        </Link>
      ) : null}

      {next ? (
        <Link
          href={`/read/${next.id}`}
          prefetch={false}
          title={next.label}
          aria-label={`Siguiente capítulo: ${next.label}`}
          className={`${btnBase} fixed top-1/2 z-40 -translate-y-1/2 right-[max(0.5rem,env(safe-area-inset-right,0px))]`}
        >
          <span className="relative flex items-center justify-center" aria-hidden>
            <KawaiiFace />
            <span className="pointer-events-none absolute -right-0.5 -top-1 text-[10px]">✨</span>
          </span>
          <span className="mt-0.5 text-[9px] font-extrabold leading-none tracking-wide opacity-90">
            SIG
          </span>
        </Link>
      ) : null}
    </>
  );
}
