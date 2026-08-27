import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";

const C = TUNING_CONCEPTS_COPY.profilesCarousel;

/** Gap between cards. Also the arrow step, so one press advances by exactly
 * one card rather than by an arbitrary fraction of the viewport. */
const GAP = 16;

/** How far the edge fade extends. Applied as a MASK on the track rather than
 * as a gradient overlay because this screen's backdrop is a live map, so
 * there's no solid colour an overlay could fade into. */
const FADE = 28;

/** Ignore sub-pixel scroll offsets when deciding whether an edge is reached —
 * fractional `scrollLeft` values otherwise leave an arrow enabled at a
 * boundary it can no longer move away from. */
const EPSILON = 4;

/** Breathing room around the scrollable track so a card's own outer glow
 * (e.g. `UpsellProfileCard`'s violet `box-shadow` rim + halo, reused here by
 * `ProfilesBand`) has somewhere to paint into. `overflow-x-auto` alone would
 * only clip horizontally, but per the CSS overflow spec, setting
 * `overflow-x` to anything but `visible` forces `overflow-y` to compute to
 * `auto` too when left `visible` — so this track was ALSO clipping any glow
 * above/below every card, invisibly, since nothing here ever intended
 * vertical clipping. Padding gives the glow room before that clip edge; the
 * matching negative margin on the wrapping div below cancels it back out, so
 * the track's own visible footprint (and the arrow buttons anchored to it)
 * are unchanged. Harmless on this track's other callers (the tuning
 * carousels), whose bordered cards have no shadow to reveal. */
const GLOW_PAD_X = 32;
const GLOW_PAD_TOP = 24;
const GLOW_PAD_BOTTOM = 44;

interface CarouselTrackProps {
  reduced: boolean;
  /** The card index to keep in view — the profile CURRENTLY generating (its
   * `MaterializingSlot` in the `"spinner"` stage), so a run with more
   * profiles than fit at once doesn't leave the one actually loading
   * scrolled out of sight while the visible ones sit finished. `undefined`
   * between cards (nothing is generating right this instant) leaves the
   * scroll position alone rather than snapping somewhere. */
  focusIndex?: number;
  /** Accessible name for the track. Defaults to "Your personalized profiles",
   * which is what both Plus carousels want and neither has to pass. The
   * Free-only variant overrides it: its cards aren't the user's yet, so a
   * possessive would be the one thing on that screen claiming otherwise. */
  label?: string;
  children: ReactNode;
}

function ArrowButton({ side, label, onClick }: { side: "left" | "right"; label: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
      className={`absolute top-1/2 z-10 flex size-[32px] -translate-y-1/2 items-center justify-center rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(12,10,18,0.72)] text-white outline-none backdrop-blur-sm transition-colors duration-150 hover:bg-[rgba(12,10,18,0.9)] focus-visible:ring-2 focus-visible:ring-white/50 ${
        side === "left" ? "left-[8px]" : "right-[8px]"
      }`}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path
          d={side === "left" ? "M10 12L6 8L10 4" : "M6 4L10 8L6 12"}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </motion.button>
  );
}

/** Horizontal scroller for the profile cards.
 *
 * Everything here is conditional on actually overflowing, which is the whole
 * design: a one- to three-intent run gets a plain centred row with no
 * carousel affordances at all, and a five- or six-intent run grows arrows and
 * edge fades because it needs them. Nothing announces "this scrolls" to a
 * user who has nothing to scroll to.
 *
 * Free scrolling with snap points, rather than arrows-only paging — a
 * trackpad or a touchscreen should just work, and the arrows exist for the
 * case where neither is obvious. Snap keeps the result aligned either way. */
export default function CarouselTrack({ reduced, focusIndex, label = C.carouselLabel, children }: CarouselTrackProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ overflowing: false, prev: false, next: false });

  const sync = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({
      overflowing: max > EPSILON,
      prev: el.scrollLeft > EPSILON,
      next: max > EPSILON && el.scrollLeft < max - EPSILON,
    });
  }, []);

  // Re-checks whenever a card is added to the track — cards mount one at a
  // time as they resolve (see `useProfilesCarouselData`), which grows
  // `scrollWidth` without changing the track's own (fixed, `w-full`) box,
  // so a plain `ResizeObserver` on the track wouldn't notice.
  useEffect(() => {
    sync();
  }, [children, sync]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  // Keeps the profile CURRENTLY generating in view. Cards mount strictly
  // sequentially (never in parallel — see `useProfilesCarouselData`), so
  // the track's Nth rendered child is always profile N's card; once more
  // profiles are selected than fit on screen at once, this is what stops
  // the loader a user is actually waiting on from scrolling out of sight
  // behind already-finished cards. `nearest` on both axes means it's a
  // no-op whenever the card is already visible, so this never fights a
  // scroll position the user reached on their own.
  useEffect(() => {
    const el = ref.current;
    if (!el || focusIndex == null) return;
    const card = el.children[focusIndex];
    card?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", inline: "nearest", block: "nearest" });
  }, [focusIndex, reduced]);

  const step = (direction: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild?.clientWidth ?? el.clientWidth;
    el.scrollBy({ left: direction * (card + GAP), behavior: reduced ? "auto" : "smooth" });
  };

  const mask = `linear-gradient(to right, ${edges.prev ? `transparent 0, black ${FADE}px` : "black 0"}, ${
    edges.next ? `black calc(100% - ${FADE}px), transparent 100%` : "black 100%"
  })`;

  return (
    <div className="relative w-full">
      {/* Negative-margin wrapper — see `GLOW_PAD_*`. A plain block (not a
          flex item), so its `auto` width resolves via the standard box-model
          equation against this `relative w-full` ancestor, bleeding
          symmetrically past it rather than just shifting position. */}
      <div style={{ margin: `-${GLOW_PAD_TOP}px -${GLOW_PAD_X}px -${GLOW_PAD_BOTTOM}px` }}>
        <div
          ref={ref}
          onScroll={sync}
          role="group"
          aria-label={label}
          // Scrollbar hidden in favour of the arrows and edge fades — a native
          // bar under full-bleed photography reads as chrome, not as an
          // affordance. `justify-center` only while everything fits: centring
          // an OVERFLOWING flex row pushes content past the start edge, where
          // scrolling can't reach it.
          className={`flex snap-x snap-mandatory gap-[16px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
            edges.overflowing ? "justify-start" : "justify-center"
          }`}
          style={{
            padding: `${GLOW_PAD_TOP}px ${GLOW_PAD_X}px ${GLOW_PAD_BOTTOM}px`,
            ...(edges.overflowing ? { maskImage: mask, WebkitMaskImage: mask } : null),
          }}
        >
          {children}
        </div>
      </div>

      <AnimatePresence>
        {edges.prev ? <ArrowButton key="prev" side="left" label={C.scrollPrev} onClick={() => step(-1)} /> : null}
        {edges.next ? <ArrowButton key="next" side="right" label={C.scrollNext} onClick={() => step(1)} /> : null}
      </AnimatePresence>
    </div>
  );
}
