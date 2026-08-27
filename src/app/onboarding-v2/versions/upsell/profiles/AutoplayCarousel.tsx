import { useEffect, useRef, useState, type ReactNode } from "react";

const DEFAULT_GAP = 16;
const DEFAULT_AUTO_ADVANCE_MS = 4000;

/** How wide the right-edge fade is, in px. */
const EDGE_FADE_PX = 64;

/** Breathing room around the scrollable track so a card's outer glow
 * (`UpsellProfileCard`'s violet `box-shadow` rim + halo) has somewhere to
 * paint into. `overflow-x-auto` alone would only clip horizontally, but per
 * the CSS overflow spec, setting `overflow-x` to anything but `visible`
 * forces `overflow-y` to compute to `auto` too when it's left `visible` —
 * so the scroll container was ALSO clipping the glow above and below every
 * card, invisibly, since nothing here ever intended vertical clipping.
 * Padding gives the glow room to paint before that clip edge; sized to the
 * card's largest shadow layer (`0 10px 30px` — 30px blur, 10px y-offset, so
 * up to 40px below/20px above a card, and 30px either side) plus a small
 * margin. The matching negative margin on the non-scrolling wrapper below
 * cancels this padding out on all four sides, so the carousel's own visual
 * footprint (and the dots' alignment under it) is unchanged — except the
 * left side, which carries an additional, deliberately UNCANCELLED
 * `LEFT_INSET` — see below. */
const GLOW_PAD_X = 32;
const GLOW_PAD_TOP = 24;
const GLOW_PAD_BOTTOM = 44;

/** Extra breathing room on the LEFT only, on top of `GLOW_PAD_X` — unlike
 * that padding (fully cancelled by the matching negative margin, so it's
 * invisible), this amount is deliberately left UNCANCELLED, so it renders as
 * a real, constant gap between the track's left edge and every card,
 * shifting the whole carousel right by this much regardless of which card is
 * in view. Previously the carousel had no left-side mask/fade the way
 * `CarouselTrack`'s two-sided one does, so a card sitting flush against the
 * panel's edge (most noticeable at rest, on the first card) had nothing
 * softening it; a real gap reads better here than a fade would, since this
 * carousel's left edge is always a genuine start (see `rightEdgeFade`'s own
 * note on why the fade is one-directional in the first place). */
const LEFT_INSET = 24;

interface AutoplayCarouselProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  /** Every item's width, in px — items are assumed uniform width, which is
   * what makes `scrollLeft / (itemWidth + gap)` a reliable index. */
  itemWidth: number;
  gap?: number;
  /** Group accessible name, same convention as `CarouselTrack`'s `label`. */
  ariaLabel: string;
  /** Per-dot accessible name, e.g. `(profile) => \`Show ${profile.name} profile\`` — falls back to a generic "item N of M" when omitted. */
  dotLabel?: (item: T, index: number) => string;
  reduced: boolean;
  /** Defaults to 4000ms. Auto-advance is suspended entirely under reduced
   * motion — an unrequested screen change on a fixed timer is exactly the
   * kind of motion that preference exists to opt out of, and every other
   * control here (drag, dots) still works without it. */
  autoAdvanceMs?: number;
  /** Fades the track's right edge into the background, always — not
   * conditional on scroll position the way `CarouselTrack`'s two-sided mask
   * is. Deliberately one-directional: this carousel loops forward via
   * autoplay rather than exposing a "you've scrolled past the start" state,
   * so there's never a moment where fading the LEFT edge would be honest —
   * item 0 is always a real, fully-visible start. The right fade is a
   * standing "there's more" cue rather than a response to a specific scroll
   * offset. Default on; off only makes sense for a single-item carousel,
   * where the dots are already hidden for the same reason. */
  rightEdgeFade?: boolean;
  className?: string;
}

/** A single-row, snap-scrolling carousel with page dots, a fixed-interval
 * auto-advance, and a standing right-edge fade — distinct from `CarouselTrack`
 * (arrows + a two-sided edge fade, grown only when the row actually
 * overflows, no dots, no autoplay). The two solve different problems:
 * `CarouselTrack` is for a row that MIGHT overflow and should stay quiet when
 * it doesn't; this is for a row that always wants to be read as "N things,
 * here's where you are", whether or not everything already fits. Generic over
 * `T` because the only thing carousel-specific here is position — `renderItem`
 * and `dotLabel` keep it free of any one screen's content model.
 *
 * **Index is scroll-position-derived, not just state.** `goTo` sets
 * `activeIndex` immediately (so a dot click highlights instantly rather than
 * lagging the smooth-scroll it triggers) AND scrolls the track; the `onScroll`
 * handler independently recomputes the same index from `scrollLeft`, so a
 * manual drag or trackpad swipe updates the dots correctly even though it
 * never called `goTo`. Both paths write the same derived value, so they can't
 * disagree once a scroll settles.
 *
 * **Auto-advance restarts on every index change, from whatever the CURRENT
 * index is** — the effect's dependency is `activeIndex` itself, not a
 * separate "user just interacted" flag. That gives one behaviour for free: a
 * manual dot click or drag always buys a full fresh interval before the next
 * auto-advance, without a second piece of state to keep in sync with the
 * first. */
export default function AutoplayCarousel<T>({
  items,
  renderItem,
  itemWidth,
  gap = DEFAULT_GAP,
  ariaLabel,
  dotLabel,
  reduced,
  autoAdvanceMs = DEFAULT_AUTO_ADVANCE_MS,
  rightEdgeFade = true,
  className = "",
}: AutoplayCarouselProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const step = itemWidth + gap;

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, items.length - 1));
    setActiveIndex(clamped);
    ref.current?.scrollTo({ left: clamped * step, behavior: reduced ? "auto" : "smooth" });
  };

  // Keeps the dots honest against manual drag/trackpad scrolling, which never
  // goes through `goTo`.
  const handleScroll = () => {
    const el = ref.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / step);
    setActiveIndex(Math.max(0, Math.min(index, items.length - 1)));
  };

  useEffect(() => {
    if (reduced || items.length <= 1) return;
    const t = window.setTimeout(() => goTo((activeIndex + 1) % items.length), autoAdvanceMs);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, reduced, items.length, autoAdvanceMs]);

  const showFade = rightEdgeFade && items.length > 1;
  const mask = showFade ? `linear-gradient(to right, black calc(100% - ${EDGE_FADE_PX}px), transparent 100%)` : undefined;

  return (
    <div className={`flex flex-col items-center gap-[12px] ${className}`}>
      {/* `w-full` (plain block, not a flex item) establishes the reference
          width; the negative-margin child below is free to compute its own
          `auto` width against it via the standard box-model equation
          (width = containing width − margins), which is what lets it bleed
          symmetrically past this element's edges. */}
      <div className="relative w-full">
        <div
          style={{
            margin: `-${GLOW_PAD_TOP}px -${GLOW_PAD_X}px -${GLOW_PAD_BOTTOM}px -${GLOW_PAD_X}px`,
          }}
        >
          <div
            ref={ref}
            onScroll={handleScroll}
            role="group"
            aria-label={ariaLabel}
            className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            style={{
              gap,
              // Left padding carries `LEFT_INSET` on top of the glow
              // clearance, deliberately NOT matched by the margin above —
              // see `LEFT_INSET`.
              padding: `${GLOW_PAD_TOP}px ${GLOW_PAD_X}px ${GLOW_PAD_BOTTOM}px ${GLOW_PAD_X + LEFT_INSET}px`,
              ...(showFade ? { maskImage: mask, WebkitMaskImage: mask } : null),
            }}
          >
            {items.map((item, i) => (
              <div key={i} className="shrink-0 snap-start" style={{ width: itemWidth }}>
                {renderItem(item, i)}
              </div>
            ))}
          </div>
        </div>
      </div>

      {items.length > 1 && (
        <div role="tablist" aria-label={ariaLabel} className="flex items-center gap-[6px]">
          {items.map((item, i) => {
            const active = i === activeIndex;
            return (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={dotLabel ? dotLabel(item, i) : `Show item ${i + 1} of ${items.length}`}
                onClick={() => goTo(i)}
                className={`h-[6px] shrink-0 rounded-full outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-white/40 ${
                  active ? "w-[20px] bg-white" : "w-[6px] bg-[rgba(255,255,255,0.3)] hover:bg-[rgba(255,255,255,0.5)]"
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
