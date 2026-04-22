"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";

const MAX_COMMENT_LEN = 2000;

export async function toggleComicLike(comicId: string) {
  if (!isUuid(comicId)) return { ok: false as const, error: "ID no válido." };

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return { ok: false as const, error: "Supabase no configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Debes iniciar sesión para dar me gusta." };

  const { data: existing } = await supabase
    .from("comic_likes")
    .select("comic_id")
    .eq("comic_id", comicId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("comic_likes")
      .delete()
      .eq("comic_id", comicId)
      .eq("user_id", user.id);
    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase.from("comic_likes").insert({
      comic_id: comicId,
      user_id: user.id,
    });
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath(`/comic/${comicId}`);
  return { ok: true as const };
}

export async function addComicComment(comicId: string, body: string) {
  if (!isUuid(comicId)) return { ok: false as const, error: "ID no válido." };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false as const, error: "Escribe un comentario." };
  if (trimmed.length > MAX_COMMENT_LEN) {
    return { ok: false as const, error: `Máximo ${MAX_COMMENT_LEN} caracteres.` };
  }

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return { ok: false as const, error: "Supabase no configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Debes iniciar sesión para comentar." };

  const { error } = await supabase.from("comic_comments").insert({
    comic_id: comicId,
    user_id: user.id,
    body: trimmed,
  });

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/comic/${comicId}`);
  return { ok: true as const };
}

export async function deleteComicComment(commentId: string, comicId: string) {
  if (!isUuid(commentId) || !isUuid(comicId)) {
    return { ok: false as const, error: "ID no válido." };
  }

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return { ok: false as const, error: "Supabase no configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("comic_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id)
    .eq("comic_id", comicId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath(`/comic/${comicId}`);
  return { ok: true as const };
}
