import { Instrument_Serif } from "next/font/google";

/** Editorial serif for big headlines (home, sign-in, questionnaire). Use with `font-[family-name:var(--font-serif)]`. */
export const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif" });
