/**
 * Seasonal dressing for the front page and sign-up. The Halloween touches switch themselves off after
 * 5 November, Manila time — nobody has to remember to take them down.
 */

/** Last moment the Halloween touches show: 5 November 2026, 23:59:59 in Manila (UTC+8). */
export const HALLOWEEN_ENDS = new Date("2026-11-05T23:59:59+08:00");

/** Shown from now until the end of 5 November. */
export const isHalloween = (now: Date = new Date()) => now <= HALLOWEEN_ENDS;

export const HALLOWEEN_NOTE = "🎃 Halloween week · deals until Nov 5";
