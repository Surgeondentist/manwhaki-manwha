/**
 * URLs públicas de Supabase Storage a veces responden 400 al fetch que hace el
 * optimizador de `next/image` (Node), aunque el mismo URL funcione en el navegador.
 * Desactivar la optimización para esas URLs evita `/_next/image` y carga el archivo directo.
 */
export function isSupabaseStoragePublicUrl(src: string | null | undefined): boolean {
  if (!src) return false;
  return /supabase\.co\/storage\/v1\/object\/public\//i.test(src);
}
