import { useEffect, useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import Confetti from "./Confetti";
import StackedLayout from "../tuned-result/layouts/StackedLayout";
import CompactListLayout from "../tuned-result/layouts/CompactListLayout";
import SplitByStatusLayout from "../tuned-result/layouts/SplitByStatusLayout";
import CardGridLayout from "../tuned-result/layouts/CardGridLayout";
import ProfilesShowcaseWelcome from "./plus-welcome/ProfilesShowcaseWelcome";
import { TUNED_RESULT_TIMING as T } from "../tuned-result/timing";
import { plusSectionHeader } from "../tuned-result/copy";
import { JTBD_TUNING_RESULT, type JTBDKey } from "../lib/jtbdTuningResult";
import { JTBD_PLUS_WELCOME, plusWelcomeSubtitleMultiple } from "../lib/jtbdUpsell";
import {
  plusWelcomeProfilesSubheading,
  plusWelcomeProfilesSubheadingMultiple,
} from "../lib/plusWelcomeCopy";
import { profilesForSelection } from "../lib/jtbdProfiles";
import {
  mergeFreeSettings,
  mergePaidFeatures,
  rankFreeSettings,
  rankPaidFeatures,
  capList,
  buildProfilePreviews,
  type TuningResultLike,
} from "../lib/jtbdMerge";
import type { ResultLayout } from "../OnboardingV2";
import type { ToneOfVoice } from "../lib/toneOfVoice";
import type { SelectionMode } from "../lib/jtbdData";
import { useReducedMotion } from "../versions/lib/useReducedMotion";

interface PlusWelcomeStateProps {
  jtbdKey: JTBDKey;
  /** "Selection" prototype control — defaults to `"single"`, which is this
   * component's entire pre-existing behavior, byte-for-byte. `"multiple"`
   * only changes anything once `selectedJtbds.length >= 2` (same "1
   * selected → exactly as today" gate `TunedResult` uses). */
  selectionMode?: SelectionMode;
  /** Multiple mode only — the full ordered selection (first-selected
   * first). Ignored in single mode. */
  selectedJtbds?: JTBDKey[];
  /** The result layout — SHARED with stage 2 (see `OnboardingV2`'s
   * `resultLayout` prop / App.tsx's single "Layout" selector). Stage 3 has
   * no selector of its own; whichever arrangement the user is viewing
   * stage 2's tuned result in is the one this renders in too. */
  layout: ResultLayout;
  /** Tone of voice — reused so the outcome sentences match what the user
   * already saw for this JTBD in stage 2 (same `toneOutcome` helper), not a
   * new tone feature of its own. */
  tone?: ToneOfVoice;
  onEnterApp: () => void;
}

// ── Animation variants (header/CTA only — item rows are ownedby each
// reused layout component) ──────────────────────────────────────────────

const titleVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const subheadingVariants: Variants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, delay: 0.12 } },
};

const buttonVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, delay: 0.9 } },
};

/** VPN Plus welcome / transformation — the same 5-item tuned result as
 * stage 2, now reusing whichever of the 4 layout renderers (Stacked / Split
 * by Status / Card Grid / Compact List) the shared "Layout" selector has
 * picked, fed the stage-3 state: the 3 free items are already active, and
 * the 2 Plus items begin in their locked visual and animate to unlocked in
 * place (`unlockTransition`, see each layout's own prop doc and
 * `TransformingPaidCell`/`StackedLayout`'s inline transform) — the SAME
 * choreography the original single-layout version used (badge→check
 * crossfade, dim→full opacity/color, "Available" pill fly-in where that
 * layout's own resolved design shows one, "Just unlocked" chip), just now
 * positioned per layout: last 2 rows (Stacked/Compact List), right column
 * (Split by Status), bottom 2 cards (Card Grid). Confetti is unchanged.
 *
 * `OnboardingV2` keys this `<PlusWelcomeState key={resultLayout} .../>` —
 * same convention as `TunedResult` — so switching the shared "Layout"
 * selector while stage 3's result is showing remounts it from scratch:
 * the confetti burst and the 2 Plus items' locked→unlocked transition
 * always replay from the beginning in the newly selected arrangement,
 * rather than the layout swapping under an already-settled/unlocked
 * state. */
export default function PlusWelcomeState({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  layout,
  tone = "straightforward",
  onEnterApp,
}: PlusWelcomeStateProps) {
  const reduced = useReducedMotion();
  const single = JTBD_TUNING_RESULT[jtbdKey];

  // Multiple mode only changes anything once 2+ JTBDs are actually
  // selected — with exactly 1, this screen behaves identically to Single
  // mode (same convention `TunedResult`/`VPNPlusUpsell` use).
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;

  // Multiple mode: mirror the RESULT screen exactly — the SAME merge →
  // rank → cap engine, the SAME capped free rows + profiles-summary row +
  // capped Plus feature row(s) `TunedResult` built for this selection —
  // just with the paid items now unlocked/active instead of locked. Single
  // mode's `result`/`welcome` below are completely untouched.
  const mergedEnabledFull = isMultipleActive ? mergeFreeSettings(selectedJtbds!) : null;
  const mergedPaidFull = isMultipleActive ? mergePaidFeatures(selectedJtbds!) : null;
  const profiles = isMultipleActive ? buildProfilePreviews(selectedJtbds!) : null;
  const freeCapped = isMultipleActive ? capList(rankFreeSettings(mergedEnabledFull!), T.freeRowCap) : null;
  const paidCapped = isMultipleActive ? capList(rankPaidFeatures(mergedPaidFull!), T.paidFeatureCap) : null;

  const result: TuningResultLike = isMultipleActive
    ? { jtbdKey: single.jtbdKey, jtbdLabel: single.jtbdLabel, enabled: freeCapped!.displayed, paid: [], tip: null }
    : single;

  const welcomeSubheading =
    layout === "profiles-showcase"
      ? isMultipleActive
        ? plusWelcomeProfilesSubheadingMultiple(selectedJtbds!.length)
        : plusWelcomeProfilesSubheading(profilesForSelection([jtbdKey])[0]!.name)
      : isMultipleActive
        ? plusWelcomeSubtitleMultiple(selectedJtbds!.length)
        : JTBD_PLUS_WELCOME[jtbdKey].subheading;

  const streamingSelected =
    jtbdKey === "streaming" ||
    (selectionMode === "multiple" && (selectedJtbds?.includes("streaming") ?? false));

  // Multiple mode: capped free rows + 1 profiles-summary row + capped Plus
  // feature row(s) — same row-count formula `TunedResult` uses for this
  // selection, so the welcome shows the exact same rows the result screen
  // did (now unlocked).
  const totalRows = isMultipleActive
    ? freeCapped!.displayed.length + 1 + paidCapped!.displayed.length
    : result.enabled.length + result.paid.length;

  const [unlocked, setUnlocked] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showChip, setShowChip] = useState(true);

  useEffect(() => {
    const tSettle = setTimeout(() => setUnlocked(true), T.unlockSettleDelay);
    const tConfetti = setTimeout(() => setShowConfetti(true), T.unlockConfettiDelay);
    const tChip = setTimeout(() => setShowChip(false), T.unlockSettleDelay + T.unlockChipFadeMs);
    return () => {
      clearTimeout(tSettle);
      clearTimeout(tConfetti);
      clearTimeout(tChip);
    };
  }, []);

  // All items are already resolved from the moment stage 3 mounts — no
  // materialization/spinner phase here, matching the original's instant
  // reveal (only the paid item(s) then animate on top of that).
  const rowStages = Array.from({ length: totalRows }, () => "resolved" as const);
  const rowMounted = Array.from({ length: totalRows }, () => true);
  const unlockTransition = { unlocked, showChip };
  const plusHeaderText = plusSectionHeader(result.jtbdLabel, isMultipleActive ? selectedJtbds!.length : 1);

  const layoutProps = {
    result,
    profiles,
    paidFeatures: paidCapped?.displayed,
    paidUnlocked: true,
    rowStages,
    rowMounted,
    boundaryVisible: true,
    reduced,
    tone,
    plusSectionHeader: plusHeaderText,
    unlockTransition,
  };

  return (
    <div className="absolute inset-0 @container">
      {/* Confetti layer — above content, pointer-events none, fires once.
          Unchanged behavior, overlays regardless of layout. */}
      {showConfetti && (
        <Confetti
          count={60}
          durationMs={3500}
          emoji={streamingSelected ? "🍿" : undefined}
        />
      )}

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial="hidden"
          animate="show"
          className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-[24px] overflow-y-auto px-[40px] py-[40px]"
        >
          {/* Welcome headline + JTBD subheading — stage-3 copy, unchanged. */}
          <div className="flex flex-col items-center gap-[6px]">
            <motion.h1
              variants={titleVariants}
              className="text-center font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              Welcome to VPN Plus
            </motion.h1>
            <motion.p
              variants={subheadingVariants}
              className="max-w-[520px] text-center font-['Segoe_UI_Variable',sans-serif] text-[15px] leading-[20px] text-[rgba(255,255,255,0.6)]"
            >
              {welcomeSubheading}
            </motion.p>
          </div>

          {/* Reused stage-2 layout renderer, fed the unlocking state — or the
              profiles showcase when that layout is selected. */}
          <div className="flex w-full flex-col items-center gap-[24px]">
            {layout === "profiles-showcase" ? (
              <ProfilesShowcaseWelcome
                jtbdKey={jtbdKey}
                selectionMode={selectionMode}
                selectedJtbds={selectedJtbds}
                reduced={reduced}
              />
            ) : (
              <>
                {layout === "stacked" && <StackedLayout {...layoutProps} />}
                {layout === "compact-list" && <CompactListLayout {...layoutProps} />}
                {layout === "split-by-status" && <SplitByStatusLayout {...layoutProps} />}
                {layout === "card-grid" && <CardGridLayout {...layoutProps} />}
              </>
            )}
          </div>

          <motion.button
            variants={buttonVariants}
            onClick={onEnterApp}
            className="flex w-[280px] shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97]"
            style={{ fontVariationSettings: "'opsz' 12" }}
          >
            Start using VPN Plus
          </motion.button>
        </motion.div>
      </Tooltip.Provider>
    </div>
  );
}
