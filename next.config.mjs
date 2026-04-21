import nextEnv from "@next/env";

// Asegura que `next.config` vea `.env.local` al resolver `remotePatterns` (sin esto, a veces
// `NEXT_PUBLIC_SUPABASE_URL` está vacío aquí y el optimizador bloquea imágenes de Storage).
const { loadEnvConfig } = nextEnv;
loadEnvConfig(process.cwd());

/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: "https",
    hostname: "picsum.photos",
    pathname: "/**",
  },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
if (supabaseUrl) {
  try {
    const host = new URL(supabaseUrl).hostname;
    remotePatterns.push(
      {
        protocol: "https",
        hostname: host,
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: host,
        pathname: "/storage/v1/object/sign/**",
      },
      {
        protocol: "https",
        hostname: host,
        pathname: "/storage/v1/render/image/public/**",
      }
    );
  } catch {
    // URL inválida
  }
}

const nextConfig = {
  images: { remotePatterns },
};

export default nextConfig;
