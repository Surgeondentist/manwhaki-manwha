"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;

export type UpdateProfileResult =
  | { ok: true }
  | { ok: false; error: string };

export async function updateProfileUsername(username: string): Promise<UpdateProfileResult> {
  const trimmed = username.trim();
  if (!USERNAME_RE.test(trimmed)) {
    return {
      ok: false,
      error: "Usuario: 3–30 caracteres, solo letras, números y guion bajo.",
    };
  }

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return { ok: false, error: "Supabase no configurado." };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Debes iniciar sesión." };

  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, username: trimmed }, { onConflict: "id" });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Ese nombre de usuario ya está en uso." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/perfil");
  return { ok: true };
}
