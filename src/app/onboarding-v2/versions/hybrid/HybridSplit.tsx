import { motion, AnimatePresence } from "motion/react";
import { PadlockOpen, PadlockClosed } from "../../components/Padlocks";
import Spinner from "../../components/Spinner";
import ActivityEntry from "../v4-in-plain-sight/ActivityEntry";
import ConnectingNarration from "../../components/ConnectingNarration";
import LocationChip from "./LocationChip";
import CountrySelect from "../../components/CountrySelect";
import CyclingActivityCard from "./CyclingActivityCard";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useHybridReveal, HYBRID_CARDS } from "./useHybridReveal";
import { HYBRID_TIMING, sec } from "./timing";
import { CONNECTION_COPY, resolveIspKnown, type ToneOfVoice } from "../../lib/toneOfVoice";
import { resolveVpnDestination } from "../../lib/server";
import type { ConnectionPhase } from "../types";
import type { GeoInfo } from "../../lib/useIpDetection";

interface HybridSplitProps {
  phase: ConnectionPhase;
  geo: GeoInfo;
  isLive: boolean;
  onProtect: () => void;
  onContinue: () => void;
  tone?: ToneOfVoice;
  connectingNarration?: string | null;
  stillTrying?: boolean;
  /** See `Hybrid.tsx`'s `HybridProps` doc — identical Plus-only country
   * selector contract, just rendered in the left rail here instead of
   * centered above the CTA. */
  showCountrySelect?: boolean;
  selectedCountry?: string | null;
  onSelectCountry?: (country: string | null) => void;
}

/** "Hybrid", Split view. Same content, data and `HYBRID_TIMING` pacing as the
 * Centered layout — reuses `useHybridReveal` for the identical card
 * reveal/redact/connect-timeout sequencing — just rearranged: a left rail
 * (icon/title/subtext/activity cards/CTA) at an even 50/50 split with the
 * right-hand panel, where the persistent map + pin (offset right via
 * `OnboardingV2`'s `focusOffsetX`, recomputed for the 50/50 rail — see
 * `splitFocusOffsetX` there) show through, with the location+IP chip
 * anchored in its lower half, below where the pin sits — unlike the browsing
 * split, which is map-less and opaque, Hybrid keeps the map visible since
 * it's core to what makes this version "Hybrid". No vertical pin *measurement*
 * is attempted here (matching the existing map-spotlight split's own
 * precedent) — only the Centered layout needs that, since only there does the
 * pin sit in a dedicated gap between two specific elements; here the chip is
 * simply anchored to the panel's bottom half, which reads as "below the pin"
 * without needing to measure the pin's exact position. The cards region
 * reserves a fixed height (`min-h-[164px]`, matching the Centered layout's own
 * reservation) so the CTA below it doesn't drift as cards reveal
 * progressively (the rail centers its content as one block via
 * `justify-center`). */
export default function HybridSplit({
  phase,
  geo,
  isLive,
  onProtect,
  onContinue,
  tone = "straightforward",
  connectingNarration = null,
  stillTrying = false,
  showCountrySelect = false,
  selectedCountry = null,
  onSelectCountry,
}: HybridSplitProps) {
  const reduced = useReducedMotion();
  const copy = CONNECTION_COPY[tone].hybrid;
  const cardCopy = CONNECTION_COPY[tone].browsing;
  const ispKnown = resolveIspKnown(geo);
  const { revealedCount, redactCount, sealed } = useHybridReveal(phase, reduced);
  const isUnprotected = phase === "unprotected";
  const vpnDestination = resolveVpnDestination(selectedCountry);

  return (
    <div className="absolute inset-0 flex">
      {/* Left rail — icon/title/subtext/cards/CTA centered as one group, 50% width */}
      <div className="flex w-1/2 shrink-0 flex-col justify-center overflow-hidden border-r border-[rgba(255,255,255,0.1)] bg-[rgba(22,20,28,0.85)] px-[32px] py-[64px] backdrop-blur-[24px]">
        <div className="flex flex-col">
          <div className="mb-[16px] flex h-[36px] w-[36px] items-center justify-center">
            <AnimatePresence mode="wait">
              {phase === "unprotected" && (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.25 } }}
                  transition={{ delay: sec(HYBRID_TIMING.padlockAppear), duration: 0.5, ease: "easeOut" }}
                >
                  <PadlockOpen />
                </motion.div>
              )}
              {phase === "connecting" && (
                <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <Spinner size={32} />
                </motion.div>
              )}
              {phase === "protected" && (
                <motion.div key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
                  <PadlockClosed />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.h1
              key={phase === "protected" ? "protected-title" : phase === "connecting" ? "connecting-title" : "exposed-title"}
              className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
              style={{ fontVariationSettings: "'opsz' 22" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ delay: isUnprotected ? sec(HYBRID_TIMING.headlineAppear) : 0.12, duration: 0.5, ease: "easeOut" }}
            >
              {phase === "protected" ? copy.protectedHeadline : phase === "connecting" ? (connectingNarration ?? copy.connectingHeadline) : copy.exposedHeadline}
            </motion.h1>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {phase === "connecting" ? (
              stillTrying && <ConnectingNarration key="still-trying" narration={null} stillTrying align="left" className="mt-[10px]" />
            ) : (
              <motion.p
                key={phase === "protected" ? "protected-sub" : "exposed-sub"}
                className="mt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                transition={{ delay: isUnprotected ? sec(HYBRID_TIMING.subtextAppear) : 0.24, duration: 0.5, ease: "easeOut" }}
              >
                {phase === "protected" ? copy.protectedSub(geo.isp, ispKnown) : copy.exposedSub(geo.isp, ispKnown)}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* Activity card(s) — same component as "Browsing experience", but
            without Act 2 text scrambling (only labels + eye icon redact; the
            location chip owns the asterisk scramble). Moved here (between the
            text and the CTA) per the confirmed rail arrangement. When the
            Plus country selector is showing, swaps to a single slot-machine
            style cycling card — see `Hybrid.tsx`'s identical doc. Reserves
            the taller (3-card) height whenever that's the active variant
            (matching the Centered layout's own reservation) so the CTA below
            doesn't drift as cards reveal progressively. */}
        <div className={`mx-auto mt-[20px] flex w-full max-w-[440px] flex-col gap-[8px] ${showCountrySelect ? "" : "min-h-[164px]"}`}>
          {showCountrySelect ? (
            revealedCount > 0 && (
              <CyclingActivityCard
                entries={HYBRID_CARDS}
                visibleLabel={cardCopy.visibleLabel}
                redactingLabel={cardCopy.redactingLabel}
                sealedLabel={cardCopy.sealedLabel}
                redact={redactCount > 0}
                sealed={sealed}
                reduced={reduced}
                paused={phase === "connecting"}
              />
            )
          ) : (
            HYBRID_CARDS.slice(0, revealedCount).map((entry, i) => (
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
                scrambleText={false}
              />
            ))
          )}
        </div>

        {(() => {
          const renderCtaButtons = (skipEntrance = false) => (
            <AnimatePresence mode="wait">
              {phase === "unprotected" && (
                <motion.button
                  key="cta-protect"
                  onClick={onProtect}
                  disabled={!isLive}
                  className="ob2-cta-glow w-full rounded-[6px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98] disabled:cursor-default disabled:opacity-50"
                  style={{ fontVariationSettings: "'opsz' 12" }}
                  initial={skipEntrance ? false : { opacity: 0, y: 16, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2 } }}
                  transition={skipEntrance ? { duration: 0.45, ease: "easeOut" } : { delay: sec(HYBRID_TIMING.ctaAppear), duration: 0.45, ease: "easeOut" }}
                >
                  {copy.ctaProtect}
                </motion.button>
              )}
              {phase === "protected" && (
                <motion.button
                  key="cta-continue"
                  onClick={onContinue}
                  className="w-full rounded-[6px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98]"
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
          );

          // showCountrySelect: the country selector and the CTA share one
          // translucent, rounded action-area container (persists across
          // phases so the selector's own mount/unmount at `unprotected`'s
          // end doesn't remount the CTA's AnimatePresence) — otherwise
          // unchanged, the bare CTA block exactly as before.
          if (!showCountrySelect) {
            return <div className="mt-[24px] flex flex-col gap-[12px]">{renderCtaButtons()}</div>;
          }
          return (
            <motion.div
              className="mx-auto mt-[24px] flex w-full max-w-[440px] flex-col gap-[16px] rounded-[16px] bg-[rgba(255,255,255,0.05)] p-[16px] backdrop-blur-[6px]"
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: reduced ? 0 : sec(HYBRID_TIMING.ctaAppear), duration: 0.5, ease: "easeOut" }}
            >
              {phase === "unprotected" && <CountrySelect value={selectedCountry} onChange={(c) => onSelectCountry?.(c)} />}
              {renderCtaButtons(true)}
            </motion.div>
          );
        })()}
      </div>

      {/* Right panel — the location+IP chip only (the activity cards moved to
          the left rail above). The persistent map + pin show through behind
          it (transparent), offset right by `OnboardingV2` so the pin lands
          centered in this region, same technique as the map-spotlight split.
          Split into two equal halves: the top is left empty for the pin, the
          chip sits centered within the bottom half — anchoring it below the
          pin without needing to measure the pin's exact position. */}
      <div className="flex w-1/2 min-w-0 flex-col px-[36px] py-[64px]">
        <div className="flex-1" />
        <div className="flex flex-1 items-center justify-center">
          <LocationChip
            phase={phase}
            country={geo.country}
            countryCode={geo.countryCode}
            ip={geo.ip}
            isLive={isLive}
            reduced={reduced}
            vpnCountry={vpnDestination.country}
            vpnCountryCode={vpnDestination.countryCode}
            vpnIp={vpnDestination.vpnIp}
          />
        </div>
      </div>
    </div>
  );
}
