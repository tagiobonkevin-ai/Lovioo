import type { Metadata, Viewport } from "next";
import { manrope, newsreader } from "@/app/fonts";
import { Providers } from "@/components/Providers";
import { ConsentedAnalytics } from "@/components/legal/ConsentSheet";
import { SITE_URL } from "@/lib/site";
import { cn } from "@/lib/utils";
import { loadCatalog } from "@/lib/data/load-catalog";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lovioo — Swipe. Love. Shop.",
  description: "Discover products you'll love, compare deals across Shopee, Lazada, TikTok Shop and Amazon, and shop smarter with AI insights.",
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Lovioo", statusBarStyle: "default" },
  applicationName: "Lovioo",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Lovioo — Swipe. Love. Shop.",
    description: "Swipe through products you'll love and compare prices across Shopee, Lazada, TikTok Shop and Amazon.",
    siteName: "Lovioo",
    locale: "en_PH",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#FF4FB8",
  // Lets the app draw under the notch and home bar when installed; layouts pad with safe-area insets.
  viewportFit: "cover",
};

// Re-read the catalog from Supabase at most once a minute, so admin edits show up quickly.
export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalog = await loadCatalog();
  return (
    <html lang="en" className={cn(manrope.variable, newsreader.variable)}>
      <body className="font-sans">
        <Providers catalog={catalog.source === "supabase" ? catalog : null}>{children}</Providers>
        <ConsentedAnalytics />
      </body>
    </html>
  );
}
