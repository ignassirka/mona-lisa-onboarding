import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "motion/react";
import Spinner from "../components/Spinner";
import { useReducedMotion } from "../versions/lib/useReducedMotion";
import { JTBD_ICONS } from "../versions/lib/jtbdIcons";
import { JTBD_TUNING_RESULT, type JTBDKey } from "../lib/jtbdTuningResult";
import { mergeFreeSettings, mergePaidFeatures, rankFreeSettings, rankPaidFeatures, capList, buildProfilePreviews, type TuningResultLike } from "../lib/jtbdMerge";
import { useTunedMaterialization } from "./useTunedMaterialization";
import { TUNED_RESULT_TIMING as T, sec } from "./timing";
import {
  TUNED_RESULT_COPY,
  titleDuring,
  titleComplete,
  counterSubtext,
  summarySubtext,
  introSubtext,
  titleDuringMultiple,
  titleCompleteMultiple,
  summarySubtextMultiple,
  summarySubtextMultiplePlus,
  plusSectionHeader,
  FREE_MINIMAL_CLAIMS_COUNTER,
} from "./copy";
import { buildFreeMinimalContent } from "./freeMinimalContent";
import FreeMinimalList from "./FreeMinimalList";
import StackedLayout from "./layouts/StackedLayout";
import CompactListLayout from "./layouts/CompactListLayout";
import SplitByStatusLayout from "./layouts/SplitByStatusLayout";
import CardGridLayout from "./layouts/CardGridLayout";
import type { ResultLayout } from "../OnboardingV2";
import type { ToneOfVoice } from "../lib/toneOfVoice";
import type { SelectionMode } from "../lib/jtbdData";

interface TunedResultProps {
  /** Single mode: the one picked JTBD. Multiple mode: the FIRST-selected
   * JTBD (still used as the icon/title fallback when exactly 1 JTBD is
   * selected in Multiple mode — see `selectionMode` doc below). */
  jtbdKey: JTBDKey;
  userPlan: "free" | "plus";
  layout: ResultLayout;
  /** "Selection" prototype control — defaults to `"single"`, which is this
   * component's ENTIRE pre-existing behavior, byte-for-byte. `"multiple"`
   * only changes anything once `selectedJtbds.length >= 2` — with exactly 1
   * selection it behaves identically to single mode (per the confirmed
   * design: "1 selected → exactly as today" for every phase of this
   * screen), using `jtbdKey` (`selectedJtbds[0]`) exactly as single mode
   * would. */
  selectionMode?: SelectionMode;
  /** Required (and used) only when `selectionMode === "multiple"` — the
   * full ordered selection, first-selected first. */
  selectedJtbds?: JTBDKey[];
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
 * 2. **Intro crossfade** — the SAME block (never unmounted) stays vertically
 *    centered; the spinner crossfades into the JTBD's category icon (reused
 *    from the picker via `JTBD_ICONS`, same slot, same size per icon) — or,
 *    in Multiple mode with 2+ selections, into a horizontal row of those
 *    same picker icons in selection order, with a subtle left-to-right
 *    stagger — and the subtext crossfades to the live "Applying X of
 *    N settings" counter.
 * 3. **Items materialize** — only once the intro beat finishes do the items
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
 * pick, not just its static end state).
 *
 * One arrangement/plan combination has its own body: `stacked` + `free` (the
 * "Minimal list" concept as a Free user actually meets it, which is the only
 * way stage 2 renders it today). There, steps 3 and 4 above run over
 * `FreeMinimalList` instead — two real settings and a short set of value
 * claims, with no "Available with VPN Plus" section at all. See
 * `freeMinimalContent.ts`. */
export default function TunedResult({
  jtbdKey,
  userPlan,
  layout,
  selectionMode = "single",
  selectedJtbds,
  tone = "straightforward",
  onContinue,
  onBack,
}: TunedResultProps) {
  const reduced = useReducedMotion();
  const paidUnlocked = userPlan === "plus";
  const single = JTBD_TUNING_RESULT[jtbdKey];

  // Multiple mode only changes anything once 2+ JTBDs are actually selected
  // — with exactly 1, every phase of this screen behaves identically to
  // single mode (confirmed design: "1 selected → exactly as today").
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;

  // The Free path of the "Minimal list" arrangement has its own body: two
  // real settings (Protocol, Auto Connect) plus value claims, and NO Plus
  // section at all. Everything below still runs — the Plus path, and the
  // other three arrangements the Plus Welcome step reuses, are unchanged —
  // it's simply not what gets rendered when this is non-null. See
  // `freeMinimalContent.ts` and docs/features/onboarding-v2.md.
  const freeMinimal =
    layout === "stacked" && userPlan === "free"
      ? buildFreeMinimalContent(isMultipleActive ? selectedJtbds! : [jtbdKey], tone)
      : null;

  // The FULL merged/deduped unions — never truncated. These feed the
  // completion counts (true totals) AND the ranked/capped lists below (the
  // capping step operates on these, never on a pre-truncated list). See
  // docs/features/onboarding-v2.md → "Multiple-mode result curation".
  const mergedEnabledFull = isMultipleActive ? mergeFreeSettings(selectedJtbds!) : null;
  const mergedPaidFull = isMultipleActive ? mergePaidFeatures(selectedJtbds!) : null;
  const profiles = isMultipleActive ? buildProfilePreviews(selectedJtbds!) : null;

  // Ranked-then-capped DISPLAY lists — screen height stays stable from 1 to
  // 6 selected interests regardless of how large the full unions above get.
  // Only what's rendered is curated; `mergedEnabledFull`/`mergedPaidFull`
  // above (never these) feed the completion counts.
  const freeCapped = isMultipleActive ? capList(rankFreeSettings(mergedEnabledFull!), T.freeRowCap) : null;
  const paidCapped = isMultipleActive ? capList(rankPaidFeatures(mergedPaidFull!), T.paidFeatureCap) : null;

  // `result` feeds the 4 layouts' `enabled`/`paid` rendering — `enabled` is
  // the CAPPED free list (so the existing per-row rendering, which iterates
  // `result.enabled`, automatically only renders the capped rows with zero
  // changes to that logic). Multiple mode's `paid: []` makes the existing
  // paid-row rendering no-op; the new capped Plus-features list is a
  // separate `paidFeatures` prop (see below), alongside `profiles`.
  const result: TuningResultLike = isMultipleActive
    ? { jtbdKey: single.jtbdKey, jtbdLabel: single.jtbdLabel, enabled: freeCapped!.displayed, paid: [], tip: null }
    : single;

  // Multiple mode: capped free rows, +1 row for the Plus section's one-line
  // profiles summary, + capped Plus feature rows. Neither section shows a
  // "+X/+Y more" overflow footnote (confirmed at checkpoint) — anything
  // beyond the caps is simply not listed.
  const totalRows = freeMinimal
    ? freeMinimal.settings.length + freeMinimal.claims.length
    : isMultipleActive
      ? freeCapped!.displayed.length + 1 + paidCapped!.displayed.length
      : result.enabled.length + result.paid.length;
  // Plus plan: every row materializes as applied — there is no free/paid
  // tier boundary to pause for or reveal a divider at, so `boundaryIndex` is
  // pushed outside the valid range (`useTunedMaterialization`'s `hasBoundary`
  // check), skipping both the pacing pause and the divider entirely. The
  // `freeMinimal` path does the same, for the same reason from the other
  // direction: every one of its rows is something the user already has, so
  // there's no tier to divide. Free plan on the other layouts: unchanged.
  const boundaryIndex =
    paidUnlocked || freeMinimal
      ? totalRows
      : isMultipleActive
        ? freeCapped!.displayed.length
        : result.enabled.length;
  // Plus + Multiple mode only — the true combined total beyond the display
  // caps, split by type so the "+X more settings tuned for you" line can
  // reuse the existing per-type caps' own overflow counts (confirmed at
  // checkpoint) rather than a new combined cap constant.
  const plusOverflowCount = paidUnlocked && isMultipleActive ? freeCapped!.overflow + paidCapped!.overflow : 0;

  const { introDone, rowStages, rowMounted, boundaryVisible, appliedSoFar, rowsComplete, continueDelayMs } = useTunedMaterialization({
    jtbdKey: isMultipleActive ? selectedJtbds!.join(",") : jtbdKey,
    totalRows,
    boundaryIndex,
    reduced,
  });

  // Completion counts. Single mode (unchanged): the true, uncapped totals.
  // Multiple mode: counts against the DISPLAYED/capped rows instead — the
  // subtext must match what's actually on screen (confirmed at checkpoint,
  // superseding the earlier "always true totals" rule) — so this is always
  // `freeRowCap` (4) once 2+ interests are selected, never the size of the
  // full merged union.
  const appliedCount = paidUnlocked ? totalRows : (isMultipleActive ? freeCapped!.displayed.length : result.enabled.length);
  // Single mode: locked paid-feature count. Multiple mode: the true total
  // profile-preview count (always shown, even for Plus users — the previews
  // just render "Included with your plan" instead of the Plus upsell
  // caption; see `ProfilePreviewItem`). Both are named generically since the
  // summary sentence's own wording (`summarySubtext` vs
  // `summarySubtextMultiple`) is what actually differs, not this count.
  const lockedOrPreviewCount = isMultipleActive ? profiles!.length : paidUnlocked ? 0 : result.paid.length;
  // Multiple mode only — the "{features} features with VPN Plus" count feeds
  // `summarySubtextMultiple`. Counts EVERY row actually shown in the Plus
  // section — the capped feature row(s) (`paidFeatureCap`, 1) PLUS the
  // profiles row itself (always exactly 1 row, however many interests it
  // lists) — so with the current 1-feature cap this is always 2, matching
  // what's on screen (1 feature row + 1 profiles row).
  const truePaidFeatureCount = isMultipleActive ? paidCapped!.displayed.length + 1 : 0;
  // Plus + Multiple mode only — the completion subtext's applied count must
  // be the TRUE merged total (never the capped/displayed row count), same
  // rule as single mode's own uncapped `appliedCount` above, so the "+X more
  // settings tuned for you" line (`plusOverflowCount`) and this number stay
  // mutually consistent — displayed + overflow always sums back to this.
  // Profiles aren't tallied here either, same precedent as the Free path's
  // own `summarySubtextMultiple` (its own doc comment above).
  const truePlusAppliedTotal = isMultipleActive ? mergedEnabledFull!.length + mergedPaidFull!.length : 0;
  const selectionCount = selectedJtbds?.length ?? 1;
  const plusHeaderText = plusSectionHeader(result.jtbdLabel, isMultipleActive ? selectionCount : 1);

  // Header subtext, Phase 3 (materializing). On the `freeMinimal` path the
  // counter can only speak for the settings rows, so once those are done it
  // hands over to a line about the claims still arriving rather than counting
  // them as settings. `claimsPhase` also feeds the crossfade key — without it
  // the handover would be an instant text swap mid-sentence.
  const claimsPhase = !!freeMinimal && appliedSoFar > freeMinimal.settings.length;
  const counterText = claimsPhase
    ? FREE_MINIMAL_CLAIMS_COUNTER
    : counterSubtext(appliedSoFar, freeMinimal ? freeMinimal.settings.length : totalRows);

  // Header subtext, Phase 4 (complete). `freeMinimal` reports only the
  // settings it actually applied, and has no locked clause to add — the value
  // claims aren't settings and were never counted as any.
  const summaryText = freeMinimal
    ? summarySubtext(tone, freeMinimal.settings.length, 0)
    : isMultipleActive
      ? paidUnlocked
        ? summarySubtextMultiplePlus(tone, truePlusAppliedTotal)
        : summarySubtextMultiple(tone, appliedCount, truePaidFeatureCount)
      : summarySubtext(tone, appliedCount, lockedOrPreviewCount);

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
        className="absolute left-[20px] top-[52px] z-20 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
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
        {/* Vertically centered for the whole screen — an outer scroll
            container plus an inner `min-h-full justify-center` column so
            equal top/bottom margins hold when content fits, and taller
            layouts can still scroll. During the intro beat the body block
            below is pulled out of flow (`absolute` + `invisible`) so the
            header alone centers; once `introDone` it rejoins the column and
            the whole group (header + list + Continue) centers together. */}
        <div className="absolute inset-0 z-10 overflow-y-auto px-[40px]">
          <div className="flex min-h-full flex-col items-center justify-center gap-[30px] py-[40px]">
          {/* The header block — ONE persistent element for the whole screen
              (Phase 1 through Phase 4), never unmounted, shared identically
              by all 4 layouts. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ opacity: { duration: sec(T.introFadeIn) } }}
            className="flex flex-col items-center gap-[12px]"
          >
            {/* Icon slot — fixed height; Single mode (and Multiple with 1
                pick) keeps a fixed 48×48 slot. Multiple mode with 2+
                selections grows horizontally into a centered icon row
                (same 32×48 per icon as Single mode) without shrinking or
                wrapping. */}
            <div
              className={`relative flex h-[48px] shrink-0 items-center justify-center ${
                isMultipleActive ? "min-w-[48px]" : "w-[48px]"
              }`}
            >
              {/* A true overlapping crossfade — the spinner fading out
                  WHILE the category icon(s) fade in — so no `mode="wait"`
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
                ) : isMultipleActive ? (
                  <motion.div
                    key="category-icons-row"
                    className="absolute flex items-center justify-center gap-[8px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: sec(reduced ? 200 : T.iconCrossfade) }}
                  >
                    {selectedJtbds!.map((id, i) => (
                      <motion.img
                        key={id}
                        src={JTBD_ICONS[id]}
                        alt=""
                        className="h-[32px] w-[48px] object-contain"
                        initial={{ opacity: reduced ? 1 : 0 }}
                        animate={{ opacity: 1 }}
                        transition={{
                          duration: reduced ? 0 : sec(300),
                          delay: reduced ? 0 : sec(i * T.iconRowStagger),
                        }}
                      />
                    ))}
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
                  {isMultipleActive
                    ? rowsComplete
                      ? titleCompleteMultiple(tone, selectionCount)
                      : titleDuringMultiple(tone, selectionCount)
                    : rowsComplete
                      ? titleComplete(tone, result.jtbdLabel)
                      : titleDuring(tone, result.jtbdLabel)}
                </motion.span>
              </AnimatePresence>
            </h1>

            <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={!introDone ? "intro" : rowsComplete ? "summary" : claimsPhase ? "claims" : "counter"}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: sec(T.subtextCrossfade) }}
                >
                  {!introDone ? introSubtext(tone) : rowsComplete ? summaryText : counterText}
                </motion.span>
              </AnimatePresence>
            </p>
          </motion.div>

          {/* Wrapped so it can be pulled out of the flex flow (`absolute` +
              `invisible`) while the header is centered alone during the intro
              beat — otherwise this block's reserved height (mainly the
              always-mounted Continue button) would skew vertical centering.
              Once `introDone` flips it rejoins the normal flow and the whole
              group centers together. */}
          <div className={`flex w-full flex-col items-center gap-[24px] ${!introDone ? "invisible absolute inset-x-0" : "relative"}`}>
            {freeMinimal && (
              <FreeMinimalList
                settings={freeMinimal.settings}
                claims={freeMinimal.claims}
                rowStages={rowStages}
                rowMounted={rowMounted}
                reduced={reduced}
              />
            )}
            {!freeMinimal && layout === "stacked" && (
              <StackedLayout
                result={result}
                profiles={profiles}
                paidFeatures={paidCapped?.displayed}
                paidUnlocked={paidUnlocked}
                rowStages={rowStages}
                rowMounted={rowMounted}
                boundaryVisible={boundaryVisible}
                reduced={reduced}
                tone={tone}
                plusSectionHeader={plusHeaderText}
                moreCount={plusOverflowCount}
              />
            )}
            {layout === "compact-list" && (
              <CompactListLayout
                result={result}
                profiles={profiles}
                paidFeatures={paidCapped?.displayed}
                paidUnlocked={paidUnlocked}
                rowStages={rowStages}
                rowMounted={rowMounted}
                boundaryVisible={boundaryVisible}
                reduced={reduced}
                tone={tone}
                plusSectionHeader={plusHeaderText}
              />
            )}
            {layout === "split-by-status" && (
              <SplitByStatusLayout
                result={result}
                profiles={profiles}
                paidFeatures={paidCapped?.displayed}
                paidUnlocked={paidUnlocked}
                rowStages={rowStages}
                rowMounted={rowMounted}
                boundaryVisible={boundaryVisible}
                reduced={reduced}
                tone={tone}
              />
            )}
            {layout === "card-grid" && (
              <CardGridLayout
                result={result}
                profiles={profiles}
                paidFeatures={paidCapped?.displayed}
                paidUnlocked={paidUnlocked}
                rowStages={rowStages}
                rowMounted={rowMounted}
                reduced={reduced}
                tone={tone}
              />
            )}

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
        </div>
      </Tooltip.Provider>
    </div>
  );
}
