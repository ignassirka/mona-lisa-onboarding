import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "motion/react";
import Spinner from "../components/Spinner";
import { useReducedMotion } from "../versions/lib/useReducedMotion";
import { JTBD_ICONS } from "../versions/lib/jtbdIcons";
import { JTBD_TUNING_RESULT, type JTBDKey } from "../lib/jtbdTuningResult";
import { useTunedMaterialization } from "./useTunedMaterialization";
import { TUNED_RESULT_TIMING as T, sec } from "./timing";
import { TUNED_RESULT_COPY, titleDuring, titleComplete, counterSubtext, summarySubtext, introSubtext } from "./copy";
import StackedLayout from "./layouts/StackedLayout";
import CompactListLayout from "./layouts/CompactListLayout";
import SplitByStatusLayout from "./layouts/SplitByStatusLayout";
import CardGridLayout from "./layouts/CardGridLayout";
import type { ResultLayout } from "../OnboardingV2";
import type { ToneOfVoice } from "../lib/toneOfVoice";

interface TunedResultProps {
  jtbdKey: JTBDKey;
  userPlan: "free" | "plus";
  layout: ResultLayout;
  /** Tone of voice for all of this stage's copy — the picker (`JtbdGridPanel`),
   * this header (intro/counter/completion), and every layout's per-JTBD
   * outcome/tip text. Defaults to `"straightforward"`, matching the stage's
   * pre-tone-system behavior. */
  tone?: ToneOfVoice;
  onContinue: () => void;
  onBack: () => void;
}

/** The single, consolidated "Personalized JTBD tuning" result step — replaces
 * the former separate "Default" / "Split by Status" / "Card Grid" / "Visual
 * Tuning" versions. There is no separate "Tuning the app for you…" loader:
 * this screen opens with its own centered intro and IS the perceived-
 * progress surface for every layout:
 *
 * 1. **Centered intro** — the header block (loader `Spinner` + "Tuning for
 *    {jtbd}…" + a static "optimizing" subtext) fades in centered on screen
 *    and holds there for `centerHold`.
 * 2. **Move to top** — the SAME block (never unmounted) travels to its top
 *    position via Framer's `layout` FLIP; the spinner crossfades into the
 *    JTBD's category icon (reused from the picker via `JTBD_ICONS`, same
 *    slot, same size) and the subtext crossfades to the live "Applying X of
 *    N settings" counter.
 * 3. **Items materialize** — only once the block has landed do the 5 items
 *    begin their two-phase materialization, one at a time
 *    (`useTunedMaterialization` drives the shared timing/state; only the
 *    RENDERING — which of the 4 `layouts/*` components — differs per
 *    `layout`).
 * 4. **Completion** — once the last item resolves, the title crossfades to
 *    "Tuned for {jtbd}" and the subtext to the derived summary, then the tip
 *    (if present) and Continue fade in (Continue only interactive now).
 *
 * Switching `layout` remounts this component (`OnboardingV2` keys it by
 * `layout`), replaying the whole sequence from the centered intro in the
 * newly selected arrangement — confirmed as the desired prototype behavior
 * (so reviewers can see the full intro + materialization in any layout they
 * pick, not just its static end state). */
export default function TunedResult({ jtbdKey, userPlan, layout, tone = "straightforward", onContinue, onBack }: TunedResultProps) {
  const reduced = useReducedMotion();
  const result = JTBD_TUNING_RESULT[jtbdKey];
  const paidUnlocked = userPlan === "plus";
  const totalRows = result.enabled.length + result.paid.length;

  const { introDone, rowStages, rowMounted, boundaryVisible, appliedSoFar, rowsComplete, continueDelayMs } = useTunedMaterialization({
    jtbdKey,
    totalRows,
    boundaryIndex: result.enabled.length,
    reduced,
  });

  const appliedCount = paidUnlocked ? totalRows : result.enabled.length;
  const lockedCount = paidUnlocked ? 0 : result.paid.length;

  return (
    // Transparent overlay — same protected teal-top gradient background as
    // every prior tuned-result design (the persistent map behind provides it).
    <div className="absolute inset-0 @container">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={onBack}
        aria-label="Back to job selection"
        className="absolute left-[20px] top-[52px] z-20 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
        style={{ fontVariationSettings: "'opsz' 11" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </motion.button>

      {/* Radix Tooltip provider — needed by `EnabledFeatureRow`/
          `PaidFeatureRow`'s (i) info icons, reused unchanged by the Compact
          List / Split by Status / Card Grid layouts. */}
      <Tooltip.Provider delayDuration={200}>
        {/* Centered while the intro holds (normal motion only — reduced
            motion skips the travel animation entirely and renders at the
            top from the start), top-anchored otherwise. This div never
            itself moves; toggling its `justify-content` is what gives the
            header block below something to react to. */}
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center gap-[30px] overflow-y-auto px-[40px] pb-[40px] ${
            !reduced && !introDone ? "justify-center" : "justify-start pt-[64px]"
          }`}
        >
          {/* The header block — ONE persistent element for the whole screen
              (Phase 1 through Phase 4), never unmounted, shared identically
              by all 4 layouts. `layout` (the Framer prop) makes it animate
              the FLIP resulting from the justify-content toggle above as a
              smooth center→top move rather than a snap; disabled in reduced
              motion, where the block simply renders at the top the whole
              time (no position animation at all). */}
          <motion.div
            layout={!reduced}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ opacity: { duration: sec(T.introFadeIn) }, layout: { duration: sec(T.moveToTop), ease: "easeInOut" } }}
            className="flex flex-col items-center gap-[12px]"
          >
            {/* Icon slot — fixed size, so the loader spinner crossfading
                into the JTBD category icon never causes a size jump; only
                the glyph inside changes. */}
            <div className="relative flex h-[48px] w-[48px] shrink-0 items-center justify-center">
              {/* A true overlapping crossfade — the spinner fading out
                  WHILE the category icon fades in — so no `mode="wait"`
                  here (unlike the title/subtext text swaps below, which
                  use it deliberately to avoid two different strings
                  visually overlapping). */}
              <AnimatePresence initial={false}>
                {!introDone ? (
                  <motion.div
                    key="spinner"
                    className="absolute"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: sec(reduced ? 200 : T.iconCrossfade) }}
                  >
                    <Spinner size={40} />
                  </motion.div>
                ) : (
                  <motion.img
                    key="category-icon"
                    src={JTBD_ICONS[jtbdKey]}
                    alt=""
                    className="absolute h-[32px] w-[48px] object-contain"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: sec(reduced ? 200 : T.iconCrossfade) }}
                  />
                )}
              </AnimatePresence>
            </div>

            <h1
              className="text-center font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {/* Only two states total — the title is identical through
                  Phases 1 and 3 ("during"), and only crossfades once at
                  completion; structure ("{verb} for {jtbd}{suffix}") stays
                  identical so the swap reads as a simple word change. */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={rowsComplete ? "complete" : "during"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: sec(T.titleCompleteCrossfade) }}
                >
                  {rowsComplete ? titleComplete(tone, result.jtbdLabel) : titleDuring(tone, result.jtbdLabel)}
                </motion.span>
              </AnimatePresence>
            </h1>

            <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={!introDone ? "intro" : rowsComplete ? "summary" : "counter"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: sec(T.subtextCrossfade) }}
                >
                  {!introDone
                    ? introSubtext(tone)
                    : rowsComplete
                      ? summarySubtext(tone, appliedCount, lockedCount)
                      : counterSubtext(appliedSoFar, totalRows)}
                </motion.span>
              </AnimatePresence>
            </p>
          </motion.div>

          {/* Wrapped so it can be pulled out of the flex flow (`absolute` +
              `invisible`) while the header is centered — otherwise this
              block's own reserved height (mainly the always-mounted
              Continue button) would skew `justify-center` off the header
              alone. Once the header switches to `justify-start`
              (top-anchored), this no longer matters, so it can safely
              rejoin the normal flow the moment `introDone` flips. */}
          <div className={`flex w-full flex-col items-center gap-[24px] ${!reduced && !introDone ? "invisible absolute inset-x-0" : "relative"}`}>
            {layout === "stacked" && (
              <StackedLayout result={result} paidUnlocked={paidUnlocked} rowStages={rowStages} rowMounted={rowMounted} boundaryVisible={boundaryVisible} reduced={reduced} tone={tone} />
            )}
            {layout === "compact-list" && (
              <CompactListLayout result={result} paidUnlocked={paidUnlocked} rowStages={rowStages} rowMounted={rowMounted} boundaryVisible={boundaryVisible} reduced={reduced} tone={tone} />
            )}
            {layout === "split-by-status" && (
              <SplitByStatusLayout result={result} paidUnlocked={paidUnlocked} rowStages={rowStages} rowMounted={rowMounted} boundaryVisible={boundaryVisible} reduced={reduced} tone={tone} />
            )}
            {layout === "card-grid" && <CardGridLayout result={result} paidUnlocked={paidUnlocked} rowStages={rowStages} rowMounted={rowMounted} reduced={reduced} tone={tone} />}

            <motion.button
              initial={{ opacity: 0, y: reduced ? 0 : 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: sec(T.continueIn), delay: sec(continueDelayMs) }}
              onClick={onContinue}
              className="flex w-[240px] shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97]"
              style={{ fontVariationSettings: "'opsz' 12" }}
            >
              {TUNED_RESULT_COPY.continue}
            </motion.button>
          </div>
        </div>
      </Tooltip.Provider>
    </div>
  );
}
