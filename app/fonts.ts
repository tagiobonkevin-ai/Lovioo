import { Instrument_Serif, Inter, Newsreader } from "next/font/google";

/** Editorial serif for big headlines (home, sign-in, questionnaire). Use with `font-[family-name:var(--font-serif)]`. */
export const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });

/**
 * The front page's type pair. Newsreader is an old-style serif in the Plantin family used for every heading, the
 * chat line and prices; Inter carries the small uppercase labels and buttons. Headings sit at weight 500 with
 * -0.012em tracking and roomy line-height, which is what makes the page read as calm rather than loud.
 */
export const display = Newsreader({ subsets: ["latin"], weight: ["400", "500"], style: ["normal", "italic"], variable: "--font-display" });
export const ui = Inter({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-ui" });
