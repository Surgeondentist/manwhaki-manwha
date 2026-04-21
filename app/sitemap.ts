import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";
import { createServerSupabaseClientOptional } from "@/lib/supabase/server";

/** Regenerar con frecuencia moderada: nuevos capítulos entran sin saturar el origen. */
export const revalidate = 3600;

function parseDate(iso: string | null | undefined): Date {
  if (!iso) return new Date();
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const now = new Date();

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${base}/`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const supabase = createServerSupabaseClientOptional();
  if (!supabase) return entries;

  const { data: comicsRaw } = await supabase
    .from("comics")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const comics = comicsRaw ?? [];
  for (const row of comics) {
    if (!row?.id) continue;
    entries.push({
      url: `${base}/comic/${row.id}`,
      lastModified: parseDate(row.created_at),
      changeFrequency: "weekly",
      priority: 0.85,
    });
  }

  const { data: chaptersRaw } = await supabase
    .from("chapters")
    .select("id, created_at")
    .order("created_at", { ascending: false });

  const chapters = chaptersRaw ?? [];
  for (const row of chapters) {
    if (!row?.id) continue;
    entries.push({
      url: `${base}/read/${row.id}`,
      lastModified: parseDate(row.created_at),
      changeFrequency: "weekly",
      priority: 0.65,
    });
  }

  return entries;
}
