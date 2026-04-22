"use client";

import { useEffect } from "react";

type AdsWindow = Window & {
  adsbygoogle?: unknown[];
};

const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
const slot = process.env.NEXT_PUBLIC_ADSENSE_SLOT_BIBLIOTECA?.trim();

/**
 * Banner horizontal responsive entre título y lista (estilo sitios lector).
 * Requiere `NEXT_PUBLIC_ADSENSE_CLIENT_ID` y un bloque creado en AdSense
 * cuyo id copies en `NEXT_PUBLIC_ADSENSE_SLOT_BIBLIOTECA`.
 */
export function AdSenseBibliotecaBanner() {
  useEffect(() => {
    if (!client || !slot) return;
    try {
      const w = window as AdsWindow;
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
    } catch {
      /* AdBlock o script aún no cargado */
    }
  }, []);

  if (!client || !slot) return null;

  return (
    <div className="flex min-h-[90px] w-full justify-center overflow-hidden rounded-2xl border border-white/5 bg-zinc-950/40 py-2">
      <ins
        className="adsbygoogle block w-full max-w-full"
        style={{ display: "block", minHeight: "90px" }}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format="horizontal"
        data-full-width-responsive="true"
      />
    </div>
  );
}
