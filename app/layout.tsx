import type { Metadata, Viewport } from "next";
import { Righteous, Poppins } from "next/font/google";
import { GoogleAdSense } from "@/components/GoogleAdSense";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import "./globals.css";

const righteous = Righteous({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-righteous",
  display: "swap",
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  title: "Manwhaki",
  description: "Lee tus manhwas favoritos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Manwhaki",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0a0a0a",
};

function supabaseStorageOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const storageOrigin = supabaseStorageOrigin();

  return (
    <html lang="es" className={`${righteous.variable} ${poppins.variable}`}>
      <head>
        {storageOrigin ? (
          <link rel="preconnect" href={storageOrigin} crossOrigin="anonymous" />
        ) : null}
        <GoogleAdSense />
      </head>
      <body className="min-h-dvh bg-surface font-sans">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
