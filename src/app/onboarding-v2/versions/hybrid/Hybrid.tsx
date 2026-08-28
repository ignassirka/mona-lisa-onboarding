import { useLayoutEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { PadlockOpen, PadlockClosed } from "../../components/Padlocks";
import Spinner from "../../components/Spinner";
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
import { TARGETING_RETICLE_SIZE } from "../../components/TargetingReticle";

/** Visual gap between the targeting reticle's bottom edge and the location chip. */
const PIN_CHIP_GAP = 12;
/** Vertical gap between the header block and the pin/chip group, and between
 * the pin/chip group and the activity-card/CTA group — kept identical on
 * both sides so the three groups read as evenly spaced. */
const GROUP_GAP = 40;
/** Fallback chip height (measured height is used once available) so the
 * very first layout pass — before the `ResizeObserver` reports back — is
 * already correctly centered rather than jumping into place. */
const DEFAULT_CHIP_HEIGHT = 36;

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
   * center) needed to keep the reticle+chip group centered on screen with
   * the reticle 12px above the chip, so `OnboardingV2` can feed it to the
   * shared map's `focusOffsetY`. Derived purely from the chip's measured
   * height plus fixed constants (`PIN_CHIP_GAP`/`GROUP_GAP`) — independent
   * of the header/footer content, so it's stable across acts and exact
   * regardless of font metrics. */
  onPinOffsetChange?: (offsetY: number) => void;
  /** Tier 1's plain-language narration override for the connecting-state
   * headline, and the additive "Still trying…" line — see
   * `versions/types.ts` → `StageOneVersionProps` for the full doc. */
  connectingNarration?: string | null;
  stillTrying?: boolean;
  /** Gates the Plus-only country selector (+ its shared translucent action-
   * area container) below the CTA — `true` only when the "Plan" controller
   * is Plus AND the Sign In screen's "Country selection" sub-toggle is left
   * at "With" (its own default). Defaults to `false`, this component's
   * entire prior behavior, byte-for-byte (no dropdown, no container, no
   * reserved space). */
  showCountrySelect?: boolean;
  /** `null` = "Fastest country" (the default) — single source of truth for
   * the Plus country selector, owned by `OnboardingV2` so it can also drive
   * the shared map's flyTo destination and the protected-state chip once
   * connected. Selecting a country updates ONLY the dropdown's own label;
   * the chip/map/cards/copy below keep showing the user's REAL exposure
   * until `onProtect` actually fires (see `resolveVpnDestination`'s doc). */
  selectedCountry?: string | null;
  onSelectCountry?: (country: string | null) => void;
}

/** "Hybrid" — combines the "Location map spotlight" map/pin/gradient/icon
 * choreography with the "Browsing experience" activity cards into a single
 * centered, three-act scene. Only the location+IP chip and the orchestration
 * that sequences the chip + cards together across acts are new; the map,
 * pin, gradients, spinner, cards and their entrance are all reused
 * unchanged from the two source versions. Element composition is kept
 * separate from the outer container so a split-view layout could reuse the
 * same pieces later without rework. */
export default function Hybrid({
  phase,
  geo,
  isLive,
  onProtect,
  onContinue,
  tone = "straightforward",
  onPinOffsetChange,
  connectingNarration = null,
  stillTrying = false,
  showCountrySelect = false,
  selectedCountry = null,
  onSelectCountry,
}: HybridProps) {
  const reduced = useReducedMotion();
  const copy = CONNECTION_COPY[tone].hybrid;
  const vpnDestination = resolveVpnDestination(selectedCountry);
  const cardCopy = CONNECTION_COPY[tone].browsing;
  const ispKnown = resolveIspKnown(geo);
  const { revealedCount, redactCount, sealed } = useHybridReveal(phase, reduced);
  const rootRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const [chipHeight, setChipHeight] = useState(DEFAULT_CHIP_HEIGHT);

  // Measure the chip's own height (constant across acts — same padding/row
  // height whether loading, showing the real IP, or the resolved VPN
  // identity — but measured rather than assumed so it's exact). Everything
  // else is then positioned in CSS purely from that one number plus the
  // fixed `PIN_CHIP_GAP`/`GROUP_GAP` constants: the pin/chip group is always
  // centered on screen (both axes), and the header/footer groups anchor
  // their near edge exactly `GROUP_GAP` away from it — so the three groups
  // stay evenly spaced and the middle one stays dead-center regardless of
  // how tall the header or footer content is.
  useLayoutEffect(() => {
    const chip = chipRef.current;
    if (!chip) return;
    const measure = () => setChipHeight(chip.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(chip);
    return () => ro.disconnect();
  }, []);

  // Pin/chip group layout, all relative to the viewport's vertical center
  // (0 = dead center, negative = above, positive = below):
  //   groupHeight = reticle + PIN_CHIP_GAP + chip, centered as a whole.
  const groupHalfHeight = (TARGETING_RETICLE_SIZE + PIN_CHIP_GAP + chipHeight) / 2;
  const pinCenterOffset = -groupHalfHeight + TARGETING_RETICLE_SIZE / 2;
  const chipTopOffset = groupHalfHeight - chipHeight;
  const headerBottomOffset = -groupHalfHeight - GROUP_GAP;
  const footerTopOffset = groupHalfHeight + GROUP_GAP;

  useLayoutEffect(() => {
    onPinOffsetChange?.(pinCenterOffset);
  }, [pinCenterOffset, onPinOffsetChange]);

  const isUnprotected = phase === "unprotected";

  return (
    <div ref={rootRef} className="absolute inset-0">
      {/* Header group — icon + title + subtext. Positioned by its BOTTOM
          edge (`bottom`, no `top`), so it grows upward as content is added
          without ever moving the pin/chip group below it — that's what
          keeps the gap between the two groups exactly `GROUP_GAP`
          regardless of copy length or which act is active. */}
      <div className="absolute left-1/2 w-full -translate-x-1/2 px-[40px]" style={{ bottom: `calc(50% - ${headerBottomOffset}px)` }}>
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
            height (title: 1 line; subtext: up to 3 lines) so the block's
            bottom edge never shifts between acts (subtext hidden in Act 2,
            or copy of differing length) — that stable bottom edge is what's
            anchored `GROUP_GAP` above the pin/chip group. The title box
            hugs its bottom (`justify-end`) and the subtext sits just `4px`
            below it, keeping the title↔subtitle gap tight. */}
        <div className="mx-auto w-full max-w-[640px] text-center">
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
                {phase === "protected" ? copy.protectedHeadline : phase === "connecting" ? (connectingNarration ?? copy.connectingHeadline) : copy.exposedHeadline}
              </motion.h1>
            </AnimatePresence>
          </div>

          <div className="mt-[4px] flex min-h-[60px] flex-col items-center">
            <AnimatePresence mode="wait">
              {phase === "connecting" ? (
                stillTrying && <ConnectingNarration key="still-trying" narration={null} stillTrying />
              ) : (
                <motion.p
                  key={phase === "protected" ? "protected-sub" : "exposed-sub"}
                  className="mx-auto max-w-[480px] font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.2 } }}
                  transition={{ delay: isUnprotected ? sec(HYBRID_TIMING.subtextAppear) : 0.2, duration: 0.5, ease: "easeOut" }}
                >
                  {phase === "protected" ? copy.protectedSub(geo.isp, ispKnown) : copy.exposedSub(geo.isp, ispKnown)}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Pin/chip group — the persistent, shared map (`OnboardingMapV2`,
          rendered once by `OnboardingV2` behind this whole overlay) supplies
          the map, pin, targeting reticle, shield aura and top gradient
          (reused unchanged, nothing to render here); `onPinOffsetChange`
          shifts it so the reticle's center sits at `pinCenterOffset` from
          true screen center. The chip below is positioned in lockstep
          (`chipTopOffset`, itself derived from the same measured chip
          height) so together they form one group that's centered on screen
          both horizontally and vertically, with the reticle exactly
          `PIN_CHIP_GAP` (12px) above the chip. */}
      <div ref={chipRef} className="absolute left-1/2 -translate-x-1/2" style={{ top: `calc(50% + ${chipTopOffset}px)` }}>
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

      {/* Footer group — activity card + CTA. Positioned by its TOP edge
          (`top`, no `bottom`), so it grows downward without ever moving the
          pin/chip group above it — same anchoring trick as the header,
          mirrored, keeping the gap on this side exactly `GROUP_GAP` too. */}
      <div className="absolute left-1/2 w-full -translate-x-1/2 px-[40px]" style={{ top: `calc(50% + ${footerTopOffset}px)` }}>
        <div className="mx-auto flex w-full max-w-[440px] flex-col items-center">
          {/* Activity card — same underlying copy pool as "Browsing
              experience", but without Act 2 text scrambling (only the label
              + eye icon redact; the location chip owns the asterisk
              scramble). A single card whose icon + text roll (slot-machine
              style) through the same entries every 3s, for both Free and
              Plus — one card persists through connecting/protected too
              (frozen the moment it starts redacting), rather than a 3-card
              stack that only cycled this way for Plus users with the
              country selector showing. */}
          <div className="flex w-full flex-col gap-[8px]">
            {revealedCount > 0 && (
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
            )}
          </div>

          {(() => {
            // `fullWidth` only applies inside the `showCountrySelect` container
            // (matching its fixed width, below) — the bare Free-style CTA keeps
            // its original intrinsic (whitespace-nowrap) sizing untouched.
            const renderCtaButtons = (fullWidth: boolean, skipEntrance = false) => (
              <div className="flex h-[44px] w-full items-center">
                <AnimatePresence mode="wait">
                  {phase === "unprotected" && (
                    <motion.button
                      key="cta-protect"
                      onClick={onProtect}
                      disabled={!isLive}
                      className={`ob2-cta-glow rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-[background-color,transform,opacity] duration-300 hover:bg-[#7c5cff] active:scale-[0.97] disabled:cursor-default disabled:opacity-50 ${fullWidth ? "w-full" : "whitespace-nowrap"}`}
                      style={{ fontVariationSettings: "'opsz' 12" }}
                      initial={skipEntrance ? false : { opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                      transition={skipEntrance ? { duration: 0.5, ease: "easeOut" } : { delay: sec(HYBRID_TIMING.ctaAppear), duration: 0.5, ease: "easeOut" }}
                    >
                      {copy.ctaProtect}
                    </motion.button>
                  )}
                  {phase === "protected" && (
                    <motion.button
                      key="cta-continue"
                      onClick={onContinue}
                      className={`rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97] ${fullWidth ? "w-full" : "whitespace-nowrap"}`}
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
            );

            // Both CTAs ("Protect my online identity" / "Continue") are
            // full-width so they match the activity card's width above them
            // — same `max-w-[440px]` wrapper, so "full width" here means
            // exactly as wide as the card.
            //
            // showCountrySelect: the country selector and the CTA share one
            // translucent, rounded action-area container (persists across
            // phases so the selector's own mount/unmount at `unprotected`'s end
            // doesn't remount the CTA's AnimatePresence), fixed to the
            // selector's own width so the full-width CTA lines up with it —
            // otherwise unchanged, the bare CTA block exactly as before, no
            // container, no reserved space.
            if (!showCountrySelect) {
              return <div className="mt-[20px] w-full">{renderCtaButtons(true)}</div>;
            }
            return (
              <motion.div
                className="mt-[20px] flex w-full flex-col items-center gap-[16px] rounded-[16px] bg-[rgba(255,255,255,0.05)] p-[16px] backdrop-blur-[6px]"
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: reduced ? 0 : sec(HYBRID_TIMING.ctaAppear), duration: 0.5, ease: "easeOut" }}
              >
                {phase === "unprotected" && <CountrySelect value={selectedCountry} onChange={(c) => onSelectCountry?.(c)} />}
                {renderCtaButtons(true, true)}
              </motion.div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
