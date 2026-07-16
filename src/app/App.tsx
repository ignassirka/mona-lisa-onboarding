import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ISPRegulationsPanel } from "./components/ISPRegulationsPanel";
import { WorldMap } from "./components/WorldMap";
import OnboardingV2, { CONNECTION_GROUPS, connectionGroupForVariant, ONBOARDING_STAGES, STAGE_ORDER, STAGE_VERSIONS, type OnboardingStage, type OnboardingVariant, type ResultLayout } from "./onboarding-v2/OnboardingV2";
import { STAGE_SUPPORTS_TONE, TONE_OPTIONS, type ToneOfVoice } from "./onboarding-v2/lib/toneOfVoice";
import type { JtbdId, SelectionMode } from "./onboarding-v2/lib/jtbdData";
import MakeYoursModal from "./components/MakeYoursModal";
import SignInScreen from "./components/SignInScreen";
import FlowOverview from "./components/FlowOverview";
import PrdOverview from "./components/PrdOverview";
import { ThemeProvider, useTheme } from "./ThemeContext";
import type { MapLayerOption } from "../imports/RightVpnFeatures";
import { TRANSITION_TIMING } from "./transitionTiming";
import type { SessionPlan, OnboardingExitOptions } from "./lib/sessionPlan";
import windowsWallpaperUrl from "./assets/windows-wallpaper.png";

export type VpnStatus = "unprotected" | "connecting" | "protected";

const PANEL_DEFAULT = 340;
const PANEL_MIN     = 200;
const PANEL_MAX     = 400;

// Match the onboarding v2 protected-Netherlands map exactly.
const NL_LAT = 52.37;
const NL_LNG = 4.9;
const NL_ZOOM = 4;

const SHOWN_KEY = "makeYoursModalShown";
// Dedicated flag for the post-onboarding welcome banner — decoupled from
// `SHOWN_KEY` (which specifically gates the "Set it up your way" modal's own
// re-display) even though today both are cleared together on every
// `startOnboarding` (so the banner replays alongside the modal on each
// prototype demo run, not literally "once ever").
const WELCOME_BANNER_SHOWN_KEY = "welcomeBannerShown";

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
  tone,
  selectionMode,
  onVariantChange,
  onResultLayoutChange,
  onToneChange,
  onSelectionModeChange,
  preStart = false,
}: {
  stage: OnboardingStage;
  variant: OnboardingVariant;
  resultLayout: ResultLayout;
  tone: ToneOfVoice;
  selectionMode: SelectionMode;
  onVariantChange: (v: OnboardingVariant) => void;
  onResultLayoutChange: (v: ResultLayout) => void;
  onToneChange: (t: ToneOfVoice) => void;
  onSelectionModeChange: (m: SelectionMode) => void;
  /** Shown on the initial black start screen, before onboarding begins —
   * lets the Version/Layout/Tone controls below pick stage 1's content
   * ahead of time, without implying a real (numbered) stage is active yet. */
  preStart?: boolean;
}) {
  // "Selection" — Single (default, untouched) / Multiple JTBD picking. Only
  // meaningful for the "tuning" stage's JTBD picker + result; shown there
  // (and pre-start, so it can be picked ahead of time like Tone/Layout are).
  const showSelectionSelect = preStart || stage === "tuning";
  const stageNumber = STAGE_ORDER.indexOf(stage) + 1;
  const stageName = ONBOARDING_STAGES[stage].name;
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

  // Other stages: a single flat dropdown (unchanged behavior). For "tuning"
  // AND "upgrade" this now picks the tuned-result LAYOUT — the SAME shared
  // `resultLayout` state, not two independent selectors (see `flatLabel`
  // below and `PlusWelcomeState`'s `layout` prop, fed from this same value).
  const usesResultLayout = stage === "tuning" || stage === "upgrade";
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
      <span className={textClass}>
        Stage: <strong className={`text-white ${textClass}`}>{preStart ? "0 - Empty" : `${stageNumber} ${stageName}`}</strong>
      </span>
      <span className="h-[16px] w-px bg-[rgba(255,255,255,0.15)]" />

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
      ) : (
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
  /** Whether the user landed in the main app on Free or VPN Plus — set by
   * `handleEnterApp` from onboarding exit (`"free"` for Continue free + Skip,
   * `"plus"` only after in-session checkout). Drives the free-tier connection
   * card, disabled onboarding profiles, and Plus teaser banner. */
  const [sessionPlan, setSessionPlan] = useState<SessionPlan>("plus");
  /** Incremented to ask `CountryBrowser` to switch to the Countries tab
   * (wired from the free-tier connection card's "Change server" button). */
  const [countriesTabFocusKey, setCountriesTabFocusKey] = useState(0);
  // Fires the calm, auto-dismissing welcome banner exactly once, right
  // after the "Set it up your way" modal closes. See `handleModalClose`.
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(false);

  // Which onboarding content variant the user picked on the start screen
  const [variant, setVariant] = useState<OnboardingVariant>("hybrid");
  // Which tuned-result layout is active (prototype control)
  const [resultLayout, setResultLayout] = useState<ResultLayout>("stacked");
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
    setVpnStatus("connecting");
    connectTimerRef.current = setTimeout(() => setVpnStatus("protected"), 3000);
  }, []);

  const handleDisconnect = useCallback(() => {
    if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
    setVpnStatus("unprotected");
    setConnectedCountry(null);
  }, []);

  // Called when the window chrome's "X" is clicked mid-onboarding — closes
  // the window straight back to the prototype's initial start screen (the
  // 3-button screen), skipping the normal onExit→main-app handoff entirely.
  // `OnboardingV2` fully unmounts (its early-return branches don't render
  // it once `appState` is "start"), so its internal phase/selection state
  // is naturally reset the next time onboarding is started again.
  const handleCloseOnboarding = useCallback(() => {
    setAppState("start");
  }, []);

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
    suppressWelcomeBannerRef.current = !vpnConnected;

    setSessionPlan(plan);
    if (vpnConnected) {
      setVpnStatus("protected");
      setConnectedCountry("Netherlands");
    } else {
      setVpnStatus("unprotected");
      setConnectedCountry(null);
      setSelectedCountry(null);
    }
    setShowEntrance(true);
    setAppState("transitioning");
    setCurrentStage("personalization");
    setOnboardingJtbds(selectedJtbds);

    // After the last panel finishes sliding in, show the modal (once) —
    // skipped when the user bailed straight to the app (Go to app directly).
    const totalDuration = TRANSITION_TIMING.leftPanel.start + TRANSITION_TIMING.leftPanel.duration + 400;
    modalTimerRef.current = setTimeout(() => {
      if (vpnConnected && !localStorage.getItem(SHOWN_KEY)) {
        setShowModal(true);
      }
    }, totalDuration);
  }, []);

  const handleChangeServer = useCallback(() => {
    setCountriesTabFocusKey((k) => k + 1);
  }, []);

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
            sessionPlan={sessionPlan}
            countriesTabFocusKey={countriesTabFocusKey}
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

        <PrototypeControls
          stage={currentStage}
          variant={variant}
          resultLayout={resultLayout}
          tone={tone}
          selectionMode={selectionMode}
          onVariantChange={setVariant}
          onResultLayoutChange={setResultLayout}
          onToneChange={setTone}
          onSelectionModeChange={setSelectionMode}
          preStart
        />
      </div>
    );
  }

  if (appState === "signin") {
    // Fires once Sign In's 2s "Signing in…" loader completes — this is the
    // exact same handoff "Start onboarding experience" used to do directly.
    const startOnboarding = () => {
      localStorage.removeItem(SHOWN_KEY);
      localStorage.removeItem(WELCOME_BANNER_SHOWN_KEY);
      setShowWelcomeBanner(false);
      setCurrentStage("connection");
      setAppState("onboarding");
    };
    return <SignInScreen onSignIn={startOnboarding} onClose={handleCloseOnboarding} />;
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
      <PrototypeControls
        stage={currentStage}
        variant={variant}
        resultLayout={resultLayout}
        tone={tone}
        selectionMode={selectionMode}
        onVariantChange={setVariant}
        onResultLayoutChange={setResultLayout}
        onToneChange={setTone}
        onSelectionModeChange={setSelectionMode}
      />

      {appState !== "onboarding" && (
        <div className="absolute inset-0 z-0">
          {mainApp}
        </div>
      )}

      <AnimatePresence onExitComplete={() => setAppState("app")}>
        {(appState === "onboarding" || appState === "transitioning") && (
          <motion.div
            key="onboarding"
            className="absolute inset-0 z-10"
            animate={{ opacity: appState === "transitioning" ? 0 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: TRANSITION_TIMING.mapCrossfade.duration / 1000, ease: "easeInOut" }}
          >
            <OnboardingV2
              onExit={handleEnterApp}
              onClose={handleCloseOnboarding}
              variant={variant}
              resultLayout={resultLayout}
              tone={tone}
              selectionMode={selectionMode}
              onStageChange={setCurrentStage}
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
