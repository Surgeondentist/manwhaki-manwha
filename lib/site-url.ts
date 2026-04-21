/**
 * URL base pública del sitio (sitemap, robots, enlaces absolutos).
 * Prioridad: NEXT_PUBLIC_SITE_URL → VERCEL_URL → localhost.
 */
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const withProto = vercel.startsWith("http") ? vercel : `https://${vercel}`;
    return withProto.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}
