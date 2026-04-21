import type { MetadataRoute } from "next";

/**
 * No bloquear rastreadores de Google / AdSense (requisito de revisión del sitio).
 * @see https://support.google.com/adsense/answer/7584263?hl=es
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      { userAgent: "Mediapartners-Google", allow: "/" },
      { userAgent: "Googlebot", allow: "/" },
    ],
  };
}
