import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import { Providers } from "@/components/Providers";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body className="font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
