/**
 * URL base pública del sitio (sitemap, robots, enlaces absolutos, compartir).
 *
 * **No hace falta definir `NEXT_PUBLIC_SITE_URL` en Vercel** si te basta el dominio
 * que Vercel asigna solo: primero se usa `VERCEL_PROJECT_PRODUCTION_URL` (dominio
 * de producción del proyecto: el custom domain más corto, o `*.vercel.app`),
 * y si no existe, `VERCEL_URL` (URL de este despliegue).
 *
 * **Sí conviene** definir `NEXT_PUBLIC_SITE_URL` (p. ej. `https://tudominio.com`) cuando
 * quieras forzar una URL canónica distinta o evitar ambigüedad entre varios dominios.
 *
 * Prioridad: `NEXT_PUBLIC_SITE_URL` → `VERCEL_PROJECT_PRODUCTION_URL` → `VERCEL_URL` → localhost.
 */
function httpsOriginNoTrailingSlash(value: string): string {
  const v = value.trim();
  const withProto = v.startsWith("http") ? v : `https://${v}`;
  return withProto.replace(/\/$/, "");
}

export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return httpsOriginNoTrailingSlash(explicit);

  const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (productionHost) return httpsOriginNoTrailingSlash(productionHost);

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return httpsOriginNoTrailingSlash(vercel);

  return "http://localhost:3000";
}
