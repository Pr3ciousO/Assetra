"use client";

import { motion, useScroll, useSpring } from "motion/react";

/** Spring-smoothed, scroll-driven progress bar pinned to the top edge. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden
      className="fixed inset-x-0 top-0 z-[70] h-[2px] origin-left bg-frontier shadow-[0_0_12px_rgb(10_245_0/0.8),0_0_2px_rgb(10_245_0)]"
      style={{ scaleX }}
    />
  );
}
