import Script from "next/script";

const DEFAULT_CLIENT_ID = "ca-pub-4094870352712876";

function clientId(): string | null {
  const env = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (env === "") return null;
  if (env) return env;
  return DEFAULT_CLIENT_ID;
}

/**
 * Debe renderizarse dentro de `<head>` (requisito de conexión / verificación AdSense).
 * @see https://support.google.com/adsense/answer/7584263?hl=es
 */
export function GoogleAdSense() {
  const id = clientId();
  if (!id) return null;

  return (
    <>
      <meta name="google-adsense-account" content={id} />
      <Script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${id}`}
        strategy="afterInteractive"
        crossOrigin="anonymous"
      />
    </>
  );
}
