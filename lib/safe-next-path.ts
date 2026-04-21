/**
 * Evita redirecciones abiertas tras OAuth / magic link: solo rutas relativas del mismo origen.
 */
export function safeRelativePath(next: string | null | undefined, fallback = "/"): string {
  if (!next || typeof next !== "string") return fallback;
  const t = next.trim();
  if (!t.startsWith("/") || t.startsWith("//")) return fallback;
  if (t.includes("\\")) return fallback;
  return t;
}
