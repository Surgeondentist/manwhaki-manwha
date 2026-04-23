/**
 * URLs públicas de Supabase Storage a veces responden 400 al fetch que hace el
 * optimizador de `next/image` (Node), aunque el mismo URL funcione en el navegador.
 * Desactivar la optimización para esas URLs evita `/_next/image` y carga el archivo directo.
 */
export function isSupabaseStoragePublicUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  return /supabase\.co\/storage\/v1\/object\/public\//i.test(src);
}

/** URL ya generada por la API de transformación (render). */
export function isSupabaseRenderImageUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  return /supabase\.co\/storage\/v1\/render\/image\/public\//i.test(src);
}

/** Cualquier imagen servida desde Supabase Storage (original o transformada). */
export function isSupabaseImageUrl(src: string | null | undefined): boolean {
  return isSupabaseStoragePublicUrl(src) || isSupabaseRenderImageUrl(src);
}

const TRANSFORM_OFF =
  process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === "0" ||
  process.env.NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM === "false";

/**
 * Convierte una URL `.../object/public/{bucket}/{path}` en `.../render/image/public/...`
 * con ancho/calidad para reducir peso (Lighthouse / LCP).
 *
 * Requiere **Image transformations** activas en Supabase (Storage → Settings).
 * Si tu plan no lo incluye o ves 400 en imágenes, define en Vercel:
 * `NEXT_PUBLIC_SUPABASE_IMAGE_TRANSFORM=false`
 *
 * @see https://supabase.com/docs/guides/storage/serving/image-transformations
 */
export function supabaseTransformedImageSrc(
  publicUrl: string | null | undefined,
  opts: {
    width: number;
    height?: number;
    quality?: number;
    resize?: "cover" | "contain" | "fill";
  }
): string | undefined {
  if (!publicUrl || TRANSFORM_OFF) return publicUrl ?? undefined;
  if (isSupabaseRenderImageUrl(publicUrl)) return publicUrl;

  const marker = "/storage/v1/object/public/";
  const i = publicUrl.indexOf(marker);
  if (i === -1) return publicUrl;

  const origin = publicUrl.slice(0, i);
  const tail = publicUrl.slice(i + marker.length);
  const slash = tail.indexOf("/");
  if (slash === -1) return publicUrl;

  const bucket = tail.slice(0, slash);
  const objectPath = tail.slice(slash + 1);
  if (!bucket || !objectPath) return publicUrl;

  const width = Math.min(2500, Math.max(1, Math.round(opts.width)));
  const q = new URLSearchParams();
  q.set("width", String(width));
  q.set("quality", String(Math.min(100, Math.max(20, Math.round(opts.quality ?? 80)))));
  q.set("resize", opts.resize ?? "cover");
  if (opts.height) {
    q.set("height", String(Math.min(2500, Math.max(1, Math.round(opts.height)))));
  }

  return `${origin}/storage/v1/render/image/public/${bucket}/${objectPath}?${q.toString()}`;
}

/** Portadas en grid del inicio (recorte 3:4, ~260px CSS ×2). */
export function supabaseCatalogCoverSrc(url: string | null | undefined): string | undefined {
  return supabaseTransformedImageSrc(url, {
    width: 560,
    height: 746,
    quality: 78,
    resize: "cover",
  });
}

/**
 * Hero “Destacado” con imagen horizontal dedicada (`banner_url`).
 */
export function supabaseFeaturedBannerSrc(url: string | null | undefined): string | undefined {
  return supabaseTransformedImageSrc(url, {
    width: 1920,
    height: 640,
    quality: 82,
    resize: "cover",
  });
}

/**
 * Hero cuando solo hay `cover_url` vertical: recorte tipo banner (~2.4:1).
 */
export function supabaseFeaturedCropFromCoverSrc(
  url: string | null | undefined
): string | undefined {
  return supabaseTransformedImageSrc(url, {
    width: 1600,
    height: 520,
    quality: 80,
    resize: "cover",
  });
}

/** @deprecated Usar supabaseFeaturedBannerSrc o supabaseFeaturedCropFromCoverSrc según el caso. */
export function supabaseFeaturedCoverSrc(url: string | null | undefined): string | undefined {
  return supabaseFeaturedCropFromCoverSrc(url);
}

/** Miniatura en biblioteca (~96px CSS). */
export function supabaseLibraryThumbSrc(url: string | null | undefined): string | undefined {
  return supabaseTransformedImageSrc(url, { width: 280, quality: 78 });
}

/** Portada en ficha del cómic (hero ~md). */
export function supabaseComicDetailCoverSrc(url: string | null | undefined): string | undefined {
  return supabaseTransformedImageSrc(url, { width: 960, quality: 80 });
}

/** Viñeta a ancho completo en lector (viewport; tope API 2500). */
export function supabaseReaderPageSrc(url: string | null | undefined): string | undefined {
  return supabaseTransformedImageSrc(url, { width: 1920, quality: 82 });
}
