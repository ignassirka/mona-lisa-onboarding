import { useCallback, useLayoutEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PadlockOpen, PadlockClosed } from "../../components/Padlocks";
import Spinner from "../../components/Spinner";
import ActivityEntry from "../v4-in-plain-sight/ActivityEntry";
import LocationChip from "./LocationChip";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useHybridReveal, HYBRID_CARDS } from "./useHybridReveal";
import { HYBRID_TIMING, sec } from "./timing";
import { CONNECTION_COPY, type ToneOfVoice } from "../../lib/toneOfVoice";
import type { ConnectionPhase } from "../types";
import type { GeoInfo } from "../../lib/useIpDetection";

interface HybridProps {
  phase: ConnectionPhase;
  geo: GeoInfo;
  isLive: boolean;
  onProtect: () => void;
  onContinue: () => void;
  /** Tone of voice for the title/subtext/CTA (map-spotlight-shaped half of
   * this layout) and the activity cards' visible/redacting/sealed labels
   * (reusing `browsing`'s, since the cards are the same reused
   * `ActivityEntry` component) — same axis v1/v2/v4/v4-split already use. */
  tone?: ToneOfVoice;
  /** Reports the vertical pixel offset (from the map's default screen
   * center) needed to keep the pin centered between the subtext and the
   * location chip, so `OnboardingV2` can feed it to the shared map's
   * `focusOffsetY`. Measured (not guessed) so it stays correct regardless of
   * exact text wrapping; only called when the value actually changes. */
  onPinOffsetChange?: (offsetY: number) => void;
}

/** "Hybrid" — combines the "Location map spotlight" map/pin/gradient/icon
 * choreography with the "Browsing experience" activity cards into a single
 * centered, three-act scene. Only the location+IP chip and the orchestration
 * that sequences the chip + cards together across acts are new; the map,
 * pin, gradients, spinner, cards and their redaction are all reused
 * unchanged from the two source versions. Element composition is kept
 * separate from the outer container so a split-view layout could reuse the
 * same pieces later without rework. */
export default function Hybrid({ phase, geo, isLive, onProtect, onContinue, tone = "straightforward", onPinOffsetChange }: HybridProps) {
  const reduced = useReducedMotion();
  const copy = CONNECTION_COPY[tone].hybrid;
  const cardCopy = CONNECTION_COPY[tone].browsing;
  const { revealedCount, redactCount, showConnectHelp, sealed } = useHybridReveal(phase, reduced);
  const rootRef = useRef<HTMLDivElement>(null);
  const headerBottomRef = useRef<HTMLDivElement>(null);
  const chipTopRef = useRef<HTMLDivElement>(null);

  // Report the offset needed to center the map pin vertically between the
  // subtext's bottom edge and the location chip's top edge. The cards region
  // below reserves a fixed height (see its `min-h` below) and the header
  // slots reserve fixed heights, so the chip's position is stable regardless
  // of how many cards have revealed yet or which act is active — but we still
  // re-measure on phase/reveal changes and on resize as a safeguard (e.g.
  // late web-font metrics).
  const measure = useCallback(() => {
    const root = rootRef.current;
    const header = headerBottomRef.current;
    const chip = chipTopRef.current;
    if (!root || !header || !chip || !onPinOffsetChange) return;
    const rootRect = root.getBoundingClientRect();
    const headerBottom = header.getBoundingClientRect().bottom - rootRect.top;
    const chipTop = chip.getBoundingClientRect().top - rootRect.top;
    const midpoint = (headerBottom + chipTop) / 2;
    onPinOffsetChange(midpoint - rootRect.height / 2);
  }, [onPinOffsetChange]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    measure();
    // rAF catches layout that settles just after commit (e.g. font swap).
    const raf = requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [measure]);

  // Re-measure when the phase or the number of revealed cards changes, since
  // either can (in principle) shift the header bottom or chip top.
  useLayoutEffect(() => {
    measure();
  }, [phase, revealedCount, measure]);

  const isUnprotected = phase === "unprotected";

  return (
    <div ref={rootRef} className="absolute inset-0 flex flex-col items-center px-[40px] pb-[24px] pt-[52px]">
      {/* Icon — crossfades between acts (no pop-out/pop-in) */}
      <div className="mb-[10px] flex h-[40px] items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === "unprotected" && (
            <motion.div
              key="open"
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.25 } }}
              transition={{ delay: sec(HYBRID_TIMING.padlockAppear), duration: 0.5, ease: "easeOut" }}
            >
              <PadlockOpen />
            </motion.div>
          )}
          {phase === "connecting" && (
            <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <Spinner />
            </motion.div>
          )}
          {phase === "protected" && (
            <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              <PadlockClosed />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Title + subtext — crossfade, centered. Each slot reserves a fixed
          height (title: 1 line; subtext: up to 3 lines) so the block's bottom
          edge never shifts between acts (subtext hidden in Act 2, or copy of
          differing length) — that stable bottom edge is what the pin centers
          against. The title box hugs its bottom (`justify-end`) and the
          subtext sits just `4px` below it, keeping the title↔subtitle gap
          tight. */}
      <div className="w-full max-w-[640px] text-center">
        <div className="flex min-h-[40px] flex-col items-center justify-end">
          <AnimatePresence mode="wait">
            <motion.h1
              key={phase === "protected" ? "protected-title" : phase === "connecting" ? "connecting-title" : "exposed-title"}
              className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ delay: isUnprotected ? sec(HYBRID_TIMING.headlineAppear) : 0.1, duration: 0.5, ease: "easeOut" }}
            >
              {phase === "protected" ? copy.protectedHeadline : phase === "connecting" ? copy.connectingHeadline : copy.exposedHeadline}
            </motion.h1>
          </AnimatePresence>
        </div>

        <div ref={headerBottomRef} className="mt-[4px] flex min-h-[60px] flex-col items-center">
          <AnimatePresence mode="wait">
            {phase !== "connecting" && (
              <motion.p
                key={phase === "protected" ? "protected-sub" : "exposed-sub"}
                className="mx-auto max-w-[480px] font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ delay: isUnprotected ? sec(HYBRID_TIMING.subtextAppear) : 0.2, duration: 0.5, ease: "easeOut" }}
              >
                {phase === "protected" ? copy.protectedSub(geo.isp) : copy.exposedSub(geo.isp)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Map + pulsating pin breathing room. The persistent, shared map
          (`OnboardingMapV2`, rendered once by `OnboardingV2` behind this
          whole overlay) supplies the map, pin, targeting reticle, shield
          aura and top gradient — reused unchanged, nothing to render here.
          Its height is whatever's left between the (now-stable) header
          block above and the chip below; `onPinOffsetChange` (measured
          below) keeps the pin centered in it. */}
      <div className="min-h-[110px] flex-1" />

      {/* Location + IP chip — new; real data in Act 1, scrambles in Act 2,
          resolves to the VPN identity in Act 3. */}
      <div ref={chipTopRef}>
        <LocationChip phase={phase} country={geo.country} countryCode={geo.countryCode} ip={geo.ip} isLive={isLive} reduced={reduced} />
      </div>

      {/* 3 activity cards — same component + redaction as "Browsing
          experience". The region reserves the full 3-card height up front
          (`min-h`) so the chip above it doesn't drift down/up as cards reveal
          progressively — that stability is what keeps the pin centered. */}
      <div className="mt-[14px] flex min-h-[164px] w-full max-w-[560px] flex-col gap-[8px]">
        {HYBRID_CARDS.slice(0, revealedCount).map((entry, i) => (
          <ActivityEntry
            key={entry.id}
            entry={entry}
            visibleLabel={cardCopy.visibleLabel}
            redactingLabel={cardCopy.redactingLabel}
            sealedLabel={cardCopy.sealedLabel}
            paused={phase !== "unprotected"}
            redact={i < redactCount}
            sealed={sealed}
            reduced={reduced}
          />
        ))}
      </div>

      <AnimatePresence>
        {showConnectHelp && phase === "connecting" && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-[10px] animate-pulse font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]"
          >
            Still connecting…
          </motion.p>
        )}
      </AnimatePresence>

      {/* Buttons */}
      <div className="mt-[20px] flex h-[44px] items-center">
        <AnimatePresence mode="wait">
          {phase === "unprotected" && (
            <motion.button
              key="cta-protect"
              onClick={onProtect}
              disabled={!isLive}
              className="ob2-cta-glow whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-[background-color,transform,opacity] duration-300 hover:bg-[#7c5cff] active:scale-[0.97] disabled:cursor-default disabled:opacity-50"
              style={{ fontVariationSettings: "'opsz' 12" }}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
              transition={{ delay: sec(HYBRID_TIMING.ctaAppear), duration: 0.5, ease: "easeOut" }}
            >
              {copy.ctaProtect}
            </motion.button>
          )}
          {phase === "protected" && (
            <motion.button
              key="cta-continue"
              onClick={onContinue}
              className="whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97]"
              style={{ fontVariationSettings: "'opsz' 12" }}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={{ duration: 0.5, delay: 0.4, ease: "easeOut" }}
            >
              Continue
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
