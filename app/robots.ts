import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * No bloquear rastreadores de Google / AdSense (requisito de revisión del sitio).
 * @see https://support.google.com/adsense/answer/7584263?hl=es
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "Mediapartners-Google", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
