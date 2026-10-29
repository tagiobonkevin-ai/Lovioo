import localFont from "next/font/local";

// The font files live in app/_fonts (latin subset, from Google Fonts, SIL Open Font License) so a build never has to
// download them: Google's font servers failing mid-build took a production deploy down once.

/** Editorial serif for big headlines (home, sign-in, questionnaire). Use with `font-[family-name:var(--font-serif)]`. */
export const serif = localFont({
  src: [
    { path: "./_fonts/instrument-serif.woff2", weight: "400", style: "normal" },
    { path: "./_fonts/instrument-serif-italic.woff2", weight: "400", style: "italic" },
  ],
  variable: "--font-serif",
  adjustFontFallback: "Times New Roman",
});

/**
 * The front page's type pair. Newsreader is an old-style serif in the Plantin family used for every heading, the
 * chat line and prices; Inter carries the small uppercase labels and buttons. Headings sit at weight 500 with
 * -0.012em tracking and roomy line-height, which is what makes the page read as calm rather than loud.
 */
export const display = localFont({
  src: [
    { path: "./_fonts/newsreader.woff2", weight: "400 500", style: "normal" },
    { path: "./_fonts/newsreader-italic.woff2", weight: "400 500", style: "italic" },
  ],
  variable: "--font-display",
  adjustFontFallback: "Times New Roman",
});
export const ui = localFont({ src: "./_fonts/inter.woff2", weight: "400 600", style: "normal", variable: "--font-ui" });

/** The app's body font. */
export const poppins = localFont({
  src: [
    { path: "./_fonts/poppins-400.woff2", weight: "400", style: "normal" },
    { path: "./_fonts/poppins-500.woff2", weight: "500", style: "normal" },
    { path: "./_fonts/poppins-600.woff2", weight: "600", style: "normal" },
    { path: "./_fonts/poppins-700.woff2", weight: "700", style: "normal" },
    { path: "./_fonts/poppins-800.woff2", weight: "800", style: "normal" },
  ],
  variable: "--font-poppins",
});
