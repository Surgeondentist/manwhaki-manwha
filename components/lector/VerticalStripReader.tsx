"use client";

import { useEffect, useRef, useState } from "react";

export type StripPage = {
  pageNumber: number;
  src: string;
};

type VerticalStripReaderProps = {
  pages: StripPage[];
};

function prefetchInBrowser(urls: string[]) {
  for (const src of urls) {
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;
  }
}

export function VerticalStripReader({ pages }: VerticalStripReaderProps) {
  const [furthestVisible, setFurthestVisible] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    panelRefs.current = panelRefs.current.slice(0, pages.length);
  }, [pages.length]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const raw = (entry.target as HTMLElement).dataset.index;
          const idx = raw ? Number.parseInt(raw, 10) : Number.NaN;
          if (Number.isNaN(idx)) continue;
          setFurthestVisible((prev) => Math.max(prev, idx));
        }
      },
      { root: null, rootMargin: "0px 0px 40% 0px", threshold: [0, 0.1] }
    );

    for (const el of panelRefs.current) {
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [pages]);

  useEffect(() => {
    const upcoming = pages
      .slice(furthestVisible + 1, furthestVisible + 5)
      .map((p) => p.src);
    prefetchInBrowser(upcoming);
  }, [furthestVisible, pages]);

  if (pages.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-gold/20 to-petal/10" />
        <p className="text-sm text-zinc-400">
          Este capítulo no tiene páginas aún.
        </p>
        <p className="text-xs text-zinc-400">
          Súbelas con <code className="text-zinc-400">npm run upload:manga</code>
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[100dvw] bg-[#080808]">
      {pages.map((page, index) => {
        const isLead = index === 0;
        return (
          <div
            key={`${page.pageNumber}-${page.src}`}
            ref={(node) => { panelRefs.current[index] = node; }}
            data-index={index}
            className="relative w-full min-w-0 bg-[#080808]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={page.src}
              alt={`Página ${page.pageNumber}`}
              className="block h-auto w-full min-w-0 max-w-full select-none"
              loading={isLead ? "eager" : "lazy"}
              decoding={isLead ? "sync" : "async"}
              draggable={false}
              fetchPriority={isLead ? "high" : "low"}
            />
          </div>
        );
      })}
    </div>
  );
}
