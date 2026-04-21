import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ComicLibraryControls } from "@/components/comic/ComicLibraryControls";
import { SupabaseSetupHint } from "@/components/ui/SupabaseSetupHint";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import { isSupabaseStoragePublicUrl } from "@/lib/supabase-image";
import { isUuid } from "@/lib/utils/uuid";
import type { ChapterListItem, LibraryStatus, Tables } from "@/types/database";

export const dynamic = "force-dynamic";

type ComicPageProps = {
  params: { id: string };
};

export default async function ComicDetailPage({ params }: ComicPageProps) {
  if (!isUuid(params.id)) notFound();

  const supabase = createServerSupabaseClientOptional();

  if (!supabase) {
    return (
      <div className="app-shell flex min-h-dvh flex-col gap-6 px-4 pb-10 pt-6 sm:px-5 md:px-6">
        <Link href="/" className="text-xs text-gold/70 hover:text-gold">← Inicio</Link>
        <SupabaseSetupHint />
      </div>
    );
  }

  const { data: comicRow, error: comicError } = await supabase
    .from("comics")
    .select("id, title, description, cover_url, author_name, status, created_at")
    .eq("id", params.id)
    .maybeSingle();

  const comic = comicRow as Tables<"comics"> | null;

  if (comicError) {
    return (
      <div className="app-shell px-4 py-10 text-sm text-red-200 sm:px-5 md:px-6">
        {comicError.message}
      </div>
    );
  }

  if (!comic) notFound();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let libraryStatus: LibraryStatus | null = null;
  if (user) {
    const { data: libRow } = await supabase
      .from("library")
      .select("status")
      .eq("user_id", user.id)
      .eq("comic_id", comic.id)
      .maybeSingle();
    libraryStatus = (libRow?.status as LibraryStatus | undefined) ?? null;
  }

  const { data: chaptersRaw, error: chaptersError } = await supabase
    .from("chapters")
    .select("id, chapter_number, title, created_at")
    .eq("comic_id", comic.id)
    .order("chapter_number", { ascending: true });

  const chapters = (chaptersRaw ?? []) as ChapterListItem[];

  return (
    <div className="app-shell flex min-h-dvh flex-col animate-fade-up">
      {/* ── Cover hero ── */}
      <div className="relative h-64 w-full overflow-hidden md:h-72 lg:h-80">
        {comic.cover_url ? (
          <Image
            src={comic.cover_url}
            alt={comic.title}
            fill
            unoptimized={isSupabaseStoragePublicUrl(comic.cover_url)}
            className="object-cover"
            sizes="100vw"
            priority
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-gold/15 to-surface" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent" />

        {/* Back button */}
        <Link
          href="/"
          aria-label="Volver al inicio"
          className="glass absolute left-4 top-4 rounded-full px-3 py-1.5 text-xs text-gold/80 hover:text-gold"
        >
          ← Inicio
        </Link>

        {/* Status */}
        <span className="absolute right-4 top-4 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-petal backdrop-blur-sm">
          {comic.status === "ongoing" ? "En curso" : "Completado"}
        </span>
      </div>

      {/* ── Info ── */}
      <div className="-mt-2 flex-1 px-4 pb-10 pt-2 sm:px-5 md:px-6">
        <h1 className="font-heading text-2xl leading-snug text-zinc-100">
          {comic.title}
        </h1>
        {comic.author_name && (
          <p className="mt-1 text-sm text-gold/80">{comic.author_name}</p>
        )}
        {comic.description && (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            {comic.description}
          </p>
        )}

        <ComicLibraryControls
          comicId={comic.id}
          isLoggedIn={Boolean(user)}
          initialStatus={libraryStatus}
        />

        {/* ── Chapter list ── */}
        <div className="mt-6">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
            Capítulos · {chapters.length}
          </h2>

          {chaptersError ? (
            <p className="text-sm text-red-300">{chaptersError.message}</p>
          ) : !chapters.length ? (
            <div className="glass-card rounded-2xl p-4 text-sm text-zinc-500">
              Sin capítulos aún. Sube uno con{" "}
              <code className="text-zinc-400">npm run upload:manga</code>.
            </div>
          ) : (
            <ol className="space-y-2">
              {chapters.map((ch) => (
                <li key={ch.id}>
                  <Link
                    href={`/read/${ch.id}`}
                    className="glass-card flex items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-200 hover:border-gold/20 hover:shadow-[0_0_16px_rgba(201,162,39,0.06)] active:scale-[0.98]"
                  >
                    <span className="text-sm font-semibold text-zinc-100">
                      Cap. {ch.chapter_number}
                      {ch.title && (
                        <span className="ml-2 font-normal text-zinc-500">
                          — {ch.title}
                        </span>
                      )}
                    </span>
                    <span className="rounded-full bg-gold-rose px-3 py-0.5 text-[10px] font-bold text-black">
                      Leer
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
