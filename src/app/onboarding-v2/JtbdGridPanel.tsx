import { motion, AnimatePresence } from "motion/react";
import JtbdGridTile from "./JtbdGridTile";
import {
  JTBD_OPTIONS,
  JTBD_WINK_COPY,
  JTBD_CONTINUE_LABEL,
  JTBD_CONTINUE_LABEL_DEFAULT,
  JTBD_GO_TO_APP_LABEL,
  type JtbdId,
  type SelectionMode,
} from "./lib/jtbdData";
import { TUNING_COPY, type ToneOfVoice } from "./lib/toneOfVoice";
import { useReducedMotion } from "./versions/lib/useReducedMotion";
import tipIllustrationUrl from "./assets/tip-illustration.svg";

interface JtbdGridPanelProps {
  /** Single mode only (default) — untouched. */
  selected: JtbdId | null;
  /** Accepts `null` so tiles can toggle deselection (clicking the already-
   * selected tile again clears the pick) — the parent's setter (a plain
   * `useState` dispatch) already accepts `JtbdId | null` today, so this is a
   * type-only widening, not a new prop or a behavior change on the parent. */
  onSelect: (id: JtbdId | null) => void;
  onContinue: () => void;
  onSkip: () => void;
  /** Tone of voice for the title/subtitle only — the 6 tile labels, the wink
   * line, and the Continue / Go to app directly labels stay constant across tones (confirmed
   * via checkpoint). Defaults to `"straightforward"`. */
  tone?: ToneOfVoice;
  /** "Selection" prototype control (`App.tsx`) — defaults to `"single"`,
   * which is this component's entire pre-existing behavior, byte-for-byte
   * (every branch below only activates for `"multiple"`). */
  selectionMode?: SelectionMode;
  /** Multiple mode only — the full ordered selection (first-selected
   * first). Ignored in single mode. */
  selectedMultiple?: JtbdId[];
  /** Multiple mode only — toggles one JTBD in/out of `selectedMultiple`. */
  onToggleMultiple?: (id: JtbdId) => void;
}

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

/** The JTBD picker for the "Personalized JTBD tuning" stage — a single
 * 3-column x 2-row grid of selectable tiles (icon + label), no right-hand
 * "why this matters" contextual panel (a 3x2 grid needs the full grid
 * width, which a two-column layout wouldn't leave room for). This is now
 * the stage's ONLY picker (the former "Default" version's separate
 * two-column radio-list picker was retired when the stage consolidated to
 * this single flow — see "Tuning-stage consolidation" in
 * docs/features/onboarding-v2.md). Picking a tile just toggles a `selected`
 * state; advancing is still an explicit Continue (disabled until a tile is
 * picked), since the result step still needs to run its own centered-intro
 * + materialization sequence rather than morphing in place.
 *
 * Clicking an already-selected tile again deselects it (back to `null`) —
 * the grid supports single-select-with-toggle-off, not a forced pick once
 * started.
 *
 * Between the grid and Continue sits a small contextual "wink" message
 * (`JTBD_WINK_COPY`, keyed per JTBD) next to the same idea-bubble
 * illustration used elsewhere in this app (`assets/tip-illustration.svg`) —
 * its space is always reserved (via `min-h`) so selecting/deselecting a
 * card never shifts Continue. Nothing is
 * shown until a card is picked; once shown, the illustration stays put and
 * only the text crossfades on subsequent picks; deselecting fades the whole
 * message out (`AnimatePresence` exit) back to the empty reserved space.
 *
 * The Continue button's label is likewise dynamic — "Continue" before a pick
 * (unchanged), "Tune for {jtbd}" once one is selected (`JTBD_CONTINUE_LABEL`,
 * full per-JTBD i18n strings, never built via prefix concatenation). Only
 * the label text changes; the button's click behavior, disabled state,
 * position, and styling are all untouched. A fixed `min-width` (sized to fit
 * the longest label, "Tune for downloading") keeps the button from resizing
 * jarringly as the label crossfades between picks.
 *
 * Tone of voice: the stage now supports the same 4-tone system as the
 * connection stage (`ToneOfVoice`, `lib/toneOfVoice.tsx`) — only the title
 * and subtitle vary here (`TUNING_COPY[tone]`); the 6 tile labels, the wink
 * line, and the Continue / Go to app directly labels are kept constant across tones
 * (confirmed via checkpoint — same precedent as `browsing.continue` staying
 * "Continue" in every tone at the connection stage). */
export default function JtbdGridPanel({
  selected,
  onSelect,
  onContinue,
  onSkip,
  tone = "straightforward",
  selectionMode = "single",
  selectedMultiple = [],
  onToggleMultiple,
}: JtbdGridPanelProps) {
  const reduced = useReducedMotion();
  const copy = TUNING_COPY[tone] ?? TUNING_COPY.straightforward;
  const isMultiple = selectionMode === "multiple";

  const pickerTitle = isMultiple ? copy.pickerTitleMultiple ?? TUNING_COPY.straightforward.pickerTitleMultiple! : copy.pickerTitle;
  const pickerSubtitle = isMultiple ? copy.pickerSubtitleMultiple ?? TUNING_COPY.straightforward.pickerSubtitleMultiple! : copy.pickerSubtitle;

  // Last-selected wins for the witty line; fades out once empty.
  const wittyJtbd = isMultiple ? (selectedMultiple.length > 0 ? selectedMultiple[selectedMultiple.length - 1] : null) : selected;

  const hasAnySelection = isMultiple ? selectedMultiple.length > 0 : !!selected;

  const ctaLabel = isMultiple
    ? selectedMultiple.length === 0
      ? JTBD_CONTINUE_LABEL_DEFAULT
      : selectedMultiple.length === 1
        ? JTBD_CONTINUE_LABEL[selectedMultiple[0]]
        : `Tune for ${selectedMultiple.length} interests`
    : selected
      ? JTBD_CONTINUE_LABEL[selected]
      : JTBD_CONTINUE_LABEL_DEFAULT;
  const ctaKey = isMultiple ? (selectedMultiple.length === 0 ? "default" : selectedMultiple.length === 1 ? selectedMultiple[0] : `count-${selectedMultiple.length}`) : selected ?? "default";

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex flex-col items-center justify-center gap-[32px] px-[40px] py-[54px]"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      <button
        type="button"
        onClick={onSkip}
        aria-label={JTBD_GO_TO_APP_LABEL}
        className="absolute right-[20px] top-[52px] z-30 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
        style={{ fontVariationSettings: "'opsz' 10.5", fontFeatureSettings: "'fina', 'init'" }}
      >
        {JTBD_GO_TO_APP_LABEL}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="text-center">
        <h1
          className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
          style={{ fontVariationSettings: "'opsz' 24" }}
        >
          {pickerTitle}
        </h1>
        <p className="mt-[8px] font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]">
          {pickerSubtitle}
        </p>
      </div>

      <div className="grid w-full max-w-[700px] grid-cols-3 gap-[16px]">
        {JTBD_OPTIONS.map((opt) => {
          const isSelected = isMultiple ? selectedMultiple.includes(opt.id) : selected === opt.id;
          return (
            <JtbdGridTile
              key={opt.id}
              jtbd={opt.id}
              label={opt.label}
              selected={isSelected}
              multiple={isMultiple}
              onSelect={() => (isMultiple ? onToggleMultiple?.(opt.id) : onSelect(isSelected ? null : opt.id))}
            />
          );
        })}
      </div>

      {/* Contextual "wink" message — decorative/supportive only, never
          interactive. `min-h` reserves its space up front so Continue below
          never shifts between the no-selection and selected states. */}
      <div className="flex min-h-[20px] w-full max-w-[560px] items-center justify-center px-[16px]">
        <AnimatePresence>
          {wittyJtbd && (
            <motion.div
              className="pointer-events-none flex items-center justify-center gap-[8px]"
              initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, transition: { duration: reduced ? 0.1 : 0.15 } }}
              transition={{ duration: reduced ? 0.15 : 0.25 }}
            >
              <img src={tipIllustrationUrl} alt="" className="size-[20px] shrink-0" />
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={wittyJtbd}
                  className="text-center font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduced ? 0.1 : 0.2 }}
                >
                  {JTBD_WINK_COPY[wittyJtbd]}
                </motion.p>
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        onClick={onContinue}
        disabled={!hasAnySelection}
        className="flex min-w-[236px] items-center justify-center whitespace-nowrap rounded-[4px] bg-[#6d4aff] px-[24px] pb-[12px] pt-[10px] font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ fontVariationSettings: "'opsz' 12" }}
      >
        {reduced ? (
          ctaLabel
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={ctaKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              {ctaLabel}
            </motion.span>
          </AnimatePresence>
        )}
      </button>
    </motion.div>
  );
}
