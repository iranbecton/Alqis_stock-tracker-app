import { Geist, Instrument_Serif } from "next/font/google";

/**
 * Primary UI and body typeface. Clean geometric sans with excellent
 * tabular number support. Self-hosted via next/font — fonts are
 * downloaded at build time and served from the Next.js origin.
 */
export const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

/**
 * Editorial serif for display moments — section headers, daily brief
 * titles, and the "Why Is It Moving" card heading. Used sparingly.
 */
export const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
  weight: "400",
  style: ["normal", "italic"],
});
