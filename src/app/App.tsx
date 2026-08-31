import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ISPRegulationsPanel } from "./components/ISPRegulationsPanel";
import { WorldMap } from "./components/WorldMap";
import OnboardingV2, {
  CONNECTION_GROUPS,
  connectionGroupForVariant,
  ONBOARDING_STAGES,
  STAGE_ORDER,
  STAGE_VERSIONS,
  UPSELL_VERSIONS,
  tuningConceptsForPlan,
  effectiveTuningConcept,
  defaultTuningConceptForPlan,
  type OnboardingStage,
  type OnboardingVariant,
  type ResultLayout,
  type UpsellVariant,
  type TuningConcept,
} from "./onboarding-v2/OnboardingV2";
import { STAGE_SUPPORTS_TONE, TONE_OPTIONS, type ToneOfVoice } from "./onboarding-v2/lib/toneOfVoice";
import { FAILURE_SIM_PRESETS } from "./onboarding-v2/lib/connectionSimulator";
import { trackConnectionFailureEvent } from "./onboarding-v2/lib/analytics";
import type { JtbdId, SelectionMode } from "./onboarding-v2/lib/jtbdData";
import { resolveVpnDestination } from "./onboarding-v2/lib/server";
import { JTBD_PROFILES } from "./onboarding-v2/lib/jtbdProfiles";
import MakeYoursModal from "./components/MakeYoursModal";
import { ProfilesSpotlight, type SpotlightRect } from "./components/ProfilesSpotlight";
import SignInScreen from "./components/SignInScreen";
import FlowOverview from "./components/FlowOverview";
import PrdOverview from "./components/PrdOverview";
import { ThemeProvider, useTheme } from "./ThemeContext";
import type { MapLayerOption } from "../imports/RightVpnFeatures";
import { TRANSITION_TIMING } from "./transitionTiming";
import type { SessionPlan, OnboardingExitOptions } from "./lib/sessionPlan";
import windowsWallpaperUrl from "./assets/windows-wallpaper.png";

/** Prototype-only persistence for the connection-failure path's Tier 3
 * resumability — a real app would key this off the account/session, but
 * this prototype has neither, so `localStorage` (matching every other
 * "has this been shown/dismissed before" flag in this file) is the closest
 * available stand-in. */
const DEFERRED_ONBOARDING_KEY = "onboardingDeferredDueToFailure";

export type VpnStatus = "unprotected" | "connecting" | "protected";

const PANEL_DEFAULT = 340;
const PANEL_MIN     = 200;
const PANEL_MAX     = 400;

// Match the onboarding v2 protected-Netherlands map exactly.
const NL_LAT = 52.37;
const NL_LNG = 4.9;
const NL_ZOOM = 4;

const SHOWN_KEY = "makeYoursModalShown";

// Disabled at the user's request — the "Set it up your way" modal
// (`MakeYoursModal`) is currently hidden across every entry path. Flip back
// to `true` to restore it; everything else about it (component, state,
// `handleModalClose`'s welcome-banner handoff) is left fully wired.
const MAKE_YOURS_MODAL_ENABLED = false;
// Dedicated flag for the post-onboarding welcome banner — decoupled from
// `SHOWN_KEY` (which specifically gates the "Set it up your way" modal's own
// re-display) even though today both are cleared together on every
// `startOnboarding` (so the banner replays alongside the modal on each
// prototype demo run, not literally "once ever").
const WELCOME_BANNER_SHOWN_KEY = "welcomeBannerShown";

/** Plus-only prototype sub-toggle — whether the Hybrid/Hybrid Split country
 * selector (`CountrySelect`) appears at all this run. Hidden from the Sign In
 * UI but persisted here so the option survives reloads and can still be set
 * programmatically (e.g. via devtools). Default `false` ("Without"). */
const COUNTRY_SELECTION_ENABLED_KEY = "countrySelectionEnabled";

// "overview" — the informational "Flow overview" screen, reachable only
// from the start screen's secondary button; "prd" — the informational "PRD
// overview" screen, reachable only from the start screen's tertiary button.
// Both return to "start".
type AppState = "start" | "signin" | "overview" | "prd" | "onboarding" | "transitioning" | "app";

// ── Prototype controls (dev-only HUD, not part of the product UI) ────────────
function PrototypeControls({
  stage,
  variant,
  resultLayout,
  tuningConcept,
  plan,
  upsellVariant,
  tone,
  selectionMode,
  failureSimPresetId,
  onVariantChange,
  onResultLayoutChange,
  onTuningConceptChange,
  onUpsellVariantChange,
  onToneChange,
  onSelectionModeChange,
  onFailureSimChange,
}: {
  stage: OnboardingStage;
  variant: OnboardingVariant;
  resultLayout: ResultLayout;
  tuningConcept: TuningConcept;
  /** The run's plan — gates the Plus-only entries out of the Concept
   * dropdown (`tuningConceptsForPlan`). Read-only here; the control that
   * SETS it lives on the Sign In screen (`SignInPlanControl`). */
  plan: SessionPlan;
  upsellVariant: UpsellVariant;
  tone: ToneOfVoice;
  selectionMode: SelectionMode;
  failureSimPresetId: string;
  onVariantChange: (v: OnboardingVariant) => void;
  onResultLayoutChange: (v: ResultLayout) => void;
  onTuningConceptChange: (v: TuningConcept) => void;
  onUpsellVariantChange: (v: UpsellVariant) => void;
  onToneChange: (t: ToneOfVoice) => void;
  onSelectionModeChange: (m: SelectionMode) => void;
  onFailureSimChange: (id: string) => void;
}) {
  // "Selection" — Single (default, untouched) / Multiple JTBD picking. Only
  // meaningful for the "tuning" stage's JTBD picker + result.
  const showSelectionSelect = stage === "tuning";
  const isConnection = stage === "connection";
  const showToneSelect = STAGE_SUPPORTS_TONE.has(stage);

  // Connection stage: "Version" picks a group (CONNECTION_GROUPS); a second
  // "Layout" dropdown appears only when that group has more than one layout.
  const currentGroup = isConnection ? connectionGroupForVariant(variant) : null;
  const showLayoutSelect = !!currentGroup && currentGroup.layouts.length > 1;

  const handleGroupChange = (groupValue: string) => {
    const group = CONNECTION_GROUPS.find((g) => g.value === groupValue);
    if (group) onVariantChange(group.layouts[0]!.value);
  };

  // Other stages: a single flat dropdown (unchanged behavior). "tuning" has
  // no Layout control at all anymore — stage 2 always renders the default
  // concept's "Minimal list" arrangement, no selector (see `TunedResult`'s
  // hardcoded `layout="stacked"` in `OnboardingV2.tsx`). Only "upgrade"
  // still picks the shared `resultLayout` (which now ONLY affects the
  // separate Plus Welcome step, `PlusWelcomeState`) via this dropdown.
  const usesResultLayout = stage === "upgrade";
  const versions = STAGE_VERSIONS[stage];
  const selectable = versions.length > 1;
  const flatValue = usesResultLayout ? resultLayout : "default";
  const flatLabel = usesResultLayout ? "Layout" : "Version";
  const handleFlatChange = (v: string) => {
    if (usesResultLayout) onResultLayoutChange(v as ResultLayout);
  };

  const textClass = "font-mono text-[12px] leading-[16px]";
  const selectClass = `rounded-[4px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.06)] px-[6px] py-[2px] text-white disabled:cursor-not-allowed disabled:opacity-40 ${textClass}`;
  const optionClass = `bg-[#16141c] text-white ${textClass}`;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[3000] flex w-full items-center justify-center gap-[16px] border-t border-[rgba(255,255,255,0.15)] bg-[rgba(20,18,26,0.92)] px-[16px] py-[8px] text-[rgba(255,255,255,0.75)] shadow-[0px_-8px_24px_rgba(0,0,0,0.35)] backdrop-blur ${textClass}`}
      style={{ pointerEvents: "auto" }}
    >
      {isConnection ? (
        <>
          <label className={`flex items-center gap-[6px] ${textClass}`}>
            Version:
            <select
              value={currentGroup!.value}
              onChange={(e) => handleGroupChange(e.target.value)}
              className={selectClass}
            >
              {CONNECTION_GROUPS.map((g) => (
                <option key={g.value} value={g.value} className={optionClass}>
                  {g.label}
                </option>
              ))}
            </select>
          </label>
          {showLayoutSelect && (
            <label className={`flex items-center gap-[6px] ${textClass}`}>
              Layout:
              <select
                value={variant}
                onChange={(e) => onVariantChange(e.target.value as OnboardingVariant)}
                className={selectClass}
              >
                {currentGroup!.layouts.map((l) => (
                  <option key={l.value} value={l.value} className={optionClass}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </>
      ) : stage === "tuning" ? null : (
        <label className={`flex items-center gap-[6px] ${textClass}`}>
          {flatLabel}:
          <select
            value={flatValue}
            disabled={!selectable}
            onChange={(e) => handleFlatChange(e.target.value)}
            className={selectClass}
          >
            {versions.map((v) => (
              <option key={v.value} value={v.value} className={optionClass}>
                {v.label}
              </option>
            ))}
          </select>
        </label>
      )}

      {stage === "tuning" && (
        <>
          <span className="h-[16px] w-px bg-[rgba(255,255,255,0.15)]" />
          <label className={`flex items-center gap-[6px] ${textClass}`}>
            Concept:
            <select
              value={effectiveTuningConcept(tuningConcept, plan)}
              onChange={(e) => onTuningConceptChange(e.target.value as TuningConcept)}
              className={selectClass}
            >
              {tuningConceptsForPlan(plan).map((c) => (
                <option key={c.value} value={c.value} className={optionClass}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {stage === "upgrade" && (
        <>
          <span className="h-[16px] w-px bg-[rgba(255,255,255,0.15)]" />
          <label className={`flex items-center gap-[6px] ${textClass}`}>
            Upsell:
            <select
              value={upsellVariant}
              onChange={(e) => onUpsellVariantChange(e.target.value as UpsellVariant)}
              className={selectClass}
            >
              {UPSELL_VERSIONS.map((v) => (
                <option key={v.value} value={v.value} className={optionClass}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {showToneSelect && (
        <>
          <span className="h-[16px] w-px bg-[rgba(255,255,255,0.15)]" />
          <label className={`flex items-center gap-[6px] ${textClass}`}>
            Tone of voice:
            <select
              value={tone}
              onChange={(e) => onToneChange(e.target.value as ToneOfVoice)}
              className={selectClass}
            >
              {TONE_OPTIONS.map((t) => (
                <option key={t.value} value={t.value} className={optionClass}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}

      {showSelectionSelect && (
        <>
          <span className="h-[16px] w-px bg-[rgba(255,255,255,0.15)]" />
          <label className={`flex items-center gap-[6px] ${textClass}`}>
            Selection:
            <select
              value={selectionMode}
              onChange={(e) => onSelectionModeChange(e.target.value as SelectionMode)}
              className={selectClass}
            >
              <option value="single" className={optionClass}>Single</option>
              <option value="multiple" className={optionClass}>Multiple</option>
            </select>
          </label>
        </>
      )}

      {/* Connection-failure simulation — there is no real connection service
          to detect a genuine failure from (see docs/features/onboarding-v2.md
          → "Connection failure path", checkpoint 0), so this is the only way
          to demo every tier/cause of the three-tier failure path. */}
      {isConnection && (
        <>
          <span className="h-[16px] w-px bg-[rgba(255,255,255,0.15)]" />
          <label className={`flex items-center gap-[6px] ${textClass}`}>
            Simulate connection:
            <select
              value={failureSimPresetId}
              onChange={(e) => onFailureSimChange(e.target.value)}
              className={selectClass}
            >
              {FAILURE_SIM_PRESETS.map((p) => (
                <option key={p.id} value={p.id} className={optionClass}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </>
      )}
    </div>
  );
}

/** Prototype stage indicator — fixed top-center above the app window, separate
 * from the bottom `PrototypeControls` bar so the stage label reads as a
 * header over the window rather than part of the dev HUD dock. */
function StageIndicator({ stage }: { stage: OnboardingStage }) {
  const textClass = "font-mono text-[12px] leading-[16px]";
  const stageNumber = STAGE_ORDER.indexOf(stage) + 1;
  const stageName = ONBOARDING_STAGES[stage].name;

  return (
    <div
      className={`fixed left-1/2 top-[24px] z-[3000] -translate-x-1/2 rounded-[6px] border border-[rgba(255,255,255,0.15)] bg-[rgba(20,18,26,0.92)] px-[12px] py-[6px] text-[rgba(255,255,255,0.75)] shadow-[0px_8px_24px_rgba(0,0,0,0.35)] backdrop-blur ${textClass}`}
      style={{ pointerEvents: "auto" }}
    >
      Stage: <strong className={`text-white ${textClass}`}>{`${stageNumber} ${stageName}`}</strong>
    </div>
  );
}

/** "Plan" prototype controller — Free (default) / Plus. Deliberately rendered
 * ONLY on the Sign In screen (confirmed at checkpoint), not in the persistent
 * `PrototypeControls` HUD that spans the rest of the flow: the choice is made
 * once, before the run starts, then read from this single source of truth by
 * every downstream screen (`OnboardingV2`'s `plan` prop) for the whole run.
 * A segmented tab switcher (both options always visible, no dropdown) rather
 * than `PrototypeControls`' own `<select>` convention — kept as a standalone
 * component since it lives outside that bar's stage-gated bottom dock, fixed
 * top-center of the screen. */
function SignInPlanControl({
  plan,
  onPlanChange,
}: {
  plan: SessionPlan;
  onPlanChange: (p: SessionPlan) => void;
}) {
  const textClass = "font-mono text-[12px] leading-[16px]";
  const tabClass = (active: boolean) =>
    `rounded-[4px] px-[12px] py-[4px] transition-colors duration-150 ${
      active ? "bg-[rgba(255,255,255,0.16)] text-white" : "text-[rgba(255,255,255,0.5)] hover:text-white"
    } ${textClass}`;

  return (
    <div
      className={`fixed left-1/2 top-[24px] z-[3000] flex -translate-x-1/2 flex-col items-center gap-[8px] rounded-[6px] border border-[rgba(255,255,255,0.15)] bg-[rgba(20,18,26,0.92)] px-[12px] py-[6px] text-[rgba(255,255,255,0.75)] shadow-[0px_8px_24px_rgba(0,0,0,0.35)] backdrop-blur ${textClass}`}
      style={{ pointerEvents: "auto" }}
    >
      <div className="flex items-center gap-[12px]">
        <span className={textClass}>Plan:</span>
        <div className="flex items-center gap-[2px] rounded-[6px] border border-[rgba(255,255,255,0.15)] bg-[rgba(255,255,255,0.04)] p-[2px]">
          <button type="button" onClick={() => onPlanChange("free")} className={tabClass(plan === "free")}>
            Free
          </button>
          <button type="button" onClick={() => onPlanChange("plus")} className={tabClass(plan === "plus")}>
            Plus
          </button>
        </div>
      </div>
    </div>
  );
}

// Inner component so it can use useTheme()
function AppInner() {
  const { effectiveTheme } = useTheme();

  const [appState, setAppState] = useState<AppState>("start");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedMapLayer, setSelectedMapLayer] = useState<MapLayerOption>("none");
  const [vpnStatus, setVpnStatus] = useState<VpnStatus>("protected");
  const [connectedCountry, setConnectedCountry] = useState<string | null>("Netherlands");
  /** Set only when the current connection came from pressing Connect on a
   * specific profile card during onboarding (Profiles carousel v1/v2) —
   * drives the connection card's profile variant (icon + name in place of
   * the flag) for exactly that connection. Cleared by any other way of
   * connecting/disconnecting, so it never survives past the connection it
   * describes. */
  const [connectedProfileJtbd, setConnectedProfileJtbd] = useState<JtbdId | null>(null);
  const [physicalCountry, setPhysicalCountry] = useState("United Kingdom");
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** When true, suppress the post-modal welcome banner (e.g. user skipped
   * straight to the app without connecting). */
  const suppressWelcomeBannerRef = useRef(false);

  const [panelWidth, setPanelWidth] = useState(PANEL_DEFAULT);
  const [handleHovered, setHandleHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [showEntrance, setShowEntrance] = useState(false);
  // The JTBDs the user actually ended up selecting in onboarding (Single
  // mode: 1-item array; Multiple mode: the full ordered selection; empty if
  // onboarding was skipped) — drives the main app's Profiles tab default
  // and which profile items it generates. See `handleEnterApp`.
  const [onboardingJtbds, setOnboardingJtbds] = useState<JtbdId[]>([]);
  /** The Plus-plan country picked during onboarding, or null for "Fastest
   * country" (and always null on Free, which never sees a country selector).
   * Personalizes the destination line on onboarding-generated sidebar
   * profiles. Deliberately distinct from `selectedCountry`, which is the main
   * app's own live connection target. */
  const [onboardingCountry, setOnboardingCountry] = useState<string | null>(null);
  /** Whether the user landed in the main app on Free or VPN Plus — set by
   * `handleEnterApp` from onboarding exit (`"free"` for Continue free + Skip,
   * `"plus"` only after in-session checkout). Drives the free-tier connection
   * card, disabled onboarding profiles, and Plus teaser banner. */
  const [sessionPlan, setSessionPlan] = useState<SessionPlan>("plus");
  /** The prototype's "Plan" controller (Free default / Plus) — set on the
   * Sign In screen only (`SignInPlanControl`), single source of truth for
   * the ENTIRE onboarding run that follows. Threaded into `OnboardingV2` as
   * `plan`; distinct from `sessionPlan` above, which is the POST-exit main
   * app's own plan flag (derived FROM this value once onboarding completes —
   * see `OnboardingV2`'s `plan`-aware exits). */
  const [onboardingPlan, setOnboardingPlan] = useState<SessionPlan>("free");
  /** Plus-only prototype sub-toggle — whether the Hybrid/Hybrid Split
   * country selector (`CountrySelect`) appears at all this run. Default
   * `false` ("Without") when Plus is picked — country selection is an
   * additive preview ON TOP of Plus, not the default Plus path. Hidden from
   * the Sign In UI but persisted to `localStorage` under
   * `COUNTRY_SELECTION_ENABLED_KEY`. Irrelevant on Free — `OnboardingV2`
   * only ever reads it when `onboardingPlan === "plus"`. */
  const [countrySelectionEnabled, setCountrySelectionEnabledState] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(COUNTRY_SELECTION_ENABLED_KEY) === "true",
  );
  const setCountrySelectionEnabled = useCallback((enabled: boolean) => {
    localStorage.setItem(COUNTRY_SELECTION_ENABLED_KEY, enabled ? "true" : "false");
    setCountrySelectionEnabledState(enabled);
  }, []);
  /** Incremented to ask `CountryBrowser` to switch to the Countries tab
   * (wired from the free-tier connection card's "Change server" button). */
  const [countriesTabFocusKey, setCountriesTabFocusKey] = useState(0);
  // Fires the calm, auto-dismissing welcome banner exactly once, right
  // after the "Set it up your way" modal closes. See `handleModalClose`.
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);
  // Post-onboarding spotlight — dims the whole window except the Profiles
  // list and rings it in white, to point at what onboarding just generated.
  // Armed in `handleEnterApp`; `ProfilesSpotlight` owns its own 5s timeout and
  // click-anywhere dismissal, both of which call back into
  // `dismissProfilesSpotlight`. Non-null rect == visible.
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const spotlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The Profiles tab's content block (header → "New profile"), measured to
   * position the spotlight cutout. */
  const profilesSectionRef = useRef<HTMLDivElement>(null);
  // Tier 3 of the connection-failure path — true once onboarding was
  // deferred (never "completed") rather than skipped deliberately. Drives
  // `DeferredOnboardingBanner`'s presence; cleared once the deferred
  // personalization is actually finished (see `handleEnterApp`).
  const [deferredOnboarding, setDeferredOnboarding] = useState(
    () => typeof window !== "undefined" && localStorage.getItem(DEFERRED_ONBOARDING_KEY) === "true",
  );
  const [deferredBannerDismissed, setDeferredBannerDismissed] = useState(false);
  // True once the user has connected at least once WHILE `deferredOnboarding`
  // is active — flips the banner from "retry" to "resume" copy/action and
  // fires the "connected later" analytics event exactly once.
  const connectedLaterTrackedRef = useRef(false);

  // Which onboarding content variant the user picked on the start screen
  const [variant, setVariant] = useState<OnboardingVariant>("hybrid");
  // Which tuned-result layout is active (prototype control)
  const [resultLayout, setResultLayout] = useState<ResultLayout>("profiles-showcase");
  // Which "Personalized JTBD tuning" content concept is active (prototype
  // control) — independent from `resultLayout` (which only picks the
  // resolved arrangement WITHIN the default concept, and is separately
  // reused by the VPN Plus Welcome step).
  const [tuningConcept, setTuningConcept] = useState<TuningConcept>(() =>
    defaultTuningConceptForPlan("free"),
  );
  // Which "Upgrade to Plus" upsell content version is active (prototype
  // control) — independent from `resultLayout` (which only drives the
  // separate VPN Plus Welcome step).
  const [upsellVariant, setUpsellVariant] = useState<UpsellVariant>("profiles-fan");
  // Tone of voice for connection-stage copy (prototype control)
  const [tone, setTone] = useState<ToneOfVoice>("straightforward");
  // "Selection" prototype control (prototype-only, tuning stage) — defaults
  // to "multiple" (confirmed: Multiple mode is now the default prototype
  // experience). "single" remains fully supported/selectable in the HUD
  // dropdown and is still every underlying component's own default prop
  // value (see `JtbdGridPanel`/`TunedResult`'s `selectionMode = "single"`),
  // so nothing about Single mode's behavior changed — only which one this
  // top-level state starts as.
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("multiple");
  // Prototype-only: which `FAILURE_SIM_PRESETS` id to simulate for the
  // connection stage — "none" is the untouched happy path.
  const [failureSimPresetId, setFailureSimPresetId] = useState("none");
  // Set once, right before mounting a resumed onboarding session (Tier 3's
  // "Continue" action) — tells `OnboardingV2` to open directly on the intent
  // picker instead of stage 1, since the user is already connected.
  const [resumeAtJtbd, setResumeAtJtbd] = useState(false);

  const handleOnboardingPlanChange = useCallback((p: SessionPlan) => {
    setTuningConcept((c) => {
      const coerced = effectiveTuningConcept(c, p);
      if (c === defaultTuningConceptForPlan(onboardingPlan)) {
        return defaultTuningConceptForPlan(p);
      }
      return coerced;
    });
    setOnboardingPlan(p);
    if (p === "plus") setCountrySelectionEnabled(false);
  }, [onboardingPlan, setCountrySelectionEnabled]);

  // Prototype controls: current stage of the flow, shown in the HUD above the window
  const [currentStage, setCurrentStage] = useState<OnboardingStage>("connection");

  // NetShield state, read by the right rail (`WorldMap`/`RightVpnFeatures`).
  // `MakeYoursModal` no longer edits this (its NetShield row was removed);
  // no other interactive toggle exists in this prototype, so `setNetShieldEnabled`
  // is currently unused, but the state/default (`true`) are untouched.
  const [netShieldEnabled] = useState(true);

  // Modal
  const [showModal, setShowModal] = useState(false);

  useEffect(() => () => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
  }, []);

  const dismissProfilesSpotlight = useCallback(() => {
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    setSpotlightRect(null);
  }, []);

  /** Measures the Profiles list against the app window, so the cutout can be
   * placed in the window's own coordinate space rather than the viewport's. */
  const showProfilesSpotlight = useCallback(() => {
    const section = profilesSectionRef.current;
    const container = containerRef.current;
    if (!section || !container) return;
    const sectionRect = section.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    if (sectionRect.width === 0 || sectionRect.height === 0) return;
    setSpotlightRect({
      top: sectionRect.top - containerRect.top,
      left: sectionRect.left - containerRect.left,
      width: sectionRect.width,
      height: sectionRect.height,
    });
  }, []);

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const onMove = (ev: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setPanelWidth(Math.max(PANEL_MIN, Math.min(PANEL_MAX, ev.clientX - rect.left - 8)));
    };
    const onUp = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, []);

  const handleMapSelect    = useCallback((name: string) => setSelectedCountry(name), []);
  const handlePanelChange  = useCallback((name: string | null) => setSelectedCountry(name), []);
  const handleSelectLayer  = useCallback((layer: MapLayerOption) => setSelectedMapLayer(layer), []);
  const handleClearLayer   = useCallback(() => setSelectedMapLayer("none"), []);

  const handleConnect = useCallback((country: string) => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    setConnectedCountry(country);
    // A plain country/"Fastest" connect from the map or sidebar is never a
    // profile connection, even if the last one was — otherwise the card
    // would keep showing a stale profile's icon and name after the user
    // picked an unrelated country by hand.
    setConnectedProfileJtbd(null);
    setVpnStatus("connecting");
    connectTimerRef.current = setTimeout(() => setVpnStatus("protected"), 3000);
  }, []);

  // Clicking "Connect" on a sidebar profile row (`CountryBrowser`'s
  // Profiles tab, Plus-only — Free rows stay `disabled`). Resolves the same
  // destination the row's own subtitle already promises: `onboardingCountry`
  // overrides a FIXED-country profile exactly like `sidebarSubtitle` does
  // (so the row's text and what it actually connects to never disagree),
  // and a rule-based profile ("fastest nearby"/"fastest outside your
  // country") falls through to `resolveVpnDestination(null)` — this
  // prototype's one simulated "fastest" server, the same one Free's
  // fastest-country connect and onboarding's own "Fastest" pick already
  // resolve to. Sets `connectedProfileJtbd` (unlike `handleConnect`, which
  // deliberately clears it) so the connection card identifies this
  // connection by the profile, per the existing `connectedProfileJtbd`
  // contract `handleEnterApp`'s carousel-Connect exit already established.
  const handleProfileConnect = useCallback((jtbd: JtbdId) => {
    const profile = JTBD_PROFILES[jtbd];
    const destinationCountry = profile.country && onboardingCountry ? onboardingCountry : profile.country;
    const { country } = resolveVpnDestination(destinationCountry);
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    setConnectedCountry(country);
    setConnectedProfileJtbd(jtbd);
    setVpnStatus("connecting");
    connectTimerRef.current = setTimeout(() => setVpnStatus("protected"), 3000);
  }, [onboardingCountry]);

  // Fires exactly once — the first time the user connects (by any means)
  // while onboarding is still deferred — satisfying the "whether they
  // connected later in-app" analytics capture for the connection-failure
  // path (docs/features/onboarding-v2.md → "Connection failure path").
  useEffect(() => {
    if (vpnStatus !== "protected" || !deferredOnboarding || connectedLaterTrackedRef.current) return;
    connectedLaterTrackedRef.current = true;
    setDeferredBannerDismissed(false); // the situation changed — show the "resume" banner even if "retry" was dismissed
    trackConnectionFailureEvent("connection_deferred_connected_later", {});
  }, [vpnStatus, deferredOnboarding]);

  // Tier 3's retry banner — reuses the exact same connect simulation the
  // free-tier connection card itself uses, since this is genuinely just "try
  // connecting again", not a special path.
  const handleDeferredRetry = useCallback(() => {
    handleConnect("Netherlands");
  }, [handleConnect]);

  const handleDeferredDismiss = useCallback(() => {
    setDeferredBannerDismissed(true);
  }, []);

  // Tier 3's resume banner ("Want to finish personalizing your VPN?") — the
  // minimal re-run entry point: reopens onboarding directly on the intent
  // picker, since the user is already connected. On completion,
  // `handleEnterApp` fires again (this time without
  // `deferredDueToConnectionFailure`), which clears `deferredOnboarding`.
  const handleDeferredResume = useCallback(() => {
    setResumeAtJtbd(true);
    setCurrentStage("tuning");
    setAppState("onboarding");
  }, []);

  const handleDisconnect = useCallback(() => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    setVpnStatus("unprotected");
    setConnectedCountry(null);
    setConnectedProfileJtbd(null);
  }, []);

  // Called when the window chrome's "X" is clicked mid-onboarding — closes
  // the window straight back to the prototype's initial start screen (the
  // 3-button screen), skipping the normal onExit→main-app handoff entirely.
  // `OnboardingV2` fully unmounts (its early-return branches don't render
  // it once `appState` is "start"), so its internal phase/selection state
  // is naturally reset the next time onboarding is started again.
  const handleCloseOnboarding = useCallback(() => {
    if (resumeAtJtbd) {
      // Closing a RESUMED session (Tier 3's "Continue" entry point) returns
      // to the already-running main app, not the prototype's start screen —
      // there's a real session behind it to go back to, unlike a fresh
      // onboarding run.
      setResumeAtJtbd(false);
      setAppState("app");
      return;
    }
    setAppState("start");
  }, [resumeAtJtbd]);

  // Fires once the "Set it up your way" modal closes (Apply or Not now,
  // both funnel through the SAME `onClose` prop) — the final beat of
  // onboarding, and the trigger for the welcome banner.
  const handleModalClose = useCallback(() => {
    setShowModal(false);
    if (!suppressWelcomeBannerRef.current && !localStorage.getItem(WELCOME_BANNER_SHOWN_KEY)) {
      localStorage.setItem(WELCOME_BANNER_SHOWN_KEY, "true");
      setShowWelcomeBanner(true);
    }
    suppressWelcomeBannerRef.current = false;
  }, []);

  // Called when user exits onboarding. Fires the crossfade transition.
  const handleEnterApp = useCallback((
    selectedJtbds: JtbdId[] = [],
    plan: SessionPlan = "free",
    options: OnboardingExitOptions = {},
  ) => {
    const vpnConnected = options.vpnConnected !== false;
    const deferred = options.deferredDueToConnectionFailure === true;
    suppressWelcomeBannerRef.current = !vpnConnected || deferred;

    setSessionPlan(plan);
    if (vpnConnected) {
      setVpnStatus("protected");
      // Was hardcoded to "Netherlands" regardless of what the onboarding
      // screen actually connected to — so a per-card Connect (Profiles
      // carousel v2) or any other Plus country pick landed the main app's
      // connection card on the wrong country. `resolveVpnDestination`
      // already does this resolution correctly elsewhere (real coordinates,
      // "Fastest country" fallback for `null`/`undefined`); reuse it here
      // instead of re-deriving or hardcoding a destination.
      setConnectedCountry(resolveVpnDestination(options.selectedCountry).country);
      setConnectedProfileJtbd(options.connectedProfileJtbd ?? null);
    } else {
      setVpnStatus("unprotected");
      setConnectedCountry(null);
      setConnectedProfileJtbd(null);
      setSelectedCountry(null);
    }
    setShowEntrance(true);
    setAppState("transitioning");
    setCurrentStage("personalization");
    setOnboardingJtbds(selectedJtbds);
    setOnboardingCountry(options.selectedCountry ?? null);
    setResumeAtJtbd(false);

    if (deferred) {
      // Tier 3: mark onboarding RESUMABLE, not completed — never the
      // upsell/checkout/Plus-welcome flow, no completion flag. The retry
      // banner takes over as the one acknowledgment of what happened.
      setDeferredOnboarding(true);
      setDeferredBannerDismissed(false);
      connectedLaterTrackedRef.current = false;
      localStorage.setItem(DEFERRED_ONBOARDING_KEY, "true");
    } else if (deferredOnboarding) {
      // The deferred personalization (picked up via the "resume" banner)
      // just completed normally — clear the resumable flag entirely.
      setDeferredOnboarding(false);
      localStorage.removeItem(DEFERRED_ONBOARDING_KEY);
      trackConnectionFailureEvent("connection_deferred_onboarding_completed", {});
    }

    // After the last panel finishes sliding in, show the modal (once) —
    // skipped when the user bailed straight to the app (Go to app directly,
    // or the connection-failure path's Tier 2/3 exits — neither ever ran
    // the personalization step this modal represents).
    //
    // Currently disabled at the user's request — the "Set it up your way"
    // modal (`MakeYoursModal`) is hidden across every entry path. Left
    // fully wired (component, state, `handleModalClose`'s welcome-banner
    // handoff) rather than deleted, so it can be switched back on by
    // restoring the `setShowModal(true)` call below.
    const totalDuration = TRANSITION_TIMING.leftPanel.start + TRANSITION_TIMING.leftPanel.duration + 400;
    modalTimerRef.current = setTimeout(() => {
      if (MAKE_YOURS_MODAL_ENABLED && vpnConnected && !deferred && !localStorage.getItem(SHOWN_KEY)) {
        setShowModal(true);
      }
    }, totalDuration);

    // Spotlight the Profiles list once the panel has finished sliding in —
    // only when there are onboarding-generated profiles sitting in it to point
    // at (the Profiles tab is what `CountryBrowser` opens on in exactly that
    // case). Measured at fire time, not now, since the panel is still animating.
    if (spotlightTimerRef.current) clearTimeout(spotlightTimerRef.current);
    setSpotlightRect(null);
    if (selectedJtbds.length > 0) {
      spotlightTimerRef.current = setTimeout(
        showProfilesSpotlight,
        TRANSITION_TIMING.leftPanel.start + TRANSITION_TIMING.leftPanel.duration + 150,
      );
    }
  }, [deferredOnboarding, showProfilesSpotlight]);

  const handleChangeServer = useCallback(() => {
    setCountriesTabFocusKey((k) => k + 1);
  }, []);

  // Tier 3's banner: "retry" while still disconnected, "resume" once the
  // user has connected on their own — `null` hides it (never shown at all,
  // or dismissed).
  const deferredBannerMode: "retry" | "resume" | null =
    !deferredOnboarding || deferredBannerDismissed ? null : vpnStatus === "protected" ? "resume" : "retry";

  // ── Main app panel ──────────────────────────────────────────────────────────
  // The "desktop" behind the app window — a real Windows desktop shows its
  // wallpaper here regardless of the app's own theme, so this uses the
  // native Windows wallpaper for both themes rather than a flat theme color.
  const mainApp = (
    <div
      className="vpn-app-outer h-screen w-screen flex items-center justify-center p-6 bg-cover bg-center"
      style={{ backgroundImage: `url(${windowsWallpaperUrl})` }}
    >
      <div
        ref={containerRef}
        className={`vpn-app-container relative h-[830px] w-[1170px] rounded-[8px] overflow-hidden ${effectiveTheme === "light" ? "border border-[rgba(0,0,0,0.12)]" : "border border-[rgba(255,255,255,0.1)]"}`}
      >
        <div className="absolute inset-0">
          <WorldMap
            selectedCountry={selectedCountry}
            onSelectCountry={handleMapSelect}
            selectedMapLayer={selectedMapLayer}
            onSelectMapLayer={handleSelectLayer}
            vpnStatus={vpnStatus}
            connectedCountry={connectedCountry}
            connectedProfileName={connectedProfileJtbd ? JTBD_PROFILES[connectedProfileJtbd].name : null}
            connectedProfileIcon={connectedProfileJtbd ? JTBD_PROFILES[connectedProfileJtbd].icon : null}
            onConnect={handleConnect}
            onDisconnect={handleDisconnect}
            physicalCountry={physicalCountry}
            onPhysicalCountryChange={setPhysicalCountry}
            panelWidth={panelWidth}
            skipOnboarding={true}
            initialCenter={[NL_LAT, NL_LNG]}
            initialZoom={NL_ZOOM}
            showEntrance={showEntrance}
            netShieldEnabled={netShieldEnabled}
            showWelcomeBanner={showWelcomeBanner}
            sessionPlan={sessionPlan}
            onChangeServer={handleChangeServer}
            deferredOnboardingBannerMode={deferredBannerMode}
            onDeferredOnboardingAction={deferredBannerMode === "resume" ? handleDeferredResume : handleDeferredRetry}
            onDeferredOnboardingDismiss={handleDeferredDismiss}
          />
        </div>

        {/* Left panel — slides in from left last */}
        <motion.div
          className="vpn-left-panel absolute top-[8px] left-[8px] bottom-[8px] z-[1000]"
          style={{ width: panelWidth }}
          initial={showEntrance ? { opacity: 0, x: -40 } : false}
          animate={showEntrance ? { opacity: 1, x: 0 } : undefined}
          transition={showEntrance ? {
            duration: TRANSITION_TIMING.leftPanel.duration / 1000,
            delay: TRANSITION_TIMING.leftPanel.start / 1000,
            ease: [0.22, 1, 0.36, 1],
          } : undefined}
        >
          <ISPRegulationsPanel
            externalSelectedCountry={selectedCountry}
            onCountryChange={handlePanelChange}
            activeLayer={selectedMapLayer}
            onClearLayer={handleClearLayer}
            onVpnConnect={handleConnect}
            onVpnDisconnect={handleDisconnect}
            vpnConnectedCountry={connectedCountry}
            vpnStatus={vpnStatus}
            physicalCountry={physicalCountry}
            onboardingJtbds={onboardingJtbds}
            onboardingCountry={onboardingCountry}
            sessionPlan={sessionPlan}
            countriesTabFocusKey={countriesTabFocusKey}
            profilesSectionRef={profilesSectionRef}
            connectedProfileJtbd={connectedProfileJtbd}
            onProfileConnect={handleProfileConnect}
          />
          <div
            className="absolute top-0 bottom-0 right-0 w-[8px] z-[10] cursor-col-resize flex items-stretch justify-center"
            onPointerDown={handleResizeStart}
            onMouseEnter={() => setHandleHovered(true)}
            onMouseLeave={() => setHandleHovered(false)}
          >
            <div
              className="w-[2px] rounded-full transition-opacity duration-150"
              style={{ background: "rgba(255,255,255,0.25)", opacity: handleHovered ? 1 : 0 }}
            />
          </div>
        </motion.div>

        {/* Sits at window level rather than inside the panel: the cutout's dim
            has to reach the map and the connection card, and the panel is
            `overflow-hidden`. */}
        <AnimatePresence>
          {spotlightRect && (
            <ProfilesSpotlight rect={spotlightRect} onDone={dismissProfilesSpotlight} />
          )}
        </AnimatePresence>
      </div>

      {/* ══════════ Stage 4: Final personalization ══════════
          "Make Proton VPN yours" — shown once after onboarding.
          See ONBOARDING_STAGES in onboarding-v2/OnboardingV2.tsx for the full stage breakdown. */}
      <MakeYoursModal
        open={showModal}
        onClose={handleModalClose}
      />
    </div>
  );

  // ── State machine ───────────────────────────────────────────────────────────

  if (appState === "start") {
    // "Start onboarding experience" now goes to the Sign In step first —
    // `startOnboarding` (the former direct handler, now fired by Sign In's
    // `onSignIn` once its 2s loader completes) is what actually advances to
    // Stage 1.
    const goToSignIn = () => setAppState("signin");
    return (
      <div className="relative h-screen w-screen bg-cover bg-center" style={{ backgroundImage: `url(${windowsWallpaperUrl})` }}>
        <div className="flex h-full w-full flex-col items-center justify-center gap-[24px] p-[24px]">
          <div className="flex flex-col rounded-[16px] bg-[rgba(0,0,0,0.4)] p-[24px] backdrop-blur-md">
            <button
              onClick={goToSignIn}
              className="w-[320px] rounded-[6px] bg-[#6d4aff] px-[32px] pb-[16px] pt-[14px] font-['Segoe_UI_Variable',sans-serif] text-[17px] font-semibold leading-[22px] text-white shadow-[0_0_24px_rgba(109,74,255,0.4)] transition-all duration-200 hover:bg-[#7c5cff] active:scale-[0.97]"
              style={{ fontVariationSettings: "'opsz' 12" }}
            >
              Start onboarding experience
            </button>
            <button
              onClick={() => setAppState("overview")}
              className="mt-[16px] w-[320px] rounded-[6px] border border-[rgba(255,255,255,0.2)] bg-transparent px-[24px] pb-[14px] pt-[12px] font-['Segoe_UI_Variable',sans-serif] text-[17px] font-semibold leading-[22px] text-[rgba(255,255,255,0.85)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white active:scale-[0.97]"
              style={{ fontVariationSettings: "'opsz' 12" }}
            >
              View flow overview
            </button>
            <button
              onClick={() => setAppState("prd")}
              className="mt-[16px] w-[320px] rounded-[6px] border border-[rgba(255,255,255,0.2)] bg-transparent px-[24px] pb-[14px] pt-[12px] font-['Segoe_UI_Variable',sans-serif] text-[17px] font-semibold leading-[22px] text-[rgba(255,255,255,0.85)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white active:scale-[0.97]"
              style={{ fontVariationSettings: "'opsz' 12" }}
            >
              View PRD details
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (appState === "signin") {
    // Fires once Sign In's 2s "Signing in…" loader completes — this is the
    // exact same handoff "Start onboarding experience" used to do directly.
    const startOnboarding = () => {
      localStorage.removeItem(SHOWN_KEY);
      localStorage.removeItem(WELCOME_BANNER_SHOWN_KEY);
      localStorage.removeItem(DEFERRED_ONBOARDING_KEY);
      setShowWelcomeBanner(false);
      setDeferredOnboarding(false);
      setDeferredBannerDismissed(false);
      setResumeAtJtbd(false);
      setCurrentStage("connection");
      setAppState("onboarding");
    };
    return (
      <>
        <SignInScreen onSignIn={startOnboarding} onClose={handleCloseOnboarding} />
        <SignInPlanControl
          plan={onboardingPlan}
          onPlanChange={handleOnboardingPlanChange}
        />
      </>
    );
  }

  if (appState === "overview") {
    return <FlowOverview onBack={() => setAppState("start")} />;
  }

  if (appState === "prd") {
    return <PrdOverview onBack={() => setAppState("start")} />;
  }

  return (
    <div
      className="relative w-screen h-screen"
      data-theme={effectiveTheme}
    >
      <StageIndicator stage={currentStage} />
      <PrototypeControls
        stage={currentStage}
        variant={variant}
        resultLayout={resultLayout}
        tuningConcept={tuningConcept}
        plan={onboardingPlan}
        upsellVariant={upsellVariant}
        tone={tone}
        selectionMode={selectionMode}
        failureSimPresetId={failureSimPresetId}
        onVariantChange={setVariant}
        onResultLayoutChange={setResultLayout}
        onTuningConceptChange={setTuningConcept}
        onUpsellVariantChange={setUpsellVariant}
        onToneChange={setTone}
        onSelectionModeChange={setSelectionMode}
        onFailureSimChange={setFailureSimPresetId}
      />

      {appState !== "onboarding" && (
        <div className="absolute inset-0 z-0">
          {mainApp}
        </div>
      )}

      {/* The onboarding layer has to actually LEAVE `AnimatePresence` for the
          handoff to finish. Keeping it mounted through "transitioning" and only
          fading it via `animate` deadlocked the state machine: `onExitComplete`
          is the sole path to "app", but it can never fire while the child is
          still present, so the layer stayed mounted forever — invisible at
          `opacity: 0`, yet still hit-testable across `inset-0`, which silently
          swallowed every hover and click in the main app underneath. Gating on
          "onboarding" alone lets `exit` run the same crossfade (the child stays
          rendered for its duration) and then promote the state, and
          `pointerEvents: "none"` in the exit target hands input back to the app
          the moment the fade starts. It lives in `exit` rather than `style`
          because `AnimatePresence` renders an exiting child from its snapshot
          and won't pick up new parent state. */}
      <AnimatePresence onExitComplete={() => setAppState((s) => (s === "transitioning" ? "app" : s))}>
        {appState === "onboarding" && (
          <motion.div
            key="onboarding"
            className="absolute inset-0 z-10"
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, pointerEvents: "none" }}
            transition={{ duration: TRANSITION_TIMING.mapCrossfade.duration / 1000, ease: "easeInOut" }}
          >
            <OnboardingV2
              onExit={handleEnterApp}
              onClose={handleCloseOnboarding}
              plan={onboardingPlan}
              countrySelectionEnabled={countrySelectionEnabled}
              variant={variant}
              resultLayout={resultLayout}
              tuningConcept={effectiveTuningConcept(tuningConcept, onboardingPlan)}
              upsellVariant={upsellVariant}
              tone={tone}
              selectionMode={selectionMode}
              onStageChange={setCurrentStage}
              failureSimPresetId={failureSimPresetId}
              resumeAtJtbd={resumeAtJtbd}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}
