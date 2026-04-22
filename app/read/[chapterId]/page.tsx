import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VerticalStripReader } from "@/components/lector/VerticalStripReader";
import { KawaiiScrollToTop } from "@/components/ui/KawaiiScrollToTop";
import { SupabaseSetupHint } from "@/components/ui/SupabaseSetupHint";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";
import type { ChapterPageItem, Tables } from "@/types/database";

export const dynamic = "force-dynamic";

type ReadPageProps = {
  params: { chapterId: string };
};

type ChapterWithComic = Pick<
  Tables<"chapters">,
  "id" | "chapter_number" | "title" | "comic_id"
> & {
  comics: { id: string; title: string } | { id: string; title: string }[] | null;
};

function nestedComicTitle(
  comics: { title: string } | { title: string }[] | null | undefined
): string | undefined {
  if (!comics) return undefined;
  if (Array.isArray(comics)) return comics[0]?.title;
  return comics.title;
}

export async function generateMetadata({ params }: ReadPageProps): Promise<Metadata> {
  const supabase = createServerSupabaseClientOptional();
  if (!supabase || !isUuid(params.chapterId)) {
    return { title: `Leyendo · Manwhaki` };
  }
  const { data } = await supabase
    .from("chapters")
    .select("title, chapter_number, comics ( title )")
    .eq("id", params.chapterId)
    .maybeSingle();

  const row = data as {
    title: string | null;
    chapter_number: number;
    comics: { title: string } | { title: string }[] | null;
  } | null;

  if (!row) return { title: "Capítulo · Manwhaki" };
  const comicTitle = nestedComicTitle(row.comics) ?? "Cómic";
  const label = row.title?.trim() || `Capítulo ${row.chapter_number}`;
  return { title: `${label} · ${comicTitle} · Manwhaki` };
}

export default async function ReadChapterPage({ params }: ReadPageProps) {
  if (!isUuid(params.chapterId)) notFound();

  const supabase = createServerSupabaseClientOptional();

  if (!supabase) {
    return (
      <div className="reader-root min-h-dvh bg-black px-4 py-8 text-zinc-100">
        <SupabaseSetupHint />
      </div>
    );
  }

  const { data: chapterRow, error: chapterError } = await supabase
    .from("chapters")
    .select("id, chapter_number, title, comic_id, comics ( id, title )")
    .eq("id", params.chapterId)
    .maybeSingle();

  if (chapterError) {
    return (
      <div className="min-h-dvh bg-black px-4 py-10 text-sm text-red-200">
        {chapterError.message}
      </div>
    );
  }

  const chapter = chapterRow as ChapterWithComic | null;
  if (!chapter) notFound();

  const { data: pagesRows, error: pagesError } = await supabase
    .from("chapter_pages")
    .select("page_number, image_url")
    .eq("chapter_id", chapter.id)
    .order("page_number", { ascending: true });

  const pages = (pagesRows ?? []) as ChapterPageItem[];
  const stripPages = pages.map((row) => ({
    pageNumber: row.page_number,
    src: row.image_url,
  }));

  const [{ data: prevRow }, { data: nextRow }] = await Promise.all([
    supabase
      .from("chapters")
      .select("id, chapter_number, title")
      .eq("comic_id", chapter.comic_id)
      .lt("chapter_number", chapter.chapter_number)
      .order("chapter_number", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("chapters")
      .select("id, chapter_number, title")
      .eq("comic_id", chapter.comic_id)
      .gt("chapter_number", chapter.chapter_number)
      .order("chapter_number", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  type Adjacent = { id: string; chapter_number: number; title: string | null };
  const prevChapter = prevRow as Adjacent | null;
  const nextChapter = nextRow as Adjacent | null;

  const chapterLabel = (c: Adjacent) =>
    c.title?.trim() || `Capítulo ${c.chapter_number}`;

  const headerTitle = chapter.title?.trim() || `Cap. ${chapter.chapter_number}`;
  const comicTitle = nestedComicTitle(chapter.comics) ?? "Cómic";
  const backHref = `/comic/${chapter.comic_id}`;

  return (
    <div className="reader-root min-h-dvh bg-[#080808] text-zinc-100">
      {/* ── Glass reader header ── */}
      <header className="glass sticky top-0 z-30">
        <div className="reader-strip flex items-center justify-between px-4 py-2.5 sm:px-5">
        <Link
          href={backHref}
          className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-xs text-zinc-400 transition hover:text-gold active:scale-95"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          {comicTitle}
        </Link>

        <span className="max-w-[45%] truncate text-xs font-semibold text-zinc-200">
          {headerTitle}
        </span>

        <Link
          href="/"
          className="rounded-full px-2 py-1.5 text-xs text-zinc-500 transition hover:text-gold"
          aria-label="Inicio"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </Link>
        </div>
      </header>

      {pagesError ? (
        <div className="px-4 py-10 text-center text-sm text-red-200">
          {pagesError.message}
        </div>
      ) : (
        <VerticalStripReader pages={stripPages} />
      )}

      {/* ── Chapter end footer + navegación entre capítulos ── */}
      <footer className="border-t border-white/5 bg-[#080808] pb-safe pt-8 text-center">
        <div className="reader-strip px-3 sm:px-4">
          <p className="text-xs font-semibold text-brand">— Fin del capítulo —</p>
          {stripPages.length > 0 && (
            <p className="mt-1 text-[11px] text-zinc-600">{stripPages.length} páginas</p>
          )}

          <div className="mx-auto mt-6 grid max-w-2xl gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch sm:gap-4">
            <div className="flex min-h-[3rem] items-stretch justify-center sm:justify-start">
              {prevChapter ? (
                <Link
                  href={`/read/${prevChapter.id}`}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center transition hover:border-gold/30 hover:bg-gold/[0.06] active:scale-[0.98] sm:items-start sm:text-left"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Capítulo anterior
                  </span>
                  <span className="mt-0.5 text-sm font-semibold text-zinc-100">
                    {chapterLabel(prevChapter)}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" aria-hidden />
              )}
            </div>

            <div className="flex items-center justify-center">
              <Link
                href={backHref}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-gold/25 bg-gold/[0.07] px-5 py-3 text-xs font-bold text-gold transition hover:border-gold/45 hover:bg-gold/10 sm:w-auto sm:py-2.5"
              >
                Ver todos los capítulos
              </Link>
            </div>

            <div className="flex min-h-[3rem] items-stretch justify-center sm:justify-end">
              {nextChapter ? (
                <Link
                  href={`/read/${nextChapter.id}`}
                  className="flex w-full flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center transition hover:border-gold/30 hover:bg-gold/[0.06] active:scale-[0.98] sm:items-end sm:text-right"
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Siguiente capítulo
                  </span>
                  <span className="mt-0.5 text-sm font-semibold text-zinc-100">
                    {chapterLabel(nextChapter)}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" aria-hidden />
              )}
            </div>
          </div>
        </div>
      </footer>

      <KawaiiScrollToTop />
    </div>
  );
}
