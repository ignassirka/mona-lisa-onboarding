import type { ReactNode } from "react";
import { motion } from "motion/react";
import Spinner from "./Spinner";
import { PadlockOpen, PadlockClosed } from "./Padlocks";
import type { InfoRow } from "./InfoCard";
import { ENTRANCE_TIMING, sec } from "../lib/entranceTiming";

type Phase = "unprotected" | "connecting" | "protected";

interface ControlPanelOverlayProps {
  phase: Phase;
  headline: ReactNode;
  subtext: ReactNode;
  rows: InfoRow[];
  heading?: ReactNode;
  loading: boolean;
  ctaProtectLabel: string;
  isLive: boolean;
  onProtect: () => void;
  onContinue: () => void;
}

/** V2-A — "Side control panel". A solid left rail (dashboard) over the offset map. */
export default function ControlPanelOverlay({
  phase,
  headline,
  subtext,
  rows,
  heading,
  loading,
  ctaProtectLabel,
  isLive,
  onProtect,
  onContinue,
}: ControlPanelOverlayProps) {
  const isUnprotected = phase === "unprotected";
  // Per-phase entrance delays: unprotected uses the long cinematic timeline,
  // later phases snap in quickly.
  const d = (unprotectedMs: number, quick: number) => (isUnprotected ? sec(unprotectedMs) : quick);

  return (
    <motion.div
      className="absolute inset-y-0 left-0 z-[10] flex w-[400px] flex-col overflow-hidden border-r border-[rgba(255,255,255,0.1)] bg-[rgba(22,20,28,0.85)] px-[32px] pb-[32px] pt-[64px] backdrop-blur-[24px]"
      initial={{ opacity: 0, x: -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: isUnprotected ? sec(ENTRANCE_TIMING.gradientFadeStart) : 0 }}
    >
      {/* Icon */}
      <motion.div
        className="mb-[16px] flex h-[40px] w-[40px] items-center justify-center"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: d(ENTRANCE_TIMING.padlockAppear, 0), duration: 0.5, ease: "easeOut" }}
      >
        {phase === "unprotected" && <PadlockOpen />}
        {phase === "connecting" && <Spinner size={34} />}
        {phase === "protected" && <PadlockClosed />}
      </motion.div>

      {/* Headline */}
      <motion.h1
        className="font-['Segoe_UI_Variable',sans-serif] text-[26px] font-semibold leading-[32px] text-white"
        style={{ fontVariationSettings: "'opsz' 24" }}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: d(ENTRANCE_TIMING.headlineAppear, 0.12), duration: 0.5, ease: "easeOut" }}
      >
        {headline}
      </motion.h1>

      {/* Subtext */}
      {subtext && (
        <motion.p
          className="mt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.7)]"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: d(ENTRANCE_TIMING.subtextAppear, 0.24), duration: 0.5, ease: "easeOut" }}
        >
          {subtext}
        </motion.p>
      )}

      {/* Exposure / status list */}
      <div className="mt-[28px] flex flex-col gap-[12px]">
        {heading && (
          <motion.p
            className="font-['Segoe_UI_Variable',sans-serif] text-[13px] uppercase tracking-wide leading-[16px] text-[rgba(255,255,255,0.45)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: d(ENTRANCE_TIMING.infoRowBase, 0.15), duration: 0.3 }}
          >
            {heading}
          </motion.p>
        )}
        {rows.map((row, i) => (
          <motion.div
            key={row.key}
            className="flex items-center justify-between gap-[12px] rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[12px] py-[10px]"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: d(ENTRANCE_TIMING.infoRowBase + (i + 1) * ENTRANCE_TIMING.infoRowStagger, 0.2 + i * 0.08), duration: 0.35, ease: "easeOut" }}
          >
            <span
              className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]"
              style={{ fontFeatureSettings: '"rclt" 0' }}
            >
              {row.label}
            </span>
            <span
              className="flex min-w-0 justify-end truncate text-right font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
              style={{ fontVariationSettings: "'opsz' 12" }}
            >
              {loading && row.skeletonWidth ? (
                <span className="block h-[14px] animate-pulse rounded-[4px] bg-[rgba(255,255,255,0.18)]" style={{ width: row.skeletonWidth }} />
              ) : (
                row.value
              )}
            </span>
          </motion.div>
        ))}
      </div>

      {/* CTA docked at the bottom */}
      <div className="mt-auto pt-[24px]">
        {phase === "protected" ? (
          <motion.button
            onClick={onContinue}
            className="w-full rounded-[6px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98]"
            style={{ fontVariationSettings: "'opsz' 12" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}
          >
            Continue
          </motion.button>
        ) : (
          <motion.button
            onClick={onProtect}
            disabled={phase === "connecting" || !isLive}
            className="ob2-cta-glow w-full rounded-[6px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
            style={{ fontVariationSettings: "'opsz' 12" }}
            initial={isUnprotected ? { opacity: 0, y: 16 } : false}
            animate={isUnprotected ? { opacity: 1, y: 0 } : undefined}
            transition={isUnprotected ? { delay: sec(ENTRANCE_TIMING.ctaAppear), duration: 0.5, ease: "easeOut" } : undefined}
          >
            {phase === "connecting" ? "Securing\u2026" : ctaProtectLabel}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}
