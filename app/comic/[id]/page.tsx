import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ComicCommentsSection,
  type ComicCommentItem,
} from "@/components/comic/ComicCommentsSection";
import { ComicLikeButton } from "@/components/comic/ComicLikeButton";
import { ComicLibraryControls } from "@/components/comic/ComicLibraryControls";
import { ComicShareButton } from "@/components/comic/ComicShareButton";
import { SupabaseSetupHint } from "@/components/ui/SupabaseSetupHint";
import { getSiteUrl } from "@/lib/site-url";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import {
  isSupabaseImageUrl,
  supabaseComicDetailCoverSrc,
} from "@/lib/supabase-image";
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

  const shareUrl = `${getSiteUrl()}/comic/${comic.id}`;

  const [likesCountRes, commentsRes] = await Promise.all([
    supabase
      .from("comic_likes")
      .select("*", { count: "exact", head: true })
      .eq("comic_id", comic.id),
    supabase
      .from("comic_comments")
      .select("id, body, created_at, user_id")
      .eq("comic_id", comic.id)
      .order("created_at", { ascending: false })
      .limit(80),
  ]);

  const likeCount = likesCountRes.error ? 0 : likesCountRes.count ?? 0;

  let userLiked = false;
  if (user) {
    const { data: likeRow } = await supabase
      .from("comic_likes")
      .select("comic_id")
      .eq("comic_id", comic.id)
      .eq("user_id", user.id)
      .maybeSingle();
    userLiked = Boolean(likeRow);
  }

  const commentRows = commentsRes.data ?? [];
  const commentUserIds = Array.from(
    new Set(commentRows.map((r) => r.user_id))
  );
  let profileNameById = new Map<string, string>();
  if (commentUserIds.length > 0 && !commentsRes.error) {
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", commentUserIds);
    for (const p of profileRows ?? []) {
      profileNameById.set(p.id, p.username);
    }
  }

  const initialComments: ComicCommentItem[] = commentsRes.error
    ? []
    : commentRows.map((row) => ({
        id: row.id,
        body: row.body,
        created_at: row.created_at,
        user_id: row.user_id,
        username: profileNameById.get(row.user_id) ?? "Lector",
      }));

  const engagementErrMsg =
    likesCountRes.error?.message ?? commentsRes.error?.message ?? "";
  const engagementNeedsSetup =
    Boolean(engagementErrMsg) &&
    (/comic_likes|comic_comments|does not exist|schema cache|Could not find/i.test(
      engagementErrMsg
    ));

  return (
    <div className="app-shell flex min-h-dvh flex-col animate-fade-up">
      {/* ── Cover hero ── */}
      <div className="relative h-64 w-full overflow-hidden md:h-72 lg:h-80">
        {comic.cover_url ? (
          <Image
            src={supabaseComicDetailCoverSrc(comic.cover_url) ?? comic.cover_url}
            alt={comic.title}
            fill
            unoptimized={isSupabaseImageUrl(comic.cover_url)}
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

        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
          <a
            href="#capitulos"
            className="font-medium text-gold/75 underline-offset-2 hover:text-gold hover:underline"
          >
            Capítulos ({chapters.length}) ↓
          </a>
          <a
            href="#comentarios"
            className="font-medium text-gold/75 underline-offset-2 hover:text-gold hover:underline"
          >
            Comentarios ↓
          </a>
        </p>

        {engagementNeedsSetup && (
          <div
            className="mt-4 rounded-2xl border border-amber-500/30 bg-amber-950/25 px-4 py-3 text-xs leading-relaxed text-amber-100/90"
            role="status"
          >
            <p className="font-semibold text-amber-200">Likes y comentarios no activos en la base</p>
            <p className="mt-1.5 text-amber-100/80">
              En Supabase → SQL Editor ejecuta el archivo{" "}
              <code className="rounded bg-black/40 px-1 py-0.5 text-[10px] text-amber-50">
                supabase/migrations/20260422_comic_engagement.sql
              </code>{" "}
              (tablas <code className="text-[10px]">comic_likes</code> y{" "}
              <code className="text-[10px]">comic_comments</code>). Luego recarga esta página.
            </p>
          </div>
        )}

        <section
          className="mt-6 rounded-2xl border border-white/10 bg-black/20 px-4 py-5 sm:px-5"
          aria-labelledby="comic-reacciones"
        >
          <h2
            id="comic-reacciones"
            className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400"
          >
            Me gusta y compartir
          </h2>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ComicLikeButton
              comicId={comic.id}
              initialCount={likeCount}
              initialLiked={userLiked}
              isLoggedIn={Boolean(user)}
            />
            <ComicShareButton shareUrl={shareUrl} title={comic.title} />
          </div>
        </section>

        <ComicLibraryControls
          comicId={comic.id}
          isLoggedIn={Boolean(user)}
          initialStatus={libraryStatus}
        />

        <ComicCommentsSection
          comicId={comic.id}
          initialComments={initialComments}
          currentUserId={user?.id ?? null}
          isLoggedIn={Boolean(user)}
        />

        {/* ── Chapter list ── */}
        <div id="capitulos" className="mt-8 scroll-mt-24">
          <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-300">
            Capítulos · {chapters.length}
          </h2>

          {chaptersError ? (
            <p className="text-sm text-red-300">{chaptersError.message}</p>
          ) : !chapters.length ? (
            <div className="glass-card rounded-2xl p-4 text-sm text-zinc-400">
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
                        <span className="ml-2 font-normal text-zinc-400">
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
