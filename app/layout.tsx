import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
import { loadCatalog } from "@/lib/data/load-catalog";
import "./globals.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Lovioo — Swipe. Love. Shop.",
  description: "Discover products you'll love, compare deals across Shopee, Lazada, TikTok Shop and Amazon, and shop smarter with AI insights.",
  icons: { icon: "/icon.svg" },
};

export const viewport: Viewport = {
  themeColor: "#FF2D9A",
};

// Re-read the catalog from Supabase at most once a minute, so admin edits show up quickly.
export const revalidate = 60;

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const catalog = await loadCatalog();
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans">
        <Providers catalog={catalog.source === "supabase" ? catalog : null}>{children}</Providers>
      </body>
    </html>
  );
}
