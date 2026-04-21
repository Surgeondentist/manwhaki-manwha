"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";
import { isUuid } from "@/lib/utils/uuid";
import type { LibraryStatus } from "@/types/database";

const LIBRARY_STATUSES: LibraryStatus[] = ["reading", "dropped", "completed"];

function isLibraryStatus(v: string): v is LibraryStatus {
  return (LIBRARY_STATUSES as string[]).includes(v);
}

export async function addComicToLibrary(comicId: string) {
  if (!isUuid(comicId)) return { ok: false as const, error: "ID no válido." };

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return { ok: false as const, error: "Supabase no configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Debes iniciar sesión." };

  const { error } = await supabase.from("library").upsert(
    {
      user_id: user.id,
      comic_id: comicId,
      status: "reading",
    },
    { onConflict: "user_id,comic_id" }
  );

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/biblioteca");
  revalidatePath(`/comic/${comicId}`);
  return { ok: true as const };
}

export async function updateLibraryStatus(comicId: string, status: string) {
  if (!isUuid(comicId)) return { ok: false as const, error: "ID no válido." };
  if (!isLibraryStatus(status)) return { ok: false as const, error: "Estado no válido." };

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return { ok: false as const, error: "Supabase no configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("library")
    .update({ status })
    .eq("user_id", user.id)
    .eq("comic_id", comicId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/biblioteca");
  revalidatePath(`/comic/${comicId}`);
  return { ok: true as const };
}

export async function removeFromLibrary(comicId: string) {
  if (!isUuid(comicId)) return { ok: false as const, error: "ID no válido." };

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return { ok: false as const, error: "Supabase no configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("library")
    .delete()
    .eq("user_id", user.id)
    .eq("comic_id", comicId);

  if (error) return { ok: false as const, error: error.message };

  revalidatePath("/biblioteca");
  revalidatePath(`/comic/${comicId}`);
  return { ok: true as const };
}
