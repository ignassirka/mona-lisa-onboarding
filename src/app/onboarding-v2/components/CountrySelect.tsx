import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ChevronDown, Search } from "lucide-react";
import { countryMarkers } from "../../lib/countryMarkers";
import { getFlagUrl } from "../../components/flagComponents";
import Fastest from "../../../imports/Fastest";

export const COUNTRY_SELECT_COPY = {
  fastestLabel: "Fastest country",
  searchPlaceholder: "Search countries…",
  triggerAriaLabel: "Choose a country to connect to",
} as const;

/** All real country names available to connect to, sourced from the app's
 * own coordinate data (`countryMarkers`) — never a curated/shortened
 * subset. Each name here is guaranteed to also resolve a flag (same 93
 * countries as `flagComponents.tsx`'s ISO map, cross-referenced by name). */
const COUNTRY_NAMES = countryMarkers.map((c) => c.name);

interface CountrySelectProps {
  /** `null` = "Fastest country" (the default), or one of `ruleOptions`' ids
   * when those are supplied, or a country name. */
  value: string | null;
  onChange: (country: string | null) => void;
  /** Rule-based entries shown above the country list, each with the Fastest
   * glyph rather than a flag — destinations that describe a BEHAVIOUR
   * ("fastest P2P country") rather than a place, and so have no flag to
   * show. Supplying these REPLACES the single built-in "Fastest country"
   * entry, whose value is `null`; ids must be namespaced (`rule:…`) so they
   * can't collide with one of the 93 country names. Omitted by every caller
   * that only needs real countries plus "Fastest". */
  ruleOptions?: readonly { id: string; label: string }[];
}

/** Plus-only searchable country dropdown. Rendered directly above the
 * primary CTA on Hybrid's unprotected reveal screen (see
 * docs/features/onboarding-v2.md → "Plus country selection"), and once per
 * card in the Profiles-carousel-v2 concept, which supplies `ruleOptions`. A plain
 * custom combobox (button + popover), not a native `<select>`, so the list
 * can be searchable with flags — same visual language (rounded-[4px],
 * `rgba(255,255,255,0.05)` fill) as `CountryBrowser`'s own search bar.
 * Selecting an option updates ONLY this component's own label/value — it
 * never touches the chip, map, or copy elsewhere (that wiring lives one
 * level up, in `Hybrid`/`OnboardingV2`, and only reads `value` once the CTA
 * is actually pressed). Opens with no animation flourish, per spec. */
export default function CountrySelect({ value, onChange, ruleOptions }: CountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // The built-in "Fastest country" entry is just the degenerate one-rule
  // case, so both paths below run the same code.
  const rules = useMemo<readonly { id: string | null; label: string }[]>(
    () => ruleOptions ?? [{ id: null, label: COUNTRY_SELECT_COPY.fastestLabel }],
    [ruleOptions],
  );
  const ruleLabelById = useMemo(() => new Map<string | null, string>(rules.map((r) => [r.id, r.label])), [rules]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const names = q ? COUNTRY_NAMES.filter((n) => n.toLowerCase().includes(q)) : COUNTRY_NAMES;
    // Rule entries always lead the list, filtered by the same query (so
    // typing "fast" still surfaces them), matching a normal combobox.
    const matchingRules = rules.filter((r) => !q || r.label.toLowerCase().includes(q)).map((r) => r.id);
    return [...matchingRules, ...names];
  }, [query, rules]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setHighlighted(0);
    // Focus the search field the moment the panel opens (no animation to
    // wait for), so typing-to-filter works immediately.
    const id = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClickAway = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickAway);
    return () => document.removeEventListener("mousedown", handleClickAway);
  }, [open]);

  const select = (country: string | null) => {
    // Move focus back to the trigger BEFORE the option/search-input unmount,
    // rather than after. Selecting closes the popover, which removes the
    // option that currently holds focus — if we let that removal happen
    // first, the browser has to decide where focus goes with no guarantee a
    // parent listening for `blur`/`focusout` ever sees a clean transition,
    // which is what left this control's host (a card that opens on
    // hover/focus) stuck open forever after a selection. Calling `.focus()`
    // here fires a normal blur/focus pair between two elements that both
    // still exist, so the host's own focus tracking sees an unambiguous
    // "focus moved to the trigger, still inside me" transition instead.
    triggerRef.current?.focus();
    onChange(country);
    setOpen(false);
  };

  const handleKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      // Same reasoning as `select` — Escape closes the popover out from
      // under the still-focused search input.
      triggerRef.current?.focus();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlighted((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlighted((i) => Math.max(i - 1, 0));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const choice = filtered[highlighted];
      if (choice !== undefined) select(choice);
    }
  };

  const triggerRuleLabel = ruleLabelById.get(value);
  const isFastestTrigger = triggerRuleLabel !== undefined;
  const triggerLabel = triggerRuleLabel ?? value ?? COUNTRY_SELECT_COPY.fastestLabel;
  const triggerFlagUrl = isFastestTrigger || !value ? null : getFlagUrl(value);

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={COUNTRY_SELECT_COPY.triggerAriaLabel}
        className="flex w-full items-center justify-between gap-[8px] rounded-[4px] bg-[rgba(255,255,255,0.05)] px-[12px] py-[9px] text-left font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-white transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)]"
      >
        <span className="flex min-w-0 items-center gap-[8px]">
          {isFastestTrigger ? (
            <span className="h-[14px] w-[20px] shrink-0">
              <Fastest variant="unprotected" />
            </span>
          ) : (
            triggerFlagUrl && <img src={triggerFlagUrl} alt="" className="h-[14px] w-[20px] shrink-0 rounded-[3px] object-cover" />
          )}
          <span className="truncate">{triggerLabel}</span>
        </span>
        <ChevronDown size={16} className={`shrink-0 text-[rgba(255,255,255,0.6)] transition-transform duration-150 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 z-20 mb-[6px] flex w-full flex-col overflow-hidden rounded-[6px] bg-[#1c1a24] shadow-[0px_8px_24px_rgba(0,0,0,0.45)]"
          role="listbox"
        >
          <div className="flex items-center gap-[8px] border-b border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.05)] px-[10px] py-[8px]">
            <Search size={14} className="shrink-0 text-[rgba(255,255,255,0.5)]" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={COUNTRY_SELECT_COPY.searchPlaceholder}
              className="w-full bg-transparent font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-white outline-none placeholder:text-[rgba(255,255,255,0.5)]"
            />
          </div>
          <div className="max-h-[220px] overflow-y-auto py-[4px]">
            {filtered.map((name, i) => {
              const ruleLabel = ruleLabelById.get(name);
              const isFastest = ruleLabel !== undefined;
              const label = ruleLabel ?? name ?? COUNTRY_SELECT_COPY.fastestLabel;
              const flagUrl = isFastest || name === null ? null : getFlagUrl(name);
              const isSelected = value === name;
              const isHighlighted = i === highlighted;
              return (
                <button
                  type="button"
                  key={name ?? "__fastest__"}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => select(name)}
                  className={`flex w-full items-center gap-[8px] px-[12px] py-[8px] text-left font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] transition-colors duration-100 ${
                    isHighlighted ? "bg-[rgba(255,255,255,0.08)]" : ""
                  } ${isSelected ? "text-white" : "text-[rgba(255,255,255,0.85)]"}`}
                >
                  {isFastest ? (
                    <span className="h-[14px] w-[20px] shrink-0">
                      <Fastest variant="unprotected" />
                    </span>
                  ) : flagUrl ? (
                    <img src={flagUrl} alt="" className="h-[14px] w-[20px] shrink-0 rounded-[3px] object-cover" />
                  ) : (
                    <span className="h-[14px] w-[20px] shrink-0" />
                  )}
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-[12px] py-[10px] font-['Segoe_UI_Variable',sans-serif] text-[13px] text-[rgba(255,255,255,0.5)]">No countries found</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
