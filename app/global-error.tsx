"use client";

import { useEffect } from "react";

/**
 * The last resort: an error thrown by the root layout itself, before any of Lovioo's own styling exists.
 * It has to render its own <html> and <body>, and it can't rely on Tailwind, so the styles are inline.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Lovioo root error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fff",
          color: "#141414",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <div>
          <p style={{ fontSize: "20px", fontWeight: 500, letterSpacing: "-0.01em" }}>Lovioo</p>
          <h1 style={{ fontSize: "28px", fontWeight: 500, lineHeight: 1.35, margin: "24px 0 8px" }}>That didn&apos;t load</h1>
          <p style={{ margin: 0, color: "rgba(20,20,20,0.6)", maxWidth: "40ch" }}>
            Something went wrong on our side. Try again, or come back in a moment.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "24px",
              height: "44px",
              padding: "0 24px",
              background: "#141414",
              color: "#fff",
              border: 0,
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && <p style={{ marginTop: "24px", fontSize: "11px", color: "rgba(20,20,20,0.35)" }}>Reference: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
