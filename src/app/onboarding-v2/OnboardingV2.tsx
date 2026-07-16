import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import OnboardingMapV2 from "./OnboardingMapV2";
import WindowChrome from "./components/WindowChrome";
import Spinner from "./components/Spinner";
import InfoCard, { FlagValue, MaskedValue, type InfoRow } from "./components/InfoCard";
import JtbdGridPanel from "./JtbdGridPanel";
import TunedResult from "./tuned-result/TunedResult";
import VPNPlusUpsell from "./components/VPNPlusUpsell";
import SimulatedWebCheckout from "./components/checkout/SimulatedWebCheckout";
import LoaderScreen from "./components/LoaderScreen";
import PlusWelcomeState from "./components/PlusWelcomeState";
import ControlPanelOverlay from "./components/ControlPanelOverlay";
import InPlainSight from "./versions/v4-in-plain-sight/InPlainSight";
import InPlainSightSplit from "./versions/v4-in-plain-sight/InPlainSightSplit";
import Hybrid from "./versions/hybrid/Hybrid";
import HybridSplit from "./versions/hybrid/HybridSplit";
import { useIpDetection } from "./lib/useIpDetection";
import { VPN_SERVER } from "./lib/server";
import { ENTRANCE_TIMING, sec } from "./lib/entranceTiming";
import { CONNECTION_COPY, resolveIspKnown, type ToneOfVoice } from "./lib/toneOfVoice";
import type { JtbdId, SelectionMode } from "./lib/jtbdData";
import type { PinStatus } from "./lib/mapKit";
import windowsWallpaperUrl from "../assets/windows-wallpaper.png";

// No separate "tuning" (loader) phase — the consolidated result step
// (`TunedResult`) opens with its own centered intro and IS the
// perceived-progress surface; the picker advances straight to `tuned`.
type Phase =
  | "unprotected"
  | "connecting"
  | "protected"
  | "jtbd"
  | "tuned"
  | "upsell"
  | "web-checkout"
  | "checkout"
  | "plus-welcome";

/** The onboarding flow is sliced into four named stages (see docs/features/onboarding-v2.md).
 * The first three live inside this component's phase machine; "personalization" is the
 * separate "Make Proton VPN yours" modal shown once in the main app after `onExit`. */
export type OnboardingStage = "connection" | "tuning" | "upgrade" | "personalization";

export const ONBOARDING_STAGES: Record<OnboardingStage, { name: string; phases: Phase[] }> = {
  connection: { name: "Establishing VPN connection", phases: ["unprotected", "connecting", "protected"] },
  tuning: { name: "Personalized JTBD tuning", phases: ["jtbd", "tuned"] },
  upgrade: { name: "Upgrade to Plus", phases: ["upsell", "web-checkout", "checkout", "plus-welcome"] },
  personalization: { name: "Final personalization", phases: [] }, // lives in App.tsx (MakeYoursModal), not this phase machine
};

const PHASE_STAGE: Record<Phase, Exclude<OnboardingStage, "personalization">> = {
  unprotected: "connection",
  connecting: "connection",
  protected: "connection",
  jtbd: "tuning",
  tuned: "tuning",
  upsell: "upgrade",
  "web-checkout": "upgrade",
  checkout: "upgrade",
  "plus-welcome": "upgrade",
};

/** Display order for the stage numbering shown in prototype controls (App.tsx). */
export const STAGE_ORDER: OnboardingStage[] = ["connection", "tuning", "upgrade", "personalization"];

/** Per-stage list of interchangeable content versions, for the prototype "Version" dropdown.
 * Only "connection" has real variants today (v1/v2/v4, see OnboardingVariant); the other
 * stages get a single "Default" placeholder until they gain variants of their own. */
export const STAGE_VERSIONS: Record<OnboardingStage, { value: string; label: string }[]> = {
  // "connection" is presented as two groups (see CONNECTION_GROUPS below), each
  // with its own "Layout" sub-choice — not a flat list — so this entry is only
  // used for the stage-level "does this stage have alternatives" check.
  connection: [
    { value: "map-spotlight", label: "#1 - Location map spotlight" },
    { value: "browsing", label: "#2 - Browsing experience" },
    { value: "hybrid", label: "#3 - Hybrid" },
  ],
  // The "Personalized JTBD tuning" stage is a single flow (picker →
  // centered intro → materialization → completion); this list is now a
  // LAYOUT choice for the result step's arrangement, not a content version
  // — see `RESULT_LAYOUT_OPTIONS`/`ResultLayout` below, which this mirrors.
  tuning: [
    { value: "stacked", label: "Minimal list" },
    { value: "compact-list", label: "Richer list" },
    { value: "split-by-status", label: "Split view" },
    { value: "card-grid", label: "Card Grid" },
  ],
  // "Upgrade to Plus" reuses stage 2's SAME 4 layout renderers for its
  // Plus-welcome result (`PlusWelcomeState`) — this list (and the "Layout"
  // dropdown it drives, below) is the exact same shared `resultLayout`
  // state as "tuning", not an independent selector; picking a layout here
  // updates stage 2 too, and vice versa.
  upgrade: [
    { value: "stacked", label: "Minimal list" },
    { value: "compact-list", label: "Richer list" },
    { value: "split-by-status", label: "Split view" },
    { value: "card-grid", label: "Card Grid" },
  ],
  personalization: [{ value: "default", label: "Default" }],
};

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const CONNECT_MS = 3200; // simulated VPN connect (>= 2.5s minimum)

/** Content variant for the Unprotected → Connecting → Protected steps.
 * v1 = original (threat + data card); v2 = "You're in control" (empowerment, keeps data card);
 * v4 = "In Plain Sight" (diary feed, map-less, centered column);
 * v4-split = "In Plain Sight" with a split layout (left rail + right-hand feed);
 * hybrid = "Hybrid" — combines the map-spotlight map/pin/gradient choreography
 * with the browsing-experience activity cards into one centered scene;
 * hybrid-split = "Hybrid" with a split layout (left rail + right-hand chip/cards,
 * map showing through offset right, same technique as v2). */
export type OnboardingVariant = "v1" | "v2" | "v4" | "v4-split" | "hybrid" | "hybrid-split";

export interface ConnectionLayoutOption {
  value: OnboardingVariant;
  label: string;
}

export interface ConnectionGroup {
  value: string;
  label: string;
  layouts: ConnectionLayoutOption[];
}

/** Connection-stage versions, grouped: "#1 - Location map spotlight" has two
 * interchangeable layouts (v1/v2 — same concept, different arrangement), while
 * "#2 - Browsing experience" (v4) has just one. The prototype "Version" dropdown
 * picks a group; a second "Layout" dropdown appears only when the chosen group
 * has more than one layout. */
export const CONNECTION_GROUPS: ConnectionGroup[] = [
  {
    value: "map-spotlight",
    label: "#1 - Location map spotlight",
    layouts: [
      { value: "v1", label: "Centered" },
      { value: "v2", label: "Split view" },
    ],
  },
  {
    value: "browsing",
    label: "#2 - Browsing experience",
    layouts: [
      { value: "v4", label: "Centered" },
      { value: "v4-split", label: "Split view" },
    ],
  },
  {
    value: "hybrid",
    label: "#3 - Hybrid",
    layouts: [
      { value: "hybrid", label: "Centered" },
      { value: "hybrid-split", label: "Split view" },
    ],
  },
];

export function connectionGroupForVariant(variant: OnboardingVariant): ConnectionGroup {
  return CONNECTION_GROUPS.find((g) => g.layouts.some((l) => l.value === variant)) ?? CONNECTION_GROUPS[0]!;
}

/** Layout for the "Personalized JTBD tuning" stage's result step. The stage
 * itself is a single flow (grid picker → centered intro → one-by-one
 * materialization → completion, formerly "Visual Tuning" — now the only
 * flow); `ResultLayout` only picks the RESOLVED ARRANGEMENT of the 5 settings
 * items — everything else (intro, header move, counter, completion, tip,
 * Continue) is identical across all four. `stacked` is the default (the
 * former "Visual Tuning" row style — merged "{settingsName}: {value}" pill,
 * no per-row background). `compact-list` reuses the former "Default"
 * version's simpler row style (`EnabledFeatureRow`/`PaidFeatureRow`'s
 * existing `layout="row"` mode). `split-by-status`/`card-grid` reuse those
 * former versions' arrangements (`layout="stacked"`/`"card"`), now adapted
 * to materialize one item at a time into their columns/cards instead of
 * appearing fully-formed. See `docs/features/onboarding-v2.md`. */
export type ResultLayout = "stacked" | "split-by-status" | "card-grid" | "compact-list";

interface OnboardingV2Props {
  /** Fired once onboarding completes normally (Continue free / Start using
   * VPN Plus) — receives the ordered list of JTBDs the user actually ended
   * up with (Single mode: the one pick, as a 1-item array; Multiple mode:
   * the full ordered selection), so the main app can default to the
   * Profiles tab and generate profile items for them. Empty/omitted when
   * onboarding is abandoned via Skip (no real intent was ever committed).
   * The second argument is the session plan: `"free"` for Continue free and
   * all Skip exits; `"plus"` only after in-session checkout → Plus Welcome. */
  onExit?: (selectedJtbds?: JtbdId[], plan?: import("../lib/sessionPlan").SessionPlan) => void;
  /** Fired by the window chrome's "X" close control — distinct from
   * `onExit` (which hands off to the main app once onboarding completes
   * normally): this returns to the prototype's initial start screen (the
   * 3-button screen), same as closing the real app window mid-onboarding. */
  onClose?: () => void;
  variant?: OnboardingVariant;
  /** Result layout for the JTBD tuning stage. */
  resultLayout?: ResultLayout;
  /** Tone of voice for the connection stage copy (content only). */
  tone?: ToneOfVoice;
  /** "Selection" prototype control — defaults to `"single"`, which is the
   * ENTIRE stage's pre-existing behavior, byte-for-byte. `"multiple"` lets
   * the JTBD picker select 1–6 intents; see docs/features/onboarding-v2.md
   * → "Multiple-mode tuning". */
  selectionMode?: SelectionMode;
  /** Fired whenever the active stage changes, so prototype controls (App.tsx) can display it. */
  onStageChange?: (stage: OnboardingStage) => void;
}

const ICON_SIZE = 34;

function PadlockOpen() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M5 1.25C2.23858 1.25 0 3.48858 0 6.25V6.875C0 7.22018 0.279822 7.5 0.625 7.5C0.970178 7.5 1.25 7.22018 1.25 6.875V6.25C1.25 4.17893 2.92893 2.5 5 2.5C7.07107 2.5 8.75 4.17893 8.75 6.25C7.51456 6.25096 6.86698 6.26672 6.36502 6.52248C5.89462 6.76217 5.51217 7.14462 5.27248 7.61502C5 8.1498 5 8.84987 5 10.25V14.75C5 16.1501 5 16.8502 5.27248 17.385C5.51217 17.8554 5.89462 18.2378 6.36502 18.4775C6.8998 18.75 7.59987 18.75 9 18.75H16C17.4001 18.75 18.1002 18.75 18.635 18.4775C19.1054 18.2378 19.4878 17.8554 19.7275 17.385C20 16.8502 20 16.1501 20 14.75V10.25C20 8.84987 20 8.1498 19.7275 7.61502C19.4878 7.14462 19.1054 6.76217 18.635 6.52248C18.1002 6.25 17.4001 6.25 16 6.25H10C10 3.48858 7.76142 1.25 5 1.25ZM13.0883 12.3532C13.4821 12.1428 13.75 11.7277 13.75 11.25C13.75 10.5596 13.1904 10 12.5 10C11.8096 10 11.25 10.5596 11.25 11.25C11.25 11.7277 11.5179 12.1428 11.9117 12.3532L11.3665 14.534C11.3073 14.7707 11.4863 15 11.7303 15H13.2697C13.5137 15 13.6927 14.7707 13.6335 14.534L13.0883 12.3532Z" fill="#F7607B" />
    </svg>
  );
}

function PadlockClosed() {
  return (
    <svg width={ICON_SIZE} height={ICON_SIZE} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.5 6.25H6.25C6.25 4.17893 7.92893 2.5 10 2.5C12.0711 2.5 13.75 4.17893 13.75 6.25H13.5H6.5ZM5 6.27399V6.25C5 3.48858 7.23858 1.25 10 1.25C12.7614 1.25 15 3.48858 15 6.25V6.27399C15.4903 6.30392 15.8381 6.37121 16.135 6.52248C16.6054 6.76217 16.9878 7.14462 17.2275 7.61502C17.5 8.1498 17.5 8.84987 17.5 10.25V14.75C17.5 16.1501 17.5 16.8502 17.2275 17.385C16.9878 17.8554 16.6054 18.2378 16.135 18.4775C15.6002 18.75 14.9001 18.75 13.5 18.75H6.5C5.09987 18.75 4.3998 18.75 3.86502 18.4775C3.39462 18.2378 3.01217 17.8554 2.77248 17.385C2.5 16.8502 2.5 16.1501 2.5 14.75V10.25C2.5 8.84987 2.5 8.1498 2.77248 7.61502C3.01217 7.14462 3.39462 6.76217 3.86502 6.52248C4.16191 6.37121 4.50973 6.30392 5 6.27399ZM10.5883 12.3532C10.9821 12.1428 11.25 11.7277 11.25 11.25C11.25 10.5596 10.6904 10 10 10C9.30964 10 8.75 10.5596 8.75 11.25C8.75 11.7277 9.01793 12.1428 9.4117 12.3532L8.86649 14.534C8.80732 14.7707 8.98633 15 9.23029 15H10.7697C11.0137 15 11.1927 14.7707 11.1335 14.534L10.5883 12.3532Z" fill="#2CFFCC" />
    </svg>
  );
}

export default function OnboardingV2({
  onExit,
  onClose,
  variant = "hybrid",
  resultLayout = "stacked",
  tone = "straightforward",
  selectionMode = "single",
  onStageChange,
}: OnboardingV2Props) {
  const { geo, isLive } = useIpDetection();
  const [phase, setPhase] = useState<Phase>("unprotected");
  const [scrambleActive, setScrambleActive] = useState(false);
  const [selectedJtbd, setSelectedJtbd] = useState<JtbdId | null>(null);
  // Multiple mode only — ordered selection (first-selected first). Single
  // mode never reads or writes this; toggling a JTBD in/out preserves every
  // other pick's relative order, which is what drives the merge engine's
  // "first-selected wins" rules.
  const [selectedJtbds, setSelectedJtbds] = useState<JtbdId[]>([]);
  const toggleSelectedJtbd = useCallback((id: JtbdId) => {
    setSelectedJtbds((prev) => (prev.includes(id) ? prev.filter((j) => j !== id) : [...prev, id]));
  }, []);
  // The single value every downstream phase (Tuned Result, Upsell, Plus
  // Welcome) actually keys off — single mode's own `selectedJtbd`, or
  // Multiple mode's first-selected JTBD (confirmed at checkpoint: stage 3
  // stays entirely unchanged, keyed off this one value exactly as single
  // mode keys off its own single pick).
  const effectiveJtbdKey: JtbdId | null = selectionMode === "multiple" ? selectedJtbds[0] ?? null : selectedJtbd;
  // The full ordered selection `onExit` hands off to the main app — Single
  // mode's own one pick as a 1-item array (or `[]` if somehow none), or
  // Multiple mode's full ordered list.
  const effectiveSelectedJtbds: JtbdId[] = selectionMode === "multiple" ? selectedJtbds : selectedJtbd ? [selectedJtbd] : [];
  // True once "Skip to job selection" is used: the user never actually
  // connects, so the persistent map must keep reading as unprotected (red,
  // real location) instead of the usual protected/teal it shows once the
  // tuning stage is reached the normal way.
  const [skippedConnection, setSkippedConnection] = useState(false);
  // Hybrid measures the gap between its subtext and its location chip and
  // reports the offset needed to keep the map pin centered in it (see
  // Hybrid.tsx). Unused by every other variant (stays 0).
  const [hybridPinOffsetY, setHybridPinOffsetY] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    onStageChange?.(PHASE_STAGE[phase]);
    // Only re-fire when the phase (and therefore stage) actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleProtect = useCallback(() => {
    setPhase("connecting");
    timers.current.push(setTimeout(() => setScrambleActive(true), 400));
    timers.current.push(
      setTimeout(() => {
        setScrambleActive(false);
        setPhase("protected");
      }, CONNECT_MS),
    );
  }, []);

  const handleContinue = useCallback(() => setPhase("jtbd"), []);

  // Prototype utility: bypass stage 1 entirely and land on JTBD selection.
  // Since no VPN connection was actually made, the map stays unprotected.
  const handleSkipConnection = useCallback(() => {
    setSkippedConnection(true);
    setPhase("jtbd");
  }, []);

  // ── Map focus per phase ─────────────────────────────────────────────────────
  const stage = PHASE_STAGE[phase];
  // `skippedConnection` overrides the usual "protected once you reach tuning/
  // upgrade" assumption — there was no connect, so the map keeps showing the
  // user's real (unprotected) location and pin color for the rest of the flow.
  const isProtectedSide = !skippedConnection && (phase === "protected" || stage === "tuning" || stage === "upgrade");
  const mapStatus: PinStatus = skippedConnection ? "unprotected" : phase === "unprotected" ? "unprotected" : phase === "connecting" ? "connecting" : "protected";
  const mapLat = isProtectedSide ? VPN_SERVER.lat : geo.lat;
  const mapLng = isProtectedSide ? VPN_SERVER.lng : geo.lng;
  const mapZoom = phase === "connecting" ? 3 : phase === "jtbd" ? 4 : 5;
  const isMapSpotlightSplit = variant === "v2";
  // Pin offset-right amount for the two split layouts that keep the map
  // visible beside a left rail (v2's rail is 400px; Hybrid's split rail is an
  // even 50/50, i.e. 512px) — each value centers the pin in the remaining
  // region: rail + (1024 - rail) / 2 - 512, which simplifies to rail / 2.
  const splitFocusOffsetX = variant === "v2" ? 200 : variant === "hybrid-split" ? 256 : 0;

  // ── Tone-selected copy (content only; layout/timing unchanged) ──────────────
  const mapCopy = CONNECTION_COPY[tone].mapSpotlight;
  const browsingCopy = CONNECTION_COPY[tone].browsing;

  // ── Info card rows per phase & variant ──────────────────────────────────────
  let rows: InfoRow[] = [];
  let cardHeading: ReactNode = null;
  const cardFootnote: ReactNode = null;

  if (phase === "unprotected" || phase === "connecting") {
    // v1 / v2 — real data card.
    const active = phase === "connecting";
    rows = [
      {
        key: "loc",
        label: "You are currently in:",
        skeletonWidth: 96,
        value: active ? (
          <MaskedValue text={geo.country} active />
        ) : (
          <FlagValue countryCode={geo.countryCode} country={geo.country} />
        ),
      },
      { key: "ip", label: "Your IP address:", skeletonWidth: 110, value: <MaskedValue text={geo.ip} active={active} /> },
      { key: "isp", label: "Your internet provider:", skeletonWidth: 64, value: <MaskedValue text={geo.isp} active={active} /> },
    ];
    if (isMapSpotlightSplit) cardHeading = active ? mapCopy.cardHeadingActive : mapCopy.cardHeadingIdle;
  } else {
    rows = [
      { key: "loc", label: "Your location:", value: "************" },
      {
        key: "appear",
        label: "You appear to be in:",
        value: <FlagValue countryCode={VPN_SERVER.countryCode} country={VPN_SERVER.country} />,
      },
      { key: "ip", label: "Your IP address:", value: "***.*.***.***" },
      {
        key: "vpnip",
        label: "Your VPN IP address:",
        value: <span className="text-[#2cffcc]">{VPN_SERVER.vpnIp}</span>,
      },
    ];
  }

  // ── Headline / subtext / CTA copy per variant & phase (tone-selected) ───────
  const headline: ReactNode = (() => {
    if (phase === "unprotected") return mapCopy.exposedHeadline;
    if (phase === "connecting") return mapCopy.connectingHeadline;
    return mapCopy.protectedHeadline;
  })();

  const subtext: ReactNode = (() => {
    const ispKnown = resolveIspKnown(geo);
    if (phase === "unprotected") return mapCopy.exposedSub(geo.isp, ispKnown);
    if (phase === "protected") return mapCopy.protectedSub(geo.isp, ispKnown);
    return null;
  })();

  const ctaProtectLabel = mapCopy.ctaProtect;

  const showOverlayContent = phase === "unprotected" || phase === "connecting" || phase === "protected";

  return (
    // The "desktop" behind the onboarding window — same native Windows
    // wallpaper as the main app's outer backdrop (`App.tsx`'s `vpn-app-outer`),
    // instead of a flat dark color.
    <div className="flex h-screen w-screen items-center justify-center bg-cover bg-center p-[24px]" style={{ backgroundImage: `url(${windowsWallpaperUrl})` }}>
      <div
        className="relative overflow-hidden rounded-[8px] border border-[#4a4658] shadow-[0px_32px_64px_0px_rgba(0,0,0,0.37),0px_2px_32px_0px_rgba(0,0,0,0.37)]"
        style={{ width: 1024, height: 768 }}
      >
        <style>{`
          @keyframes btnGlow {
            0%, 100% { box-shadow: 0 0 20px rgba(109, 74, 255, 0.3); }
            50% { box-shadow: 0 0 30px rgba(109, 74, 255, 0.5); }
          }
          .ob2-cta-glow { animation: btnGlow 3s ease-in-out infinite; }
        `}</style>

        {/* Single persistent map across all phases */}
        <OnboardingMapV2
          lat={mapLat}
          lng={mapLng}
          zoom={mapZoom}
          status={mapStatus}
          showPin
          showBrackets={phase === "unprotected"}
          dim={stage === "tuning" || stage === "upgrade"}
          focusOffsetX={showOverlayContent ? splitFocusOffsetX : 0}
          focusOffsetY={variant === "hybrid" ? hybridPinOffsetY : 0}
        />

        <WindowChrome onClose={onClose} />

        {/* Prototype utility — bypass stage 1 and land on JTBD selection
            directly. Rendered above all four connection-stage variants since
            it's a top-level sibling, not part of any of them. */}
        <AnimatePresence>
          {showOverlayContent && (
            <motion.button
              key="skip-connection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              transition={{ duration: 0.3 }}
              onClick={handleSkipConnection}
              aria-label="Skip to job selection"
              className="absolute right-[20px] top-[52px] z-[1050] flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
              style={{ fontVariationSettings: "'opsz' 11" }}
            >
              Skip
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        {/* ══════════════════ Stage 1: Establishing VPN connection ══════════════════ */}
        {/* ── Centered overlay: header + info card + CTA (states 1–3) ── */}
        <AnimatePresence>
          {showOverlayContent && (
            <motion.div
              key="overlay"
              className="absolute inset-0 z-[1000]"
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
            >
              {variant === "v4" && (
                <InPlainSight
                  phase={phase as "unprotected" | "connecting" | "protected"}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  copy={browsingCopy}
                />
              )}
              {variant === "v4-split" && (
                <InPlainSightSplit
                  phase={phase as "unprotected" | "connecting" | "protected"}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  copy={browsingCopy}
                />
              )}
              {variant === "hybrid" && (
                <Hybrid
                  phase={phase as "unprotected" | "connecting" | "protected"}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  tone={tone}
                  onPinOffsetChange={setHybridPinOffsetY}
                />
              )}
              {variant === "hybrid-split" && (
                <HybridSplit
                  phase={phase as "unprotected" | "connecting" | "protected"}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  tone={tone}
                />
              )}
              {variant === "v2" && (
                <ControlPanelOverlay
                  phase={phase as "unprotected" | "connecting" | "protected"}
                  headline={headline}
                  subtext={subtext}
                  rows={rows}
                  heading={cardHeading}
                  loading={phase === "unprotected" && !isLive}
                  ctaProtectLabel={ctaProtectLabel}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                />
              )}
              {variant === "v1" && <>
              {/* Header (icon + title + subtext) — keyed remount per phase.
                  Unprotected uses the long entrance delays; later phases use a
                  quick stagger so transitions stay snappy. */}
              <div key={phase} className="absolute left-1/2 top-[60px] w-[640px] -translate-x-1/2 text-center">
                <motion.div
                  className="mb-[12px] flex h-[40px] items-center justify-center"
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: phase === "unprotected" ? sec(ENTRANCE_TIMING.padlockAppear) : 0, duration: 0.5, ease: "easeOut" }}
                >
                  {phase === "unprotected" && <PadlockOpen />}
                  {phase === "connecting" && <Spinner />}
                  {phase === "protected" && <PadlockClosed />}
                </motion.div>
                <motion.h1
                  className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
                  style={{ fontVariationSettings: "'opsz' 24" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: phase === "unprotected" ? sec(ENTRANCE_TIMING.headlineAppear) : 0.12, duration: 0.5, ease: "easeOut" }}
                >
                  {headline}
                </motion.h1>
                {subtext && (
                  <motion.p
                    className="mt-[8px] mx-auto max-w-[420px] font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: phase === "unprotected" ? sec(ENTRANCE_TIMING.subtextAppear) : 0.24, duration: 0.5, ease: "easeOut" }}
                  >
                    {subtext}
                  </motion.p>
                )}
              </div>

              {/* Info card (anchored below the pin) */}
              <div className="absolute left-1/2 top-[452px] -translate-x-1/2">
                <InfoCard
                  key={phase === "protected" ? "card-protected" : "card-pre"}
                  rows={rows}
                  heading={cardHeading}
                  footnote={cardFootnote}
                  loading={phase === "unprotected" && !isLive}
                  containerDelay={phase === "protected" ? 0 : sec(ENTRANCE_TIMING.infoCardAppear)}
                  rowBaseDelay={phase === "protected" ? 0.15 : sec(ENTRANCE_TIMING.infoRowBase)}
                  rowStagger={sec(ENTRANCE_TIMING.infoRowStagger)}
                  width={420}
                />
              </div>

              {/* CTA */}
              <div className="absolute left-1/2 top-[632px] h-[44px] -translate-x-1/2">
                <AnimatePresence>
                  {phase === "unprotected" && (
                    <motion.button
                      key="cta-protect"
                      onClick={handleProtect}
                      disabled={!isLive}
                      className="ob2-cta-glow absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-[background-color,transform,opacity] duration-300 hover:bg-[#7c5cff] active:scale-[0.97] disabled:cursor-default disabled:opacity-50"
                      style={{ fontVariationSettings: "'opsz' 12" }}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3 } }}
                      transition={{ delay: sec(ENTRANCE_TIMING.ctaAppear), duration: 0.5, ease: "easeOut" }}
                    >
                      {ctaProtectLabel}
                    </motion.button>
                  )}
                  {phase === "protected" && (
                    <motion.button
                      key="cta-continue"
                      onClick={handleContinue}
                      className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97]"
                      style={{ fontVariationSettings: "'opsz' 12" }}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.3 } }}
                      transition={{ duration: 0.5, ease: EASE, delay: 0.7 }}
                    >
                      Continue
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
              </>}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════ Stage 2: Personalized JTBD tuning ══════════════════ */}
        {/* ── JTBD two-column workspace (state 4) ── */}
        <AnimatePresence>
          {phase === "jtbd" && (
            <motion.div
              key="jtbd"
              className="absolute inset-0 z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <JtbdGridPanel
                selected={selectedJtbd}
                onSelect={setSelectedJtbd}
                onContinue={() => effectiveJtbdKey && setPhase("tuned")}
                onSkip={() => onExit?.([], "free")}
                tone={tone}
                selectionMode={selectionMode}
                selectedMultiple={selectedJtbds}
                onToggleMultiple={toggleSelectedJtbd}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Tuned result (states 5–6 collapsed into one) ── */}
        {/* No separate loader — `TunedResult` opens with its own centered
            intro and IS the perceived-progress surface (see
            "Header intro/move/counter" in docs/features/onboarding-v2.md).
            Keyed by `resultLayout` so switching the prototype's Layout
            selector remounts it, replaying the full intro + materialization
            in the newly chosen arrangement (confirmed prototype behavior). */}
        <AnimatePresence>
          {phase === "tuned" && effectiveJtbdKey && (
            <motion.div
              key="tuned"
              className="absolute inset-0 z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <TunedResult
                key={resultLayout}
                jtbdKey={effectiveJtbdKey}
                selectionMode={selectionMode}
                selectedJtbds={selectedJtbds}
                userPlan="free"
                layout={resultLayout}
                tone={tone}
                onContinue={() => setPhase("upsell")}
                onBack={() => setPhase("jtbd")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ══════════════════ Stage 3: Upgrade to Plus ══════════════════ */}
        {/* ── VPN Plus upsell (state 7) ── */}
        <AnimatePresence>
          {phase === "upsell" && effectiveJtbdKey && (
            <motion.div
              key="upsell"
              className="absolute inset-0 z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
            >
              <VPNPlusUpsell
                jtbdKey={effectiveJtbdKey}
                selectionMode={selectionMode}
                selectedJtbds={selectedJtbds}
                onUpgrade={() => setPhase("web-checkout")}
                onContinueFree={() => onExit?.(effectiveSelectedJtbds, "free")}
                onBack={() => setPhase("tuned")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Simulated web checkout (new — between the upsell CTA and the
            existing checkout loader; see docs/features/onboarding-v2.md) ── */}
        <AnimatePresence>
          {phase === "web-checkout" && effectiveJtbdKey && (
            <motion.div
              key="web-checkout"
              className="absolute inset-0 z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SimulatedWebCheckout
                jtbdKey={effectiveJtbdKey}
                billingCountry={geo.country}
                onReturnToApp={() => setPhase("checkout")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Checkout loader (state 8) ── */}
        <AnimatePresence>
          {phase === "checkout" && effectiveJtbdKey && (
            <motion.div
              key="checkout"
              className="absolute inset-0 z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <LoaderScreen
                title="Completing checkout..."
                subtitleLine1="Confirming your payment. This takes a few seconds."
                durationMs={3000}
                onComplete={() => setPhase("plus-welcome")}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── VPN Plus welcome / transformation (state 9) ── */}
        <AnimatePresence>
          {phase === "plus-welcome" && effectiveJtbdKey && (
            <motion.div
              key="plus-welcome"
              className="absolute inset-0 z-[1000]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PlusWelcomeState
                key={resultLayout}
                jtbdKey={effectiveJtbdKey}
                selectionMode={selectionMode}
                selectedJtbds={selectedJtbds}
                layout={resultLayout}
                tone={tone}
                onEnterApp={() => onExit?.(effectiveSelectedJtbds, "plus")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
