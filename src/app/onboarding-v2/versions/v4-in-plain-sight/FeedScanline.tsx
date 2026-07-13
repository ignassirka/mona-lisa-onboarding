import { motion } from "motion/react";

/** A subtle horizontal light band that sweeps down the feed, its vertical
 * position synchronized to whichever entry is currently redacting. Pure
 * transform/opacity (perpetual shimmer via CSS); the position move is a
 * one-time framer tween per target. Hidden under reduced motion. */
export default function FeedScanline({ top, visible }: { top: number; visible: boolean }) {
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute left-0 right-0 z-[5] h-[52px]"
      initial={false}
      animate={{ top, opacity: visible ? 1 : 0 }}
      transition={{ top: { duration: 0.45, ease: "easeInOut" }, opacity: { duration: 0.25 } }}
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0) 100%)",
      }}
    />
  );
}
