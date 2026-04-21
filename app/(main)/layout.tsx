import Link from "next/link";
import { MainHeaderAuth } from "@/components/auth/MainHeaderAuth";
import { MainBottomNav } from "@/components/nav/MainBottomNav";

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

      <MainBottomNav />
    </div>
  );
}
