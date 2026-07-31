import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Check } from "lucide-react";
import Spinner from "../../components/Spinner";
import { PadlockOpen, PadlockClosed } from "../../components/Padlocks";
import ConnectionBackdrop from "../lib/ConnectionBackdrop";
import ConfirmationFooter from "../lib/ConfirmationFooter";
import ConnectingNarration from "../../components/ConnectingNarration";
import { useReducedMotion } from "../lib/useReducedMotion";
import ActivityFeed from "./ActivityFeed";
import { V4_TIMING } from "./timing";
import type { StageOneVersionProps } from "../types";

const V4_CSS = `
  @keyframes ob2v4-blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
  .ob2v4-caret { display: inline-block; width: 2px; height: 1em; margin-left: 2px; vertical-align: text-bottom;
    background: rgba(255,255,255,0.8); animation: ob2v4-blink 1s steps(1) infinite; }
  @keyframes ob2v4-shimmer { 0%,100% { opacity: 0.5; } 50% { opacity: 0.85; } }
  .ob2v4-lock-shimmer { animation: ob2v4-shimmer 1.4s ease-in-out infinite; }
  .ob2v4-scroll::-webkit-scrollbar { width: 6px; }
  .ob2v4-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.14); border-radius: 3px; }
`;

/** V4 — "In Plain Sight", Split view. Same diary concept and data as the
 * centered layout, arranged as a left rail (title/subtitle/CTA, matching the
 * "Location map spotlight" split's dashboard convention) + a right-hand diary
 * feed panel that fills the remaining height. */
export default function InPlainSightSplit({ phase, isLive, onProtect, onContinue, copy, connectingNarration = null, stillTrying = false }: StageOneVersionProps) {
  const reduced = useReducedMotion();
  const [revealed, setRevealed] = useState(0);
  const onRevealedCountChange = useCallback((n: number) => setRevealed(n), []);

  const visibleLabel = copy.visibleLabel;
  const isUnprotected = phase === "unprotected";

  const showCta = phase === "unprotected" && revealed >= V4_TIMING.ctaAfterEntry;

  const headline =
    phase === "protected"
      ? copy.protectedHeadline
      : phase === "connecting"
        ? connectingNarration ?? copy.connectingHeadline
        : copy.exposedHeadline;

  return (
    <div className="absolute inset-0 overflow-hidden">
      <style>{V4_CSS}</style>
      <ConnectionBackdrop phase={phase} />

      <div className="relative z-10 flex h-full w-full">
        {/* Left rail — title/subtitle and button are centered as one group */}
        <motion.div
          className="flex w-[380px] shrink-0 flex-col justify-center overflow-hidden border-r border-[rgba(255,255,255,0.1)] bg-[rgba(22,20,28,0.85)] px-[32px] py-[64px] backdrop-blur-[24px]"
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div key={phase} className="flex flex-col">
            <motion.div
              className="mb-[16px] flex h-[36px] w-[36px] items-center justify-center"
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isUnprotected ? V4_TIMING.padlockAppear / 1000 : 0, duration: 0.5, ease: "easeOut" }}
            >
              {phase === "unprotected" && <PadlockOpen />}
              {phase === "connecting" && <Spinner size={32} />}
              {phase === "protected" && <PadlockClosed />}
            </motion.div>

            <motion.h1
              className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
              style={{ fontVariationSettings: "'opsz' 22" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isUnprotected ? V4_TIMING.headlineAppear / 1000 : 0.12, duration: 0.5, ease: "easeOut" }}
            >
              {headline}
            </motion.h1>

            {isUnprotected && (
              <motion.p
                className="mt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: V4_TIMING.subtextAppear / 1000, duration: 0.5, ease: "easeOut" }}
              >
                {copy.exposedSub}
              </motion.p>
            )}

            {phase === "protected" && (
              <motion.div
                className="mt-[10px] flex items-center gap-[8px]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: V4_TIMING.finalCardIn / 1000, ease: "easeOut" }}
              >
                <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full bg-[rgba(44,255,204,0.15)] text-[#2cffcc]">
                  <Check size={12} strokeWidth={3} />
                </span>
                <p className="font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.7)]">
                  {copy.sealCard}
                </p>
              </motion.div>
            )}
            {phase === "connecting" && stillTrying && (
              <ConnectingNarration narration={null} stillTrying align="left" className="mt-[6px]" />
            )}
          </div>

          {/* CTA / Continue + confirmation footer — part of the centered group */}
          <div className="mt-[28px] flex flex-col gap-[12px]">
            <AnimatePresence mode="wait">
              {phase === "protected" ? (
                <motion.div
                  key="protected-actions"
                  className="flex flex-col gap-[12px]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4 }}
                >
                  <ConfirmationFooter delay={0.2} />
                  <motion.button
                    onClick={onContinue}
                    className="w-full rounded-[6px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98]"
                    style={{ fontVariationSettings: "'opsz' 12" }}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.55, ease: "easeOut" }}
                  >
                    {copy.continue}
                  </motion.button>
                </motion.div>
              ) : showCta ? (
                <motion.button
                  key="cta"
                  onClick={onProtect}
                  disabled={!isLive}
                  className="ob2-cta-glow w-full rounded-[6px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
                  style={{ fontVariationSettings: "'opsz' 12" }}
                  initial={{ opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                >
                  {copy.cta}
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Right panel — diary cards centered vertically */}
        <div className="flex min-w-0 flex-1 items-center px-[36px] py-[64px]">
          <div className="w-full">
            <ActivityFeed
              phase={phase}
              visibleLabel={visibleLabel}
              redactingLabel={copy.redactingLabel}
              sealedLabel={copy.sealedLabel}
              reduced={reduced}
              startDelay={V4_TIMING.feedStart}
              onRevealedCountChange={onRevealedCountChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
