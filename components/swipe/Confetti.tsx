"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

const COLORS = ["#FF2D9A", "#FF6B4A", "#FFB84D", "#A855F7", "#3B82F6", "#10B981"];

export function Confetti({ count = 60 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1.6 + Math.random() * 1.2,
        rotate: Math.random() * 720 - 360,
        drift: Math.random() * 160 - 80,
        color: COLORS[i % COLORS.length],
        shape: i % 3,
      })),
    [count],
  );
  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className="absolute -top-4 block"
          style={{
            left: `${p.left}%`,
            width: p.shape === 2 ? 8 : 10,
            height: p.shape === 0 ? 14 : p.shape === 2 ? 8 : 10,
            background: p.color,
            borderRadius: p.shape === 2 ? 999 : 2,
          }}
          initial={{ y: -20, x: 0, rotate: 0, opacity: 1 }}
          animate={{ y: "105vh", x: p.drift, rotate: p.rotate, opacity: [1, 1, 0.8] }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}
