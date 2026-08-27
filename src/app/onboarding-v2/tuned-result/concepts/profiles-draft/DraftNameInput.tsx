import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { MAX_DRAFT_NAME_LENGTH } from "./useDrafts";

const C = TUNING_CONCEPTS_COPY.profilesDraft;

interface DraftNameInputProps {
  name: string;
  disabled: boolean;
  onRename: (name: string) => void;
}

/** Click-to-edit rather than a permanently open field, so the default state
 * reads as a list rather than as a form.
 *
 * Enter and blur commit; Escape reverts. Empty or whitespace-only reverts to
 * the previous name instead of raising a validation error — the gentlest
 * possible failure for a cosmetic field. Duplicate names are allowed,
 * because the real app permits them and inventing a uniqueness rule here
 * would be fabricating product behaviour.
 *
 * Styling follows `CountrySelect`'s search field, this flow's only existing
 * text input, so it reads as native rather than borrowed. */
export default function DraftNameInput({ name, disabled, onRename }: DraftNameInputProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = () => {
    onRename(value);
    setEditing(false);
  };

  const revert = () => {
    setValue(name);
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setValue(name);
          setEditing(true);
        }}
        className="group flex min-w-0 items-center gap-[6px] rounded-[4px] text-left outline-none focus-visible:ring-1 focus-visible:ring-white/40 disabled:cursor-default"
        aria-label={`${C.renameHint}: ${name}`}
      >
        <span
          className="min-w-0 truncate font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {name}
        </span>
        {!disabled ? (
          <Pencil
            size={12}
            strokeWidth={2}
            className="shrink-0 text-[rgba(255,255,255,0.3)] transition-colors duration-150 group-hover:text-[rgba(255,255,255,0.7)]"
          />
        ) : null}
      </button>
    );
  }

  return (
    <input
      ref={inputRef}
      autoFocus
      type="text"
      value={value}
      maxLength={MAX_DRAFT_NAME_LENGTH}
      aria-label={C.renameHint}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          commit();
        } else if (e.key === "Escape") {
          e.preventDefault();
          revert();
        }
      }}
      className="min-w-0 flex-1 rounded-[6px] border border-[rgba(255,255,255,0.2)] bg-[rgba(255,255,255,0.06)] px-[8px] py-[3px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white outline-none focus:border-[rgba(109,74,255,0.7)]"
    />
  );
}
