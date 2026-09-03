import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import OnboardingMapV2 from "./OnboardingMapV2";
import WindowChrome from "./components/WindowChrome";
import Spinner from "./components/Spinner";
import InfoCard, { FlagValue, MaskedValue, type InfoRow } from "./components/InfoCard";
import JtbdGridPanel from "./JtbdGridPanel";
import TunedResult from "./tuned-result/TunedResult";
import ProgressRingConcept from "./tuned-result/concepts/ProgressRingConcept";
import ChecklistConcept from "./tuned-result/concepts/ChecklistConcept";
import ReceiptConcept from "./tuned-result/concepts/ReceiptConcept";
import ProfilesBaselineConcept from "./tuned-result/concepts/profiles-baseline/ProfilesBaselineConcept";
import ProfilesRehearsalConcept from "./tuned-result/concepts/profiles-rehearsal/ProfilesRehearsalConcept";
import ProfilesShelfConcept from "./tuned-result/concepts/profiles-shelf/ProfilesShelfConcept";
import ProfilesDeckConcept from "./tuned-result/concepts/profiles-deck/ProfilesDeckConcept";
import ProfilesDraftConcept from "./tuned-result/concepts/profiles-draft/ProfilesDraftConcept";
import ProfileFirstConcept from "./tuned-result/concepts/profile-first/ProfileFirstConcept";
import ProfilesCarouselConcept from "./tuned-result/concepts/profiles-carousel/ProfilesCarouselConcept";
import ProfilesCarouselV2Concept from "./tuned-result/concepts/profiles-carousel-v2/ProfilesCarouselV2Concept";
import ProfilesCarouselV2FreeConcept from "./tuned-result/concepts/profiles-carousel-v2-free/ProfilesCarouselV2FreeConcept";
import VPNPlusUpsell from "./components/VPNPlusUpsell";
import ComparisonTable from "./versions/upsell/ComparisonTable";
import ValueStack from "./versions/upsell/ValueStack";
import CardGrid from "./versions/upsell/CardGrid";
import PlanSelector from "./versions/upsell/PlanSelector";
import HeroSpotlight from "./versions/upsell/HeroSpotlight";
import ProfilesHeroTabs from "./versions/upsell/ProfilesHeroTabs";
import ProfilesBand from "./versions/upsell/ProfilesBand";
import ProfilesPaired from "./versions/upsell/ProfilesPaired";
import ProfilesFan from "./versions/upsell/ProfilesFan";
import FeaturesLedBand from "./versions/upsell/FeaturesLedBand";
import FeaturesLedPeek from "./versions/upsell/FeaturesLedPeek";
import FeaturesLedInline from "./versions/upsell/FeaturesLedInline";
import SimulatedWebCheckout from "./components/checkout/SimulatedWebCheckout";
import LoaderScreen from "./components/LoaderScreen";
import PlusWelcomeState from "./components/PlusWelcomeState";
import ControlPanelOverlay from "./components/ControlPanelOverlay";
import SkipConnectionLaterButton from "./components/SkipConnectionLaterButton";
import ConnectingNarration from "./components/ConnectingNarration";
import ConnectionFailedOverlay from "./components/ConnectionFailedOverlay";
import InPlainSight from "./versions/v4-in-plain-sight/InPlainSight";
import InPlainSightSplit from "./versions/v4-in-plain-sight/InPlainSightSplit";
import Hybrid from "./versions/hybrid/Hybrid";
import HybridSplit from "./versions/hybrid/HybridSplit";
import { useIpDetection } from "./lib/useIpDetection";
import { VPN_SERVER, resolveVpnDestination } from "./lib/server";
import { ENTRANCE_TIMING, sec } from "./lib/entranceTiming";
import { CONNECTION_COPY, resolveIspKnown, type ToneOfVoice } from "./lib/toneOfVoice";
import { useConnectionAttempt } from "./lib/useConnectionAttempt";
import { resolveFailureSimPreset, type FailureCause } from "./lib/connectionSimulator";
import { trackConnectionFailureEvent, setAnalyticsPlan } from "./lib/analytics";
import type { JtbdId, SelectionMode } from "./lib/jtbdData";
import type { SessionPlan } from "../lib/sessionPlan";
import type { PinStatus } from "./lib/mapKit";
import { useReducedMotion } from "./versions/lib/useReducedMotion";
import windowsWallpaperUrl from "../assets/windows-wallpaper.png";

// No separate "tuning" (loader) phase — the consolidated result step
// (`TunedResult`) opens with its own centered intro and IS the
// perceived-progress surface; the picker advances straight to `tuned`.
type Phase =
  | "unprotected"
  | "connecting"
  | "failed"
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
  connection: { name: "Establishing VPN connection", phases: ["unprotected", "connecting", "failed", "protected"] },
  tuning: { name: "Personalized JTBD tuning", phases: ["jtbd", "tuned"] },
  upgrade: { name: "Upgrade to Plus", phases: ["upsell", "web-checkout", "checkout", "plus-welcome"] },
  personalization: { name: "Final personalization", phases: [] }, // lives in App.tsx (MakeYoursModal), not this phase machine
};

const PHASE_STAGE: Record<Phase, Exclude<OnboardingStage, "personalization">> = {
  unprotected: "connection",
  connecting: "connection",
  failed: "connection",
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

/** Steps counted by the top-of-window onboarding-length indicator
 * (`WindowChrome`'s `progress` prop) — its own granularity, deliberately
 * NOT identical to `OnboardingStage`: the "tuning" stage's two phases read
 * as two distinct user-visible moments, not one — `"jtbd"` (picking what
 * you use the VPN for) and `"tuned"` (the result: settings applied for
 * Free, profiles generated for Plus) — so the indicator splits them into
 * separate steps rather than collapsing them into one "tuning" segment.
 * "personalization" and Sign In aren't steps at all (see their own notes
 * below), and "upgrade" collapses its 4 phases (`upsell`/`web-checkout`/
 * `checkout`/`plus-welcome`) into one step — that stage is genuinely one
 * user-visible moment ("deciding whether to upgrade"), unlike tuning's two. */
export type OnboardingProgressStep = "connection" | "jtbd" | "tuned" | "upgrade";

const PHASE_PROGRESS_STEP: Record<Phase, OnboardingProgressStep> = {
  unprotected: "connection",
  connecting: "connection",
  failed: "connection",
  protected: "connection",
  jtbd: "jtbd",
  tuned: "tuned",
  upsell: "upgrade",
  "web-checkout": "upgrade",
  checkout: "upgrade",
  "plus-welcome": "upgrade",
};

/** Plan-aware step list. "personalization" is excluded — it has no phases
 * of its own here (`MakeYoursModal` is disabled and lives post-`onExit`, in
 * `App.tsx`, outside this component entirely — there's nothing for the
 * indicator to represent while still inside `OnboardingV2`). Sign In (before
 * this component even mounts) isn't a step either — signing in isn't part
 * of "how long is onboarding", it's the gate before it starts, so
 * `WindowChrome` there renders with no `progress` prop at all. Plus skips
 * "upgrade" outright (same rule `ONBOARDING_STAGES` and the Plan-awareness
 * doc already establish), so Plus is "Connecting to VPN" → "Selecting what
 * you use it for" → "Profiles generated" (3 steps) while Free adds a 4th,
 * "Upgrade to Plus". */
export function onboardingProgressSteps(plan: SessionPlan): OnboardingProgressStep[] {
  return plan === "plus" ? ["connection", "jtbd", "tuned"] : ["connection", "jtbd", "tuned", "upgrade"];
}

/** Total step count for the indicator — plan-aware via
 * `onboardingProgressSteps`. */
export function onboardingProgressTotal(plan: SessionPlan): number {
  return onboardingProgressSteps(plan).length;
}

/** This component's own current step (0-indexed) for a given phase + plan.
 * Coarse by design within each step's own phases (there are none left with
 * more than one phase per step except "upgrade"'s 4): back-navigation
 * between `jtbd`/`tuned` now DOES move the indicator (they're separate
 * steps), which is correct — going back from the tuned result to the
 * picker genuinely un-completes that step. Skipping the connection stage
 * entirely (`skippedConnection`) just means step 0 ("connection") is never
 * rendered as the active step before the indicator jumps straight to step 1
 * ("jtbd") — it's still shown as reached, matching the coarse, non-punitive
 * intent of a length indicator rather than a strict completion tracker. */
export function onboardingProgressCurrent(plan: SessionPlan, phase: Phase): number {
  const steps = onboardingProgressSteps(plan);
  const index = steps.indexOf(PHASE_PROGRESS_STEP[phase]);
  return index === -1 ? 0 : index;
}

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
  // The "Personalized JTBD tuning" stage (phase `tuned`) has no Layout
  // dropdown at all anymore — it always renders the default concept's
  // "Minimal list" (`stacked`) arrangement; this entry is unused by the
  // prototype-controls HUD (kept as an empty list so the "does this stage
  // have alternatives" check below stays accurate).
  tuning: [],
  // "Upgrade to Plus" reuses the SAME 4 layout renderers as stage 2's
  // result step for its own, separate Plus-welcome result
  // (`PlusWelcomeState`) — this list (and the "Layout" dropdown it drives,
  // below) drives ONLY this stage's `resultLayout` state today (stage 2 no
  // longer has a Layout selector to share it with).
  upgrade: [
    { value: "profiles-showcase", label: "Profiles showcase" },
    { value: "stacked", label: "Minimal list" },
    { value: "compact-list", label: "Richer list" },
    { value: "split-by-status", label: "Split view" },
    { value: "card-grid", label: "Card Grid" },
  ],
  personalization: [{ value: "default", label: "Default" }],
};

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

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

/** Layout for the result step's 4 arrangements (`tuned-result/layouts/*`).
 * `ResultLayout` only picks the RESOLVED ARRANGEMENT of the 5 settings
 * items — everything else (intro, header move, counter, completion, tip,
 * Continue) is identical across all four. `stacked` is the default (the
 * former "Visual Tuning" row style — merged "{settingsName}: {value}" pill,
 * no per-row background). `compact-list` reuses the former "Default"
 * version's simpler row style (`EnabledFeatureRow`/`PaidFeatureRow`'s
 * existing `layout="row"` mode). `split-by-status`/`card-grid` reuse those
 * former versions' arrangements (`layout="stacked"`/`"card"`), now adapted
 * to materialize one item at a time into their columns/cards instead of
 * appearing fully-formed. Stage 2's own result step (`TunedResult`, phase
 * `tuned`) now always renders `stacked` ("Minimal list") — no Layout
 * selector for stage 2 anymore; `ResultLayout` today only drives the
 * SEPARATE stage-3 VPN Plus Welcome result (`PlusWelcomeState`), which
 * keeps its own "Layout" dropdown. See `docs/features/onboarding-v2.md`. */
export type ResultLayout = "stacked" | "split-by-status" | "card-grid" | "compact-list" | "profiles-showcase";

/** The "Upgrade to Plus" upsell screen's own content-VERSION choice —
 * distinct from `ResultLayout` (which only affects the SEPARATE VPN Plus
 * Welcome step, `PHASE_STAGE.upsell` §"upgrade" stage). `"default"` is the
 * original `VPNPlusUpsell` (left byte-for-byte untouched); the other 5 are
 * alternative layouts researched from real-world paywall patterns, all
 * populated from the exact same intent-driven ranked feature engine,
 * subtitle logic, pricing, and CTAs. See docs/features/onboarding-v2.md →
 * "Upsell alternative layouts". */
export type UpsellVariant =
  | "default"
  | "comparison-table"
  | "value-stack"
  | "card-grid"
  | "plan-selector"
  | "hero-spotlight"
  | "profiles-hero-tabs"
  | "profiles-band"
  | "profiles-paired"
  | "profiles-fan"
  | "features-led-band"
  | "features-led-peek"
  | "features-led-inline";

export const UPSELL_VERSIONS: { value: UpsellVariant; label: string }[] = [
  // Prototype dropdown — four active variations; see `UpsellVariant` for the
  // full union (other layouts remain wired in the render switch but hidden
  // here). Default — see `App.tsx` `upsellVariant` initial state.
  { value: "profiles-hero-tabs", label: "Profiles tabs" },
  { value: "profiles-fan", label: "Profiles carousel" },
  { value: "features-led-band", label: "Profile bullet point" },
  { value: "default", label: "No profiles" },
];

/** The "Personalized JTBD tuning" stage's own content-CONCEPT choice —
 * distinct from `ResultLayout` (which is now only used by the separate
 * stage-3 Plus Welcome step). `"default"` is the original `TunedResult`
 * (left byte-for-byte untouched, always rendered with `layout="stacked"` —
 * no Layout selector for stage 2 anymore, "Minimal list" is the only
 * arrangement); the others are alternative concepts, each revamping BOTH the
 * materialization ("applying") phase AND the resolved result as one
 * coherent pattern — all populated from the exact same tuning data +
 * merge/rank/cap engine, materialization schedule, and tone copy.
 *
 * Three explorations live on this one axis. The first four come from
 * real-world setup/config patterns and treat the applied SETTINGS as the
 * outcome. The five `profiles-*` entries are a separate exploration in which
 * PROFILES are the outcome and the settings are demoted or reframed; they
 * share a data layer (`tuned-result/profiles/`) and are plan-aware, unlike
 * the first four. `"profile-first"` and the two `"profiles-carousel"`
 * versions go one step further and are Plus-ONLY (see
 * `PLUS_ONLY_TUNING_CONCEPTS`), which lets them drop every locked and
 * aspirational treatment the others need — and lets a carousel's per-card
 * Connect actually run, which no Free-capable concept can offer. The two
 * carousel versions differ in how far they commit to the idea: v1 keeps two
 * app-wide setting rows below the cards, v2 removes them so the profiles are
 * the whole outcome. `"profiles-carousel-v2-free"` is the thirteenth and the
 * only entry gated the OTHER way (`FREE_ONLY_TUNING_CONCEPTS`) — v2's cards,
 * demoted below the two free settings that actually got applied, since that
 * inversion is the whole answer to what a Free user gets out of a screen full
 * of paid profiles. The label prefixes exist because thirteen options in one
 * dropdown need the explorations to be visually separable.
 *
 * See docs/features/onboarding-v2.md → "Tuning alternative concepts" and
 * docs/specs/profiles-tuning/. */
export type TuningConcept =
  | "default"
  | "progress-ring"
  | "checklist"
  | "receipt"
  | "profiles-baseline"
  | "profiles-rehearsal"
  | "profiles-shelf"
  | "profiles-deck"
  | "profiles-draft"
  | "profile-first"
  | "profiles-carousel"
  | "profiles-carousel-v2"
  | "profiles-carousel-v2-free";

export const TUNING_CONCEPTS: { value: TuningConcept; label: string }[] = [
  { value: "default", label: "Default — Minimal list" },
  { value: "progress-ring", label: "Progress-ring completion" },
  { value: "checklist", label: "Setup checklist build-up" },
  { value: "receipt", label: "Setup summary / receipt" },
  { value: "profiles-baseline", label: "Profiles — Baseline + shortcuts" },
  { value: "profiles-rehearsal", label: "Profiles — Rehearsal stage" },
  { value: "profiles-shelf", label: "Profiles — Shelf gallery" },
  { value: "profiles-deck", label: "Profiles — Focused deck" },
  { value: "profiles-draft", label: "Profiles — Editable drafts" },
  { value: "profile-first", label: "Plus only — Profile-first" },
  // v1's `value` deliberately stays `profiles-carousel` — renaming it would
  // silently split every event already recorded against that id.
  { value: "profiles-carousel", label: "Plus only — Profiles carousel v1" },
  { value: "profiles-carousel-v2", label: "Profiles carousel v2" },
  { value: "profiles-carousel-v2-free", label: "Profiles carousel v2" },
];

/** Prototype simplification — the Concept dropdown only surfaces these two
 * per plan on stage 2. Everything else stays in the codebase (render switch,
 * analytics ids, docs) but is hidden from reviewers until re-enabled. */
export const VISIBLE_TUNING_CONCEPTS_BY_PLAN: Record<SessionPlan, readonly TuningConcept[]> = {
  free: ["default", "profiles-carousel-v2-free"],
  plus: ["profiles-carousel-v2", "default"],
};

/** Prototype default for the Concept dropdown — Plus reviewers land on the
 * carousel; Free reviewers land on Minimal list. */
export function defaultTuningConceptForPlan(plan: SessionPlan): TuningConcept {
  return plan === "plus" ? "profiles-carousel-v2" : "default";
}

/** Concepts with no Free state at all, so they're only offered on a Plus run.
 *
 * This is a real design position rather than unfinished work. `profile-first`
 * presents every profile as live and every feature as on, with nothing locked
 * anywhere. Both carousels go further still: their per-card Connect leaves
 * onboarding connected to that profile, and half those destinations are
 * unreachable on a Free run — v2 more so, since each of its cards also offers
 * a free choice of any of the 148 Plus countries. Rendering any of them to a
 * Free reviewer wouldn't be a degraded version of the concept, it would be a
 * false one. Gating them at the dropdown keeps the concepts themselves free
 * of plan branching entirely. */
export const PLUS_ONLY_TUNING_CONCEPTS: readonly TuningConcept[] = [
  "profile-first",
  "profiles-carousel",
  "profiles-carousel-v2",
];

/** The mirror image of the list above: concepts whose entire subject is the
 * FREE state, so a Plus run has nothing for them to render.
 *
 * `profiles-carousel-v2-free` puts the two genuinely-applied free settings
 * first and the profiles below a "available with VPN Plus" boundary, dimmed.
 * On a Plus run every one of those profiles is live and nothing is locked, so
 * the boundary would divide nothing and the dimming would be a lie in the
 * other direction. The Plus answer to the same design question already exists
 * as `profiles-carousel-v2`; gating each to the plan it was designed for is
 * what lets both stay free of plan branching internally. */
export const FREE_ONLY_TUNING_CONCEPTS: readonly TuningConcept[] = ["profiles-carousel-v2-free"];

/** The concepts a given plan may pick, for the prototype's Concept dropdown.
 * Filtered to `VISIBLE_TUNING_CONCEPTS_BY_PLAN` — see that list for which
 * options are currently surfaced vs merely kept in code. */
export function tuningConceptsForPlan(plan: SessionPlan): { value: TuningConcept; label: string }[] {
  const allowed = VISIBLE_TUNING_CONCEPTS_BY_PLAN[plan];
  return TUNING_CONCEPTS.filter((c) => allowed.includes(c.value));
}

/** Coerces a stale selection back to the plan's default. The Concept dropdown
 * and the Plan control live on different screens, so a reviewer can pick a
 * hidden concept, switch plan, or carry a selection from before the whitelist. */
export function effectiveTuningConcept(concept: TuningConcept, plan: SessionPlan): TuningConcept {
  const allowed = VISIBLE_TUNING_CONCEPTS_BY_PLAN[plan];
  if (!allowed.includes(concept)) return defaultTuningConceptForPlan(plan);
  return concept;
}

interface OnboardingV2Props {
  /** Fired once onboarding completes normally (Continue free / Start using
   * VPN Plus) — receives the ordered list of JTBDs the user actually ended
   * up with (Single mode: the one pick, as a 1-item array; Multiple mode:
   * the full ordered selection), so the main app can default to the
   * Profiles tab and generate profile items for them. Empty/omitted when
   * onboarding is abandoned via Skip (no real intent was ever committed).
   * The second argument is the session plan: `"free"` for upsell Continue
   * free; `"plus"` after in-session checkout → Plus Welcome, OR directly
   * from a Plus-plan run's tuning result (skipping checkout entirely — see
   * "Plan awareness" in docs/features/onboarding-v2.md). Skip/Tier-3/Go-to-
   * app-directly exits mid-run pass through whatever the "Plan" controller
   * (`plan` prop below) was set to, rather than a hardcoded `"free"`, so a
   * Plus-plan run that bails out early still lands on the Plus app state.
   * The third argument can set `vpnConnected: false` (e.g. JTBD **Go to app
   * directly**) to land in the main app without an active VPN session. */
  onExit?: (
    selectedJtbds?: JtbdId[],
    plan?: import("../lib/sessionPlan").SessionPlan,
    options?: import("../lib/sessionPlan").OnboardingExitOptions,
  ) => void;
  /** Prototype HUD control — which `FAILURE_SIM_PRESETS` id to simulate for
   * the connection stage. Defaults to `"none"` (the untouched happy path).
   * There is no real connection service to detect a genuine failure from
   * (see docs/features/onboarding-v2.md → "Connection failure path",
   * checkpoint 0), so every cause/tier in the three-tier failure path is
   * demoed by deliberately choosing a preset here. */
  failureSimPresetId?: string;
  /** True only when this mount is the deferred-onboarding resume entry
   * point (main app's "Want to finish personalizing your VPN?" banner) —
   * the user is ALREADY connected (Tier 3 landed them disconnected, but
   * they connected themselves afterward), so this skips stages 1 entirely
   * and opens directly on the intent picker. */
  resumeAtJtbd?: boolean;
  /** Fired by the window chrome's "X" close control — distinct from
   * `onExit` (which hands off to the main app once onboarding completes
   * normally): this returns to the prototype's initial start screen (the
   * 3-button screen), same as closing the real app window mid-onboarding. */
  onClose?: () => void;
  variant?: OnboardingVariant;
  /** Result layout for the JTBD tuning stage. */
  resultLayout?: ResultLayout;
  /** Content concept for the "Personalized JTBD tuning" result step —
   * independent from `resultLayout` (which only picks the resolved
   * arrangement WITHIN the default concept, and is separately reused by
   * the Plus Welcome step). Defaults to `"default"`, the original
   * `TunedResult`. */
  tuningConcept?: TuningConcept;
  /** Content version for the "Upgrade to Plus" upsell screen — independent
   * from `resultLayout` (which only drives the separate VPN Plus Welcome
   * step). Defaults to `"profiles-fan"` ("Profiles + features — Fanned deck");
   * `"default"` is the original `VPNPlusUpsell`. */
  upsellVariant?: UpsellVariant;
  /** Tone of voice for the connection stage copy (content only). */
  tone?: ToneOfVoice;
  /** "Selection" prototype control — defaults to `"single"`, which is the
   * ENTIRE stage's pre-existing behavior, byte-for-byte. `"multiple"` lets
   * the JTBD picker select 1–6 intents; see docs/features/onboarding-v2.md
   * → "Multiple-mode tuning". */
  selectionMode?: SelectionMode;
  /** Fired whenever the active stage changes, so prototype controls (App.tsx) can display it. */
  onStageChange?: (stage: OnboardingStage) => void;
  /** The prototype's "Plan" controller (Sign In screen only) — the single
   * source of truth for this entire run. `"free"` (default) is this whole
   * component's pre-existing behavior, byte-for-byte. `"plus"` makes the
   * tuning result materialize every feature as applied (no locked rows, no
   * divider) and skips straight from tuning to `onExit` — the upsell,
   * simulated checkout, and Plus Welcome phases become unreachable (they
   * remain intact for the Free path). See docs/features/onboarding-v2.md →
   * "Plan awareness". */
  plan?: SessionPlan;
  /** Plus-only prototype sub-toggle (Sign In screen, next to "Plan") — lets
   * a reviewer preview Plus's tuning/skip-upsell behavior with or without
   * the Hybrid/Hybrid Split country selector (`CountrySelect`), since that
   * selector is an additive feature ON TOP of Plus, not a defining part of
   * every Plus preview. Defaults to `true` (the feature's own default once
   * Plus is picked); irrelevant when `plan !== "plus"`. */
  countrySelectionEnabled?: boolean;
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
  tuningConcept = "default",
  upsellVariant = "profiles-hero-tabs",
  tone = "straightforward",
  selectionMode = "single",
  onStageChange,
  failureSimPresetId = "none",
  resumeAtJtbd = false,
  plan = "free",
  countrySelectionEnabled = true,
}: OnboardingV2Props) {
  const { geo, isLive } = useIpDetection();
  const [phase, setPhase] = useState<Phase>(resumeAtJtbd ? "jtbd" : "unprotected");
  const reducedMotion = useReducedMotion();
  // Populated once Tier 1's auto-remedies exhaust (→ Tier 2's failure
  // screen). `tier2Retried` tracks whether the ONE allowed user retry has
  // already been used, for analytics only — the retry button itself is
  // simply disabled while `connectRender.retrying` is true.
  const [failureInfo, setFailureInfo] = useState<{ cause: FailureCause; tier2Retried: boolean } | null>(null);
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
  // Plus-only country selection (Hybrid/Hybrid Split's `CountrySelect`) —
  // `null` = "Fastest country", the default and the ENTIRE Free-plan
  // behavior, byte-for-byte. Single source of truth for both the shared
  // map's protected-state flyTo destination and the chip's resolved VPN
  // identity once connected — see `resolveVpnDestination` (`lib/server.ts`).
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const protectedDestination = useMemo(() => resolveVpnDestination(selectedCountry), [selectedCountry]);
  // Plus's country selector is an additive feature ON TOP of the plan, not a
  // defining part of it — the Sign In screen's "Country selection" sub-
  // toggle (Plus-only, defaults to "With") lets a reviewer preview the rest
  // of Plus's behavior (tuning, skip-upsell) without it. `selectedCountry`
  // simply stays `null` ("Fastest country") whenever this is `false`, since
  // Hybrid/Hybrid Split never render the selector to change it.
  const showCountrySelect = plan === "plus" && countrySelectionEnabled;
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  useEffect(() => {
    onStageChange?.(PHASE_STAGE[phase]);
    // Only re-fire when the phase (and therefore stage) actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Every onboarding analytics event should carry the active plan — rather
  // than threading a new field through every existing payload/call site,
  // `setAnalyticsPlan` lets `analytics.ts` auto-inject it into whatever gets
  // logged (confirmed at checkpoint).
  useEffect(() => {
    setAnalyticsPlan(plan);
  }, [plan]);

  // ── Connection failure path (three tiers — see docs/features/onboarding-v2.md) ──
  const failureSimConfig = useMemo(() => resolveFailureSimPreset(failureSimPresetId), [failureSimPresetId]);

  const { render: connectRender, start: startConnectAttempt, retry: retryConnectAttempt } = useConnectionAttempt({
    simConfig: failureSimConfig,
    // An explicit Plus-plan country choice must never be silently overridden
    // by the Tier 1 "try a different country" auto-remedy narration (which
    // never actually changes the destination anyway) — see the hook's own
    // doc for how this substitutes remedy1's copy.
    hasExplicitCountry: selectedCountry !== null,
    onSucceed: ({ resolvedAt, attempts }) => {
      trackConnectionFailureEvent("connection_resolved", {
        cause: failureSimConfig.cause,
        resolvedAt,
        attempts,
        variant,
        selectedCountry,
        resolvedCountry: protectedDestination.country,
      });
      setFailureInfo(null);
      setPhase("protected");
    },
    onTier1Exhausted: ({ cause, attempts }) => {
      trackConnectionFailureEvent("connection_tier1_exhausted", { cause, attempts, variant });
      trackConnectionFailureEvent("connection_tier2_view", { cause, variant });
      setFailureInfo({ cause, tier2Retried: false });
      setPhase("failed");
    },
    onTier2RetryFailed: ({ attempts }) => {
      trackConnectionFailureEvent("connection_tier2_exit", {
        cause: failureInfo?.cause ?? "generic",
        attempts,
        tier2Retried: true,
        exit: "auto_after_retry_fail",
        variant,
      });
      // Tier 3 — the single allowed retry also failed: exit to the app
      // automatically, no second failure screen. Never the upsell; never
      // marked complete (resumable). Plan-aware: a Plus-plan run still lands
      // on the Plus app state here, since this exit never reaches tuning.
      onExit?.([], plan, { vpnConnected: false, deferredDueToConnectionFailure: true });
    },
  });

  const handleProtect = useCallback(() => {
    setFailureInfo(null);
    setPhase("connecting");
    trackConnectionFailureEvent("connection_attempt_start", { cause: failureSimConfig.cause, variant, selectedCountry });
    startConnectAttempt();
  }, [startConnectAttempt, failureSimConfig, variant, selectedCountry]);

  const handleFailureRetry = useCallback(() => {
    setFailureInfo((f) => (f ? { ...f, tier2Retried: true } : f));
    trackConnectionFailureEvent("connection_tier2_retry", { cause: failureInfo?.cause, variant });
    retryConnectAttempt();
  }, [retryConnectAttempt, failureInfo, variant]);

  /** "Go to the app" — available from the FIRST failure screen, never
   * gated. Skips the rest of onboarding entirely; never shows the upsell;
   * marks onboarding resumable (not completed) via `deferredDueToConnectionFailure`. */
  const handleFailureGoToApp = useCallback(() => {
    trackConnectionFailureEvent("connection_tier2_exit", {
      cause: failureInfo?.cause ?? "generic",
      tier2Retried: failureInfo?.tier2Retried ?? false,
      exit: "go_to_app",
      variant,
    });
    onExit?.([], plan, { vpnConnected: false, deferredDueToConnectionFailure: true });
  }, [onExit, failureInfo, variant, plan]);

  const handleContinue = useCallback(() => setPhase("jtbd"), []);

  // Prototype utility: bypass stage 1 entirely and land on JTBD selection.
  // Since no VPN connection was actually made, the map stays unprotected.
  const handleSkipConnection = useCallback(() => {
    setSkippedConnection(true);
    setPhase("jtbd");
  }, []);

  /** Main-app handoff — when stage 1 was skipped, never mark VPN connected.
   *
   * `selectedCountry` rides along whenever the user actually reached an
   * intent selection, so the destination the tuning screen named is the
   * destination their generated sidebar profiles show. Attached here rather
   * than at each of the dozen call sites so a new exit path can't forget it;
   * gated on `selectedJtbds` because the exits that pass none (connection
   * failure, "Go to app directly") generate no profiles for it to describe. */
  const handleExit = useCallback((
    selectedJtbds: JtbdId[] = [],
    plan: import("../lib/sessionPlan").SessionPlan = "free",
    options: import("../lib/sessionPlan").OnboardingExitOptions = {},
  ) => {
    onExit?.(selectedJtbds, plan, {
      ...options,
      vpnConnected: skippedConnection ? false : options.vpnConnected,
      selectedCountry: selectedJtbds.length > 0 ? (options.selectedCountry ?? selectedCountry) : undefined,
    });
  }, [onExit, skippedConnection, selectedCountry]);

  // ── Map focus per phase ─────────────────────────────────────────────────────
  const stage = PHASE_STAGE[phase];
  // `"failed"` (Tier 2's calm failure screen) reuses "connecting"'s visual
  // treatment for every underlying element (map/pin/gradient/chip/cards) —
  // deliberately NOT the danger/unprotected styling (the reveal already made
  // the exposure point) and NOT protected (nothing succeeded). Version
  // components are handed this instead of the raw phase wherever they only
  // need to know what to RENDER (not the failure-screen affordances, which
  // live in `ConnectionFailedOverlay` alone, layered on top).
  const visualPhase: "unprotected" | "connecting" | "protected" =
    phase === "unprotected"
      ? "unprotected"
      : phase === "connecting" || phase === "failed"
        ? "connecting"
        : "protected"; // "protected" itself, and every later-stage phase (jtbd/tuned/upsell/etc.) — matches the original mapStatus fallback exactly.
  // `skippedConnection` overrides the usual "protected once you reach tuning/
  // upgrade" assumption — there was no connect, so the map keeps showing the
  // user's real (unprotected) location and pin color for the rest of the flow.
  const isProtectedSide = !skippedConnection && (phase === "protected" || stage === "tuning" || stage === "upgrade");
  const mapStatus: PinStatus = skippedConnection ? "unprotected" : visualPhase;
  // `protectedDestination` resolves to `VPN_SERVER` (Netherlands) whenever
  // `selectedCountry` is null — i.e. always, for Free plan and for any
  // version other than Hybrid/Hybrid Split (only they render the selector)
  // — so this is byte-for-byte the prior hardcoded behavior unless a Plus
  // user actually picked a country.
  const mapLat = isProtectedSide ? protectedDestination.lat : geo.lat;
  const mapLng = isProtectedSide ? protectedDestination.lng : geo.lng;
  const mapZoom = phase === "connecting" || phase === "failed" ? 3 : phase === "jtbd" ? 4 : 5;
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

  if (phase === "unprotected" || phase === "connecting" || phase === "failed") {
    // v1 / v2 — real data card. `active` (masked) covers both "connecting"
    // and the frozen "failed" visual (`visualPhase`) — never re-scrambles,
    // never resolves to protected values.
    const active = visualPhase === "connecting";
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
  // Tier 1's narration REPLACES the connecting-state headline (never the
  // reverse — the version's own default "Protecting your online
  // activity…." copy still shows for the very first attempt, before any
  // remedy narration exists). `"failed"` keeps showing whatever headline
  // was last computed for "connecting" (via `connectRender.narration`,
  // which itself freezes once Tier 1 exhausts) — the Tier 2 screen is a
  // separate overlay on top, not a headline change.
  const headline: ReactNode = (() => {
    if (phase === "unprotected") return mapCopy.exposedHeadline;
    if (phase === "connecting" || phase === "failed") return connectRender.narration ?? mapCopy.connectingHeadline;
    return mapCopy.protectedHeadline;
  })();

  const subtext: ReactNode = (() => {
    const ispKnown = resolveIspKnown(geo);
    if (phase === "unprotected") return mapCopy.exposedSub(geo.isp, ispKnown);
    if (phase === "protected") return mapCopy.protectedSub(geo.isp, ispKnown);
    if (phase === "connecting" || phase === "failed") {
      return connectRender.stillTrying ? <ConnectingNarration narration={null} stillTrying /> : null;
    }
    return null;
  })();

  const ctaProtectLabel = mapCopy.ctaProtect;

  const showOverlayContent = phase === "unprotected" || phase === "connecting" || phase === "failed" || phase === "protected";

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

        <WindowChrome
          onClose={onClose}
          progress={{ current: onboardingProgressCurrent(plan, phase), total: onboardingProgressTotal(plan) }}
        />

        {/* Stage 1 skip — top-right, unprotected only (all connection variants). */}
        {phase === "unprotected" && (
          <SkipConnectionLaterButton
            onClick={handleSkipConnection}
            className="absolute right-[20px] top-[52px] z-[1010]"
          />
        )}

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
                  phase={visualPhase}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  copy={browsingCopy}
                  connectingNarration={connectRender.narration}
                  stillTrying={connectRender.stillTrying}
                />
              )}
              {variant === "v4-split" && (
                <InPlainSightSplit
                  phase={visualPhase}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  copy={browsingCopy}
                  connectingNarration={connectRender.narration}
                  stillTrying={connectRender.stillTrying}
                />
              )}
              {variant === "hybrid" && (
                <Hybrid
                  phase={visualPhase}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  tone={tone}
                  onPinOffsetChange={setHybridPinOffsetY}
                  connectingNarration={connectRender.narration}
                  stillTrying={connectRender.stillTrying}
                  showCountrySelect={showCountrySelect}
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                />
              )}
              {variant === "hybrid-split" && (
                <HybridSplit
                  phase={visualPhase}
                  geo={geo}
                  isLive={isLive}
                  onProtect={handleProtect}
                  onContinue={handleContinue}
                  tone={tone}
                  connectingNarration={connectRender.narration}
                  stillTrying={connectRender.stillTrying}
                  showCountrySelect={showCountrySelect}
                  selectedCountry={selectedCountry}
                  onSelectCountry={setSelectedCountry}
                />
              )}
              {variant === "v2" && (
                <ControlPanelOverlay
                  phase={visualPhase}
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
              <div key={visualPhase} className="absolute left-1/2 top-[60px] w-[640px] -translate-x-1/2 text-center">
                <motion.div
                  className="mb-[12px] flex h-[40px] items-center justify-center"
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: visualPhase === "unprotected" ? sec(ENTRANCE_TIMING.padlockAppear) : 0, duration: 0.5, ease: "easeOut" }}
                >
                  {visualPhase === "unprotected" && <PadlockOpen />}
                  {visualPhase === "connecting" && <Spinner />}
                  {visualPhase === "protected" && <PadlockClosed />}
                </motion.div>
                <motion.h1
                  className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
                  style={{ fontVariationSettings: "'opsz' 24" }}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: visualPhase === "unprotected" ? sec(ENTRANCE_TIMING.headlineAppear) : 0.12, duration: 0.5, ease: "easeOut" }}
                >
                  {headline}
                </motion.h1>
                {subtext && (
                  <motion.p
                    className="mt-[8px] mx-auto max-w-[420px] font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: visualPhase === "unprotected" ? sec(ENTRANCE_TIMING.subtextAppear) : 0.24, duration: 0.5, ease: "easeOut" }}
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
              <div className="absolute left-1/2 top-[632px] flex -translate-x-1/2 flex-col items-center gap-[12px]">
                <AnimatePresence>
                  {phase === "unprotected" && (
                    <motion.button
                      key="cta-protect"
                      onClick={handleProtect}
                      disabled={!isLive}
                      className="ob2-cta-glow whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-[background-color,transform,opacity] duration-300 hover:bg-[#7c5cff] active:scale-[0.97] disabled:cursor-default disabled:opacity-50"
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
                      className="whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97]"
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

        {/* ── Tier 2: calm, cause-specific failure screen — layered on top of
            the frozen "connecting" visual above (map/pin/gradient/chip/cards
            all hold via `visualPhase`, unchanged by anything in this block).
            Version-agnostic: one implementation for all 6 connection-stage
            versions, per the cross-cutting requirement. ── */}
        <AnimatePresence>
          {phase === "failed" && failureInfo && (
            <ConnectionFailedOverlay
              key="connection-failed"
              cause={failureInfo.cause}
              retrying={connectRender.retrying}
              onRetry={handleFailureRetry}
              onGoToApp={handleFailureGoToApp}
              reduced={reducedMotion}
            />
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
                onSkip={() => handleExit([], plan, { vpnConnected: false })}
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
              {tuningConcept === "default" && (
                <TunedResult
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  userPlan={plan}
                  layout="stacked"
                  tone={tone}
                  // Plus plan: every feature already materialized as applied
                  // (no upsell to offer) — go straight to the app, skipping
                  // the upsell/checkout/Plus-Welcome phases entirely. Free
                  // plan: unchanged, continues into the upsell as before.
                  onContinue={() => (plan === "plus" ? handleExit(effectiveSelectedJtbds, "plus") : setPhase("upsell"))}
                  onBack={() => setPhase("jtbd")}
                />
              )}
              {tuningConcept === "progress-ring" && (
                <ProgressRingConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  onContinue={() => setPhase("upsell")}
                  onBack={() => setPhase("jtbd")}
                />
              )}
              {tuningConcept === "checklist" && (
                <ChecklistConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  onContinue={() => setPhase("upsell")}
                  onBack={() => setPhase("jtbd")}
                />
              )}
              {tuningConcept === "receipt" && (
                <ReceiptConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  onContinue={() => setPhase("upsell")}
                  onBack={() => setPhase("jtbd")}
                />
              )}

              {/* The 5 profiles-first concepts. Unlike the 4 above, these are
                  plan-aware and render a real Plus state, so Continue has to
                  use the same plan-aware routing `TunedResult` does —
                  sending a Plus user to the upsell after showing them their
                  live profiles would contradict what they just saw. */}
              {tuningConcept === "profiles-baseline" && (
                <ProfilesBaselineConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  userPlan={plan}
                  onContinue={() => (plan === "plus" ? handleExit(effectiveSelectedJtbds, "plus") : setPhase("upsell"))}
                  onBack={() => setPhase("jtbd")}
                />
              )}
              {tuningConcept === "profiles-rehearsal" && (
                <ProfilesRehearsalConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  userPlan={plan}
                  onContinue={() => (plan === "plus" ? handleExit(effectiveSelectedJtbds, "plus") : setPhase("upsell"))}
                  onBack={() => setPhase("jtbd")}
                />
              )}
              {tuningConcept === "profiles-shelf" && (
                <ProfilesShelfConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  userPlan={plan}
                  onContinue={() => (plan === "plus" ? handleExit(effectiveSelectedJtbds, "plus") : setPhase("upsell"))}
                  onBack={() => setPhase("jtbd")}
                />
              )}
              {tuningConcept === "profiles-deck" && (
                <ProfilesDeckConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  userPlan={plan}
                  /* The "Now" column's destination — null on Free, which
                     resolves everything to the fastest country anyway. */
                  selectedCountry={selectedCountry}
                  onContinue={() => (plan === "plus" ? handleExit(effectiveSelectedJtbds, "plus") : setPhase("upsell"))}
                  onBack={() => setPhase("jtbd")}
                />
              )}
              {tuningConcept === "profiles-draft" && (
                <ProfilesDraftConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  userPlan={plan}
                  onContinue={() => (plan === "plus" ? handleExit(effectiveSelectedJtbds, "plus") : setPhase("upsell"))}
                  onBack={() => setPhase("jtbd")}
                />
              )}

              {/* Plus-only (`PLUS_ONLY_TUNING_CONCEPTS`) — a Free run can
                  never select it, so Continue has one destination and takes
                  no `userPlan` at all. */}
              {tuningConcept === "profile-first" && (
                <ProfileFirstConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  selectedCountry={selectedCountry}
                  onContinue={() => handleExit(effectiveSelectedJtbds, "plus")}
                  onBack={() => setPhase("jtbd")}
                />
              )}

              {/* Also Plus-only. */}
              {tuningConcept === "profiles-carousel" && (
                <ProfilesCarouselConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  selectedCountry={selectedCountry}
                  onContinue={() => handleExit(effectiveSelectedJtbds, "plus")}
                  onBack={() => setPhase("jtbd")}
                />
              )}

              {/* Also Plus-only. Each v2 card owns its own country dropdown;
                  the pick is illustrative — exit is via Continue below. */}
              {tuningConcept === "profiles-carousel-v2" && (
                <ProfilesCarouselV2Concept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  onContinue={() => handleExit(effectiveSelectedJtbds, "plus")}
                  onBack={() => setPhase("jtbd")}
                />
              )}

              {/* Free-only (`FREE_ONLY_TUNING_CONCEPTS`), so the mirror of the
                  three above: a Plus run can never select it, which is why
                  Continue has one destination (the upsell it exists to set
                  up) and no `userPlan` is passed. The profiles here are a
                  preview, so there's no per-card Connect to route. */}
              {tuningConcept === "profiles-carousel-v2-free" && (
                <ProfilesCarouselV2FreeConcept
                  key={tuningConcept}
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  tone={tone}
                  onContinue={() => setPhase("upsell")}
                  onBack={() => setPhase("jtbd")}
                />
              )}
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
              {upsellVariant === "default" && (
                <VPNPlusUpsell
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "comparison-table" && (
                <ComparisonTable
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "value-stack" && (
                <ValueStack
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "card-grid" && (
                <CardGrid
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "plan-selector" && (
                <PlanSelector
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "hero-spotlight" && (
                <HeroSpotlight
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "profiles-hero-tabs" && (
                <ProfilesHeroTabs
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "profiles-band" && (
                <ProfilesBand
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "profiles-paired" && (
                <ProfilesPaired
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "profiles-fan" && (
                <ProfilesFan
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "features-led-band" && (
                <FeaturesLedBand
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "features-led-peek" && (
                <FeaturesLedPeek
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
              {upsellVariant === "features-led-inline" && (
                <FeaturesLedInline
                  jtbdKey={effectiveJtbdKey}
                  selectionMode={selectionMode}
                  selectedJtbds={selectedJtbds}
                  onUpgrade={() => setPhase("web-checkout")}
                  onContinueFree={() => handleExit(effectiveSelectedJtbds, "free")}
                  onBack={() => setPhase("tuned")}
                />
              )}
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
                selectionMode={selectionMode}
                selectedJtbds={selectedJtbds}
                upsellVariant={upsellVariant}
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
                onEnterApp={() => handleExit(effectiveSelectedJtbds, "plus")}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
