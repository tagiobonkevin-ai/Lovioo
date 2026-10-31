import localFont from "next/font/local";

// The font file lives in app/_fonts (latin subset, from Google Fonts, SIL Open Font License) so a build never has to
// download it: Google's font servers failing mid-build took a production deploy down once.

/**
 * Manrope, Lovioo's brand typeface ("modern, clean and friendly"). One variable file covers every weight from 200 to
 * 800; Tailwind's sans, ui, display and poppins families all point at it.
 */
export const manrope = localFont({
  src: "./_fonts/manrope.woff2",
  weight: "200 800",
  style: "normal",
  variable: "--font-manrope",
});
