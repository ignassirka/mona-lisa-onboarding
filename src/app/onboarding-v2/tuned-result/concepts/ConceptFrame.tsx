import type { ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import Spinner from "../../components/Spinner";
import { JTBD_ICONS } from "../../versions/lib/jtbdIcons";
import { trackTuningEvent } from "../../lib/analytics";
import { useTrackTuningView } from "./useTrackTuningView";
import type { ConceptFrameData } from "./types";
import type { JTBDKey } from "../../lib/jtbdTuningResult";
import type { SelectionMode } from "../../lib/jtbdData";

interface ConceptFrameProps {
  /** Analytics id — one of `TUNING_CONCEPTS`' `value`s. */
  concept: string;
  jtbdKey: JTBDKey;
  selectionMode: SelectionMode;
  selectedJtbds?: JTBDKey[];
  /** Narrowed to just the fields this frame reads, so both
   * `useTuningConceptData` and `useProfilesConceptData` satisfy it. */
  data: ConceptFrameData;
  reduced: boolean;
  onBack: () => void;
  onContinue: () => void;
  /** Replaces the derived subtext (intro / counter / summary) while
   * non-null. Exists for the Rehearsal concept, whose stage makes the
   * "N of M settings" counter stale mid-interaction. `undefined` (the
   * default, and what every other concept passes) keeps the original
   * behaviour exactly. */
  subtextSlot?: ReactNode;
  /** Replaces the JTBD category icon (single, or the Multiple-mode row) that
   * the intro spinner normally resolves into.
   *
   * Exists for the Profiles-carousel concept, whose title states a finished
   * OUTCOME ("3 profiles built around what you do online") rather than
   * naming what was tuned — restating the intents above it would label a
   * result with its input. Unlike the JTBD icon (which every other concept
   * shows the moment the intro finishes, even though rows are still
   * resolving), this glyph is gated on `rowsComplete`: the spinner keeps
   * spinning through the ENTIRE materialization, and only springs into this
   * glyph once everything has actually finished — a checkmark appearing
   * while cards are still loading would claim a completeness that isn't
   * there yet. `undefined` (the default, and what every other concept
   * passes) keeps the original icon behaviour exactly. */
  resolvedGlyph?: ReactNode;
  /** The concept's own distinctive body (its take on the "applying" +
   * resolved materialization) — everything else (Back, header, Continue,
   * centered→top travel) is shared chrome owned by this component. */
  children: ReactNode;
  /** Body column max-width — each concept can widen/narrow its own body
   * (e.g. the dashboard concept wants a wider grid than the receipt
   * concept's narrow card). Defaults to the same 704px every existing
   * layout uses. */
  bodyMaxWidthClassName?: string;
}

const ICON_ROW_GAP = 8;

/** Shared scaffolding for all 5 alternative tuning concepts — the SAME
 * Back button, centered→top-anchored header block (icon crossfade + title/
 * subtitle crossfades, reusing the shared materialization state from
 * `useTuningConceptData`), and Continue button `TunedResult.tsx` already
 * uses, extracted so each concept only has to implement its own body.
 * Concepts revamp the MATERIALIZATION BODY and RESOLVED ARRANGEMENT (their
 * whole reason for existing); the header mechanic and row-schedule pacing
 * are explicitly REUSED per the task's own guidance ("adapt per concept
 * rather than rebuilding primitives"), so switching between the default
 * and any of the 5 concepts never feels like a pacing regression. */
export default function ConceptFrame({
  concept,
  jtbdKey,
  selectionMode,
  selectedJtbds,
  data,
  reduced,
  onBack,
  onContinue,
  subtextSlot,
  resolvedGlyph,
  children,
  bodyMaxWidthClassName = "max-w-[704px]",
}: ConceptFrameProps) {
  const { introDone, rowsComplete, appliedSoFar, totalRows, isMultipleActive, continueDelayMs, selectionCount } = data;

  useTrackTuningView(concept, jtbdKey, selectionMode, selectionCount);

  const handleBack = () => {
    trackTuningEvent("tuning_back", { concept, jtbdKey, selectionMode, selectionCount });
    onBack();
  };

  const handleContinue = () => {
    trackTuningEvent("tuning_continue", { concept, jtbdKey, selectionMode, selectionCount });
    onContinue();
  };

  return (
    <div className="absolute inset-0 @container">
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={handleBack}
        aria-label="Back to job selection"
        className="absolute left-[20px] top-[52px] z-20 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
        style={{ fontVariationSettings: "'opsz' 11" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </motion.button>

      <div
        className={`absolute inset-0 z-10 flex flex-col items-center gap-[30px] overflow-y-auto px-[40px] pb-[40px] ${
          !reduced && !introDone ? "justify-center" : "justify-start pt-[64px]"
        }`}
      >
        <motion.div
          layout={!reduced}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ opacity: { duration: 0.3 }, layout: { duration: 0.6, ease: "easeInOut" } }}
          className="flex flex-col items-center gap-[12px]"
        >
          <div
            className={`relative flex h-[48px] shrink-0 items-center justify-center ${isMultipleActive ? "min-w-[48px]" : "w-[48px]"}`}
          >
            <AnimatePresence initial={false}>
              {/* `resolvedGlyph` callers wait for `rowsComplete`, not just
                  `introDone` — see the prop doc above. Every other caller
                  passes no `resolvedGlyph`, so `!introDone` alone still
                  decides this for them, unchanged. */}
              {!introDone || (resolvedGlyph && !rowsComplete) ? (
                <motion.div
                  key="spinner"
                  className="absolute"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.2 : 0.6 }}
                >
                  <Spinner size={40} />
                </motion.div>
              ) : resolvedGlyph ? (
                <motion.div
                  key="resolved-glyph"
                  className="absolute flex items-center justify-center"
                  initial={{ opacity: 0, scale: reduced ? 1 : 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reduced ? { duration: 0.2 } : { opacity: { duration: 0.4 }, scale: { type: "spring", stiffness: 420, damping: 20 } }}
                >
                  {resolvedGlyph}
                </motion.div>
              ) : isMultipleActive ? (
                <motion.div
                  key="category-icons-row"
                  className="absolute flex items-center justify-center"
                  style={{ gap: ICON_ROW_GAP }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.2 : 0.6 }}
                >
                  {selectedJtbds!.map((id, i) => (
                    <motion.img
                      key={id}
                      src={JTBD_ICONS[id]}
                      alt=""
                      className="h-[32px] w-[48px] object-contain"
                      initial={{ opacity: reduced ? 1 : 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : i * 0.07 }}
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
                  transition={{ duration: reduced ? 0.2 : 0.6 }}
                />
              )}
            </AnimatePresence>
          </div>

          <h1
            className="text-center font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
            style={{ fontVariationSettings: "'opsz' 24" }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={rowsComplete ? "complete" : "during"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {rowsComplete ? data.titleCompleteText : data.titleDuringText}
              </motion.span>
            </AnimatePresence>
          </h1>

          <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={subtextSlot != null ? "slot" : !introDone ? "intro" : rowsComplete ? "summary" : "counter"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                {subtextSlot != null
                  ? subtextSlot
                  : !introDone
                    ? data.introText
                    : rowsComplete
                      ? data.summaryText
                      : data.counterText(appliedSoFar, totalRows)}
              </motion.span>
            </AnimatePresence>
          </p>
        </motion.div>

        <div className={`flex w-full flex-col items-center gap-[24px] ${!reduced && !introDone ? "invisible absolute inset-x-0" : "relative"}`}>
          <div className={`flex w-full flex-col items-center gap-[16px] ${bodyMaxWidthClassName}`}>{children}</div>

          <motion.button
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: continueDelayMs / 1000 }}
            onClick={handleContinue}
            className="flex w-[240px] shrink-0 items-center justify-center whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97]"
            style={{ fontVariationSettings: "'opsz' 12" }}
          >
            Continue
          </motion.button>
        </div>
      </div>
    </div>
  );
}
