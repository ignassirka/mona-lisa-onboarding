import { ShieldCheck } from "lucide-react";

export interface PagerItem {
  id: string;
  /** Null for the trailing baseline card, which uses the shield glyph. */
  icon: string | null;
  label: string;
}

interface DeckPagerProps {
  items: PagerItem[];
  current: number;
  onSelect: (index: number) => void;
}

/** One glyph per card. Real buttons with `aria-current` rather than dots, so
 * the deck is navigable by keyboard and screen reader and each destination
 * is named rather than being an anonymous position. */
export default function DeckPager({ items, current, onSelect }: DeckPagerProps) {
  return (
    <div className="flex items-center justify-center gap-[6px]">
      {items.map((item, i) => {
        const active = i === current;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(i)}
            aria-current={active ? "true" : undefined}
            aria-label={item.label}
            title={item.label}
            className={`flex size-[34px] items-center justify-center rounded-[8px] outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-white/40 ${
              active ? "bg-[rgba(255,255,255,0.14)]" : "hover:bg-[rgba(255,255,255,0.06)]"
            }`}
          >
            {item.icon ? (
              <img src={item.icon} alt="" className={`size-[18px] ${active ? "opacity-95" : "opacity-45"}`} />
            ) : (
              <ShieldCheck
                size={18}
                strokeWidth={2}
                className={active ? "text-[rgba(44,255,204,0.9)]" : "text-[rgba(255,255,255,0.45)]"}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
