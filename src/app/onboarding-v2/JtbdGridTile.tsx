import type { JtbdId } from "./lib/jtbdData";
import { JTBD_ICONS } from "./versions/lib/jtbdIcons";

interface JtbdGridTileProps {
  jtbd: JtbdId;
  label: string;
  /** Persistent, toggleable selection (clicking an already-selected tile
   * deselects it — see `JtbdGridPanel`). */
  selected: boolean;
  onSelect: () => void;
}

/** Grid tile for `JtbdGridPanel` — icon + label, with a persistent selected
 * treatment (tinted background + accent border, icon un-grayscales) since
 * selecting here doesn't advance by itself — `JtbdGridPanel` still needs an
 * explicit Continue. */
export default function JtbdGridTile({ jtbd, label, selected, onSelect }: JtbdGridTileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="group flex flex-col items-center justify-center gap-[12px] rounded-[12px] border-2 p-[24px] text-center outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.09)] focus-visible:ring-1 focus-visible:ring-white/30"
      style={{
        background: selected ? "rgba(109,74,255,0.18)" : "rgba(255,255,255,0.05)",
        borderColor: selected ? "#6d4aff" : "transparent",
      }}
    >
      <img
        src={JTBD_ICONS[jtbd]}
        alt=""
        className={`h-[28px] w-[42px] object-contain transition-[filter] duration-150 ${selected ? "grayscale-0" : "grayscale group-hover:grayscale-0"}`}
      />
      <span
        className="font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[20px] text-white"
        style={{ fontVariationSettings: "'opsz' 12", fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {label}
      </span>
    </button>
  );
}
