import Script from "next/script";

const DEFAULT_MEASUREMENT_ID = "G-WPRV0WYBBS";

function measurementId(): string | null {
  const env = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (env === "") return null;
  if (env) return env;
  return DEFAULT_MEASUREMENT_ID;
}

export function GoogleAnalytics() {
  const id = measurementId();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${id}');
`}
      </Script>
    </>
  );
}
