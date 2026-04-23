import Image from "next/image";
import Link from "next/link";
import { SupabaseSetupHint } from "@/components/ui/SupabaseSetupHint";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import {
  isSupabaseImageUrl,
  supabaseCatalogCoverSrc,
  supabaseFeaturedCoverSrc,
} from "@/lib/supabase-image";
import type { ComicListItem } from "@/types/database";

/** Siempre datos frescos de Supabase (título, autor, portada al editarlos en el panel). */
export const dynamic = "force-dynamic";

function ComicCard({ comic }: { comic: ComicListItem }) {
  return (
    <Link
      href={`/comic/${comic.id}`}
      className="glass-card group block overflow-hidden rounded-2xl transition-all duration-300 hover:border-gold/20 hover:shadow-[0_0_28px_rgba(201,162,39,0.07)] active:scale-[0.97]"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-surface-elevated">
        {comic.cover_url ? (
          <Image
            src={supabaseCatalogCoverSrc(comic.cover_url) ?? comic.cover_url}
            alt={comic.title}
            fill
            unoptimized={isSupabaseImageUrl(comic.cover_url)}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 480px) 46vw, (max-width: 768px) 31vw, (max-width: 1280px) 23vw, 260px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-gold/10 to-petal/5">
            <span className="font-heading text-3xl text-gold/25">M</span>
          </div>
        )}
        <span className="absolute right-2 top-2 rounded-full bg-black/80 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-zinc-100 backdrop-blur-sm">
          {comic.status === "completed" ? "Completo" : "En curso"}
        </span>
      </div>
      <div className="px-3 py-2.5">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-zinc-100">
          {comic.title}
        </h3>
        {comic.author_name && (
          <p className="mt-0.5 text-[11px] text-zinc-400">{comic.author_name}</p>
        )}
      </div>
    </Link>
  );
}

function EmptyHero() {
  return (
    <div className="relative flex h-44 w-full flex-col items-center justify-center overflow-hidden rounded-3xl border border-gold/10 bg-surface-elevated text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-petal/5" />
      <div className="relative">
        <div className="mx-auto mb-3 h-14 w-14 animate-pulse_glow rounded-full bg-gradient-to-br from-gold/30 to-petal/15" />
        <p className="font-heading text-lg text-brand">Manwhaki</p>
        <p className="mt-1 text-xs text-zinc-400">Pronto habrá manhwas aquí</p>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const supabase = createServerSupabaseClientOptional();

  if (!supabase) {
    return (
      <div className="space-y-6 animate-fade-up">
        <SupabaseSetupHint />
      </div>
    );
  }

  const { data: comicsRaw, error } = await supabase
    .from("comics")
    .select("id, title, description, cover_url, author_name, status, created_at")
    .order("created_at", { ascending: false });

  const comics = (comicsRaw ?? []) as ComicListItem[];

  if (error) {
    return (
      <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-4 text-sm text-red-200">
        <p className="font-semibold">Error al cargar el catálogo</p>
        <p className="mt-1.5 text-xs opacity-80">{error.message}</p>
      </div>
    );
  }

  /** El más reciente por `created_at` (mismo orden que la query). También aparece en el catálogo. */
  const featured = comics[0] ?? null;

  return (
    <div className="space-y-7 animate-fade-up">
      {/* ── Featured hero ── */}
      <section>
        {featured ? (
          <Link
            href={`/comic/${featured.id}`}
            className="glass-card group relative flex h-52 w-full overflow-hidden rounded-3xl transition-all hover:border-gold/20 hover:shadow-[0_0_36px_rgba(201,162,39,0.1)] active:scale-[0.98] sm:h-56 md:h-64 lg:h-72"
          >
            {featured.cover_url && (
              <Image
                src={supabaseFeaturedCoverSrc(featured.cover_url) ?? featured.cover_url}
                alt={featured.title}
                fill
                unoptimized={isSupabaseImageUrl(featured.cover_url)}
                className="object-cover opacity-35 transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1152px"
                priority
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
            <div className="relative flex max-w-xl flex-col justify-end p-5 md:p-7 lg:max-w-2xl">
              <span className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-gold">
                Destacado
              </span>
              <h2 className="font-heading text-xl leading-tight text-zinc-100 md:text-2xl lg:text-3xl">
                {featured.title}
              </h2>
              {featured.author_name && (
                <p className="mt-0.5 text-xs text-zinc-400">{featured.author_name}</p>
              )}
              {featured.description && (
                <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-zinc-400">
                  {featured.description}
                </p>
              )}
              <span className="mt-3.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-gold-shine px-4 py-1.5 text-xs font-bold text-black">
                Leer ahora →
              </span>
            </div>
          </Link>
        ) : (
          <EmptyHero />
        )}
      </section>

      {/* ── Catalog grid ── */}
      <section>
        <h2 className="mb-4 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
          Catálogo
        </h2>

        {comics.length === 0 ? (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5">
              <p className="text-sm font-semibold text-zinc-300">
                La base está lista · falta contenido
              </p>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                Sube tu primer manhwa con{" "}
                <code className="text-zinc-400">npm run upload:manga</code> y
                aparecerá aquí automáticamente.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {comics.map((comic) => (
              <ComicCard key={comic.id} comic={comic} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
