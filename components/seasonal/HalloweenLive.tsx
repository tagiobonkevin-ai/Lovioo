"use client";

import { useEffect, useState } from "react";
import { isHalloween } from "@/lib/season";
import { HalloweenNote } from "./Halloween";

/**
 * The client-side version for pages built ahead of time (sign-up is a static page, so a note baked in at build
 * time would still be there in December). It decides in the browser, on the day.
 */
export function HalloweenNoteLive({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  useEffect(() => setOn(isHalloween()), []);
  return on ? <HalloweenNote className={className} /> : null;
}

