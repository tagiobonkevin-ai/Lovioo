import type { MetadataRoute } from "next";

/** Makes Lovioo installable ("Add to Home Screen") with an app icon and full-screen look. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lovioo — Swipe. Love. Shop.",
    short_name: "Lovioo",
    description: "Swipe products you'll love and compare prices across Shopee, Lazada, TikTok Shop and more.",
    id: "/",
    start_url: "/discover?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#FFF7F1",
    theme_color: "#FF4FB8",
    categories: ["shopping", "lifestyle"],
    lang: "en-PH",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Swipe", short_name: "Swipe", url: "/swipe", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Brand Crush", short_name: "Brands", url: "/brands", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Saved", short_name: "Saved", url: "/saved", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
