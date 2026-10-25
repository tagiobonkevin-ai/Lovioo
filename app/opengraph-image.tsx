import { ImageResponse } from "next/og";

export const alt = "Lovioo — Swipe. Love. Shop.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social share card in the brand gradient. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(135deg, #FFE3F1 0%, #FFE9E2 50%, #FFF3DE 100%)",
          color: "#0F2742",
        }}
      >
        <div style={{ display: "flex", fontSize: 120, fontWeight: 800, letterSpacing: -4 }}>
          Lovi<span style={{ color: "#FF2D9A" }}>oo</span>
        </div>
        <div style={{ display: "flex", fontSize: 44, marginTop: 8, letterSpacing: 6 }}>
          Swipe. <span style={{ color: "#FF2D9A", margin: "0 14px" }}>Love.</span> Shop.
        </div>
        <div style={{ fontSize: 34, marginTop: 48, color: "#0F2742B3", maxWidth: 900 }}>
          Swipe through products you&apos;ll love and compare prices across Shopee, Lazada, TikTok Shop and Amazon.
        </div>
      </div>
    ),
    size,
  );
}
