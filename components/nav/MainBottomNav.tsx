"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function IconHome({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={active ? "text-gold" : "text-zinc-500"}
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function IconBook({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={active ? "text-gold" : "text-zinc-500"}
    >
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function IconUser({ active }: { active: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={active ? "text-gold" : "text-zinc-500"}
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export function MainBottomNav() {
  const pathname = usePathname();
  const home = pathname === "/";
  const biblioteca = pathname === "/biblioteca" || pathname.startsWith("/biblioteca/");
  const perfil = pathname === "/perfil" || pathname.startsWith("/perfil/");

  const linkClass = (active: boolean) =>
    `flex flex-col items-center gap-1 rounded-xl px-6 py-1.5 transition-colors ${
      active ? "text-gold" : "text-zinc-500 hover:text-zinc-300"
    }`;

  const labelClass = (active: boolean) =>
    `text-[10px] font-semibold ${active ? "" : "font-normal"}`;

  return (
    <nav
      className="glass fixed inset-x-0 bottom-0 z-40 pb-safe"
      aria-label="Navegación principal"
    >
      <div className="app-shell flex items-center justify-around py-2.5">
        <Link
          href="/"
          className={linkClass(home)}
          aria-current={home ? "page" : undefined}
        >
          <IconHome active={home} />
          <span className={labelClass(home)}>Inicio</span>
        </Link>

        <Link
          href="/biblioteca"
          className={linkClass(biblioteca)}
          aria-current={biblioteca ? "page" : undefined}
        >
          <IconBook active={biblioteca} />
          <span className={labelClass(biblioteca)}>Biblioteca</span>
        </Link>

        <Link
          href="/perfil"
          className={linkClass(perfil)}
          aria-current={perfil ? "page" : undefined}
        >
          <IconUser active={perfil} />
          <span className={labelClass(perfil)}>Perfil</span>
        </Link>
      </div>
    </nav>
  );
}
