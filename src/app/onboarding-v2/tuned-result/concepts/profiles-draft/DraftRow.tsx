import { Check, MapPin, Undo2 } from "lucide-react";
import DraftNameInput from "./DraftNameInput";
import { PLUS_AVAILABILITY_LABEL } from "../../profiles/profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import type { DraftProfile } from "./useDrafts";

const C = TUNING_CONCEPTS_COPY.profilesDraft;

interface DraftRowProps {
  draft: DraftProfile;
  selected: boolean;
  /** False while the applying sequence is still running — editing a moving
   * list is unpleasant, and the drafts aren't final until it completes. */
  interactive: boolean;
  /** True when including this draft would exceed the free quota. */
  quotaBlocked: boolean;
  onToggleIncluded: () => void;
  onToggleSelected: () => void;
  onRename: (name: string) => void;
  onSplit: () => void;
}

/** One editable draft. Deliberately shows a destination line and no settings
 * chips: settings aren't editable here, and offering them per row would
 * imply they were. They stay in the pinned protection block, where they're
 * evidence rather than clutter. */
export default function DraftRow({
  draft,
  selected,
  interactive,
  quotaBlocked,
  onToggleIncluded,
  onToggleSelected,
  onRename,
  onSplit,
}: DraftRowProps) {
  const disabled = !interactive || quotaBlocked;

  return (
    <div
      className={`flex w-full flex-col gap-[6px] rounded-[10px] border px-[12px] py-[10px] transition-colors duration-150 ${
        selected
          ? "border-[rgba(109,74,255,0.6)] bg-[rgba(109,74,255,0.08)]"
          : "border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)]"
      } ${draft.included ? "" : "opacity-55"}`}
    >
      <div className="flex items-center gap-[10px]">
        <button
          type="button"
          disabled={disabled}
          onClick={onToggleIncluded}
          role="checkbox"
          aria-checked={draft.included}
          aria-label={`Keep ${draft.name}`}
          className={`flex size-[18px] shrink-0 items-center justify-center rounded-[4px] border outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-default ${
            draft.included
              ? "border-[#6d4aff] bg-[#6d4aff]"
              : "border-[rgba(255,255,255,0.28)] bg-transparent hover:border-[rgba(255,255,255,0.5)]"
          }`}
        >
          {draft.included ? <Check size={12} strokeWidth={3} className="text-white" /> : null}
        </button>

        <img src={draft.icon} alt="" className="size-[18px] shrink-0 opacity-85" />

        <div className="flex min-w-0 flex-1 items-center gap-[8px]">
          <DraftNameInput name={draft.name} disabled={!interactive} onRename={onRename} />
          {draft.combined ? (
            <span className="shrink-0 rounded-[4px] bg-[rgba(109,74,255,0.2)] px-[6px] py-[2px] font-['Segoe_UI_Variable',sans-serif] text-[11px] font-semibold leading-[14px] text-[rgba(196,178,255,0.95)]">
              {C.combinedBadge}
            </span>
          ) : null}
        </div>

        {draft.combined ? (
          <button
            type="button"
            disabled={!interactive}
            onClick={onSplit}
            className="flex shrink-0 items-center gap-[4px] rounded-[6px] px-[6px] py-[3px] font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.55)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-40"
          >
            <Undo2 size={11} strokeWidth={2} />
            {C.splitLabel}
          </button>
        ) : null}

        {/* Selecting for combination is a separate gesture from keeping —
            conflating them would make "combine" destructive by accident. */}
        <button
          type="button"
          disabled={!interactive}
          onClick={onToggleSelected}
          aria-pressed={selected}
          aria-label={`Select ${draft.name} to combine`}
          className={`shrink-0 rounded-[6px] px-[8px] py-[3px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-40 ${
            selected
              ? "bg-[rgba(109,74,255,0.25)] text-white"
              : "text-[rgba(255,255,255,0.45)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
          }`}
        >
          {selected ? "Selected" : "Select"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-[8px] pl-[28px]">
        <span className="flex items-center gap-[5px] font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.55)]">
          <MapPin size={11} strokeWidth={2} className="shrink-0 text-[rgba(255,255,255,0.4)]" />
          {draft.countryLabel}
        </span>

        {draft.destinationFellBack ? (
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.45)]">
            {C.combinedDestinationNote}
          </span>
        ) : null}

        {quotaBlocked ? (
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.45)]">
            {PLUS_AVAILABILITY_LABEL}
          </span>
        ) : null}
      </div>
    </div>
  );
}
