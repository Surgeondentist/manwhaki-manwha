import Link from "next/link";
import { MainHeaderAuth } from "@/components/auth/MainHeaderAuth";

function IconHome() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  );
}

function IconBook() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );
}

export default async function MainGroupLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-shell flex min-h-dvh flex-col">
      {/* ── Sticky glass header ── */}
      <header className="glass sticky top-0 z-40 flex items-center justify-between px-5 py-3">
        <Link href="/" className="font-heading text-[1.35rem] leading-none text-brand">
          Manwhaki
        </Link>
        <MainHeaderAuth />
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 px-4 pb-28 pt-5 sm:px-5 md:px-6 lg:px-8">
        {children}
      </main>

      {/* ── Bottom nav ── */}
      <nav
        className="glass fixed inset-x-0 bottom-0 z-40 pb-safe"
        aria-label="Navegación principal"
      >
        <div className="app-shell flex items-center justify-around py-2.5">
          <Link
            href="/"
            className="flex flex-col items-center gap-1 rounded-xl px-6 py-1.5 text-gold"
            aria-current="page"
          >
            <IconHome />
            <span className="text-[10px] font-semibold">Inicio</span>
          </Link>

          <button
            type="button"
            disabled
            className="flex flex-col items-center gap-1 rounded-xl px-6 py-1.5 text-zinc-600"
          >
            <IconBook />
            <span className="text-[10px]">Biblioteca</span>
          </button>

          <button
            type="button"
            disabled
            className="flex flex-col items-center gap-1 rounded-xl px-6 py-1.5 text-zinc-600"
          >
            <IconUser />
            <span className="text-[10px]">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
