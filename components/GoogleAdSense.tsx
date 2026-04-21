import Script from "next/script";

const DEFAULT_CLIENT_ID = "ca-pub-4094870352712876";

function clientId(): string | null {
  const env = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (env === "") return null;
  if (env) return env;
  return DEFAULT_CLIENT_ID;
}

/**
 * Script global de AdSense (p. ej. anuncios automáticos).
 * Los bloques `<ins class="adsbygoogle">` se añaden donde quieras mostrar anuncios.
 */
export function GoogleAdSense() {
  const id = clientId();
  if (!id) return null;

  return (
    <Script
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${id}`}
      strategy="lazyOnload"
      crossOrigin="anonymous"
    />
  );
}
