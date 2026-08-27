import { useEffect, useRef } from "react";

/** Centre-to-edge spacing between dot centres, in px. Ten keeps ~28×43 dots on
 * a v2 card — dense enough to read as a field, light enough for one canvas
 * layer at 60fps. */
const SPACING = 10;

/** Dot radius in CSS px (drawn at device-pixel ratio on the canvas). */
const RADIUS = 1;

/** Resting opacity every dot sits at when it isn't flaring. */
const BASE_OPACITY = 0.15;

/** A flare's peak, randomized per flare so the field never reads as a set of
 * identical blips firing at different times. */
const PEAK_OPACITY_MIN = 0.7;
const PEAK_OPACITY_MAX = 1;

/** How often a new batch of dots is picked. Randomized inside this range so
 * the batches themselves don't land on an audible-looking beat. */
const TICK_MIN_MS = 80;
const TICK_MAX_MS = 150;

/** Share of the grid picked per tick. */
const SELECT_MIN_FRACTION = 0.03;
const SELECT_MAX_FRACTION = 0.08;

/** Rise to peak, per flare. */
const RISE_MIN_MS = 150;
const RISE_MAX_MS = 300;

/** Decay runs longer than the rise, so dots snap on and drift off rather than
 * blinking symmetrically — that asymmetry is what makes the field read as
 * "being scanned" instead of "twinkling". */
const FALL_RATIO = 2.4;

interface Dot {
  x: number;
  y: number;
  /** Timestamp (rAF clock) this dot's current flare began; `-Infinity` for a
   * dot that has never flared or has fully decayed. */
  flareStart: number;
  riseMs: number;
  fallMs: number;
  peak: number;
}

/** Cubic ease-in-out, the standard smooth flare/decay shape. */
function easeInOut(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/** `0` at rest, `1` at the flare's peak — a rise then a longer fall, both
 * eased. Returns `0` once the flare has fully decayed, so a dot that isn't
 * picked again simply stays at `BASE_OPACITY` rather than being reset. */
function flareEnvelope(elapsed: number, riseMs: number, fallMs: number): number {
  if (elapsed < 0) return 0;
  if (elapsed < riseMs) return easeInOut(elapsed / riseMs);
  const fallProgress = (elapsed - riseMs) / fallMs;
  if (fallProgress >= 1) return 0;
  return 1 - easeInOut(fallProgress);
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** A field of small dots where a random 3–8% flare up and fade back on every
 * ~80–150ms tick — the "profile is being assembled" texture behind a carousel
 * placeholder's spinner. Because each tick only touches its own subset and
 * every flare carries its own rise/fall/peak, the field reads as content being
 * procedurally scanned into place rather than as a grid blinking in unison.
 *
 * Canvas rather than DOM: a v2 card at `SPACING` 10 needs ~1200 dots; that
 * many animated `<div>`s (or `<circle>`s) would re-layout every frame, while
 * one arc loop doesn't. Nothing is created or destroyed per tick — the dot
 * list is built once per layout and a tick only writes four numbers onto the
 * dots it picked. The draw itself is batched: every resting dot goes into a
 * single path with one `fillStyle`, and only the handful currently flaring are
 * filled individually.
 *
 * Placeholder-only for the same reason as `CardHalo`: a resolved card already
 * has artwork; a permanent dot field would read as broken pixels on top of it.
 *
 * Reduced motion: the grid still renders, held static at `BASE_OPACITY`. */
export default function GenerationDotGrid({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frameId = 0;
    let dots: Dot[] = [];
    let cssW = 0;
    let cssH = 0;
    let nextTickAt = 0;

    /** Draws every dot at `BASE_OPACITY` in one path — the reduced-motion
     * frame, and the base layer of every animated frame. */
    const drawBase = (skipFlaring: boolean, now: number) => {
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = `rgba(255,255,255,${BASE_OPACITY})`;
      ctx.beginPath();
      for (const dot of dots) {
        if (skipFlaring && now - dot.flareStart < dot.riseMs + dot.fallMs) continue;
        ctx.moveTo(dot.x + RADIUS, dot.y);
        ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
      }
      ctx.fill();
    };

    const layout = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      cssW = rect.width;
      cssH = rect.height;
      canvas.width = Math.round(cssW * dpr);
      canvas.height = Math.round(cssH * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cols = Math.max(1, Math.floor(cssW / SPACING));
      const rows = Math.max(1, Math.floor(cssH / SPACING));
      const offsetX = (cssW - (cols - 1) * SPACING) / 2;
      const offsetY = (cssH - (rows - 1) * SPACING) / 2;

      dots = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          dots.push({
            x: offsetX + c * SPACING,
            y: offsetY + r * SPACING,
            flareStart: -Infinity,
            riseMs: RISE_MIN_MS,
            fallMs: RISE_MIN_MS * FALL_RATIO,
            peak: PEAK_OPACITY_MAX,
          });
        }
      }

      if (reduced) drawBase(false, 0);
    };

    layout();

    const observer = new ResizeObserver(layout);
    observer.observe(canvas);

    if (reduced) {
      return () => observer.disconnect();
    }

    /** Picks this tick's subset. Sampling with replacement (rather than
     * shuffling the whole list) keeps the cost proportional to the ~36–96 dots
     * actually picked instead of the full ~1200. */
    const tick = (now: number) => {
      const count = Math.round(dots.length * randomBetween(SELECT_MIN_FRACTION, SELECT_MAX_FRACTION));
      for (let n = 0; n < count; n++) {
        const dot = dots[(Math.random() * dots.length) | 0];
        // Never restart a dot that's still climbing — a retriggered rise reads
        // as a stutter rather than a second flare.
        if (now - dot.flareStart < dot.riseMs) continue;
        dot.flareStart = now;
        dot.riseMs = randomBetween(RISE_MIN_MS, RISE_MAX_MS);
        dot.fallMs = dot.riseMs * FALL_RATIO;
        dot.peak = randomBetween(PEAK_OPACITY_MIN, PEAK_OPACITY_MAX);
      }
      nextTickAt = now + randomBetween(TICK_MIN_MS, TICK_MAX_MS);
    };

    const draw = (now: number) => {
      if (now >= nextTickAt) tick(now);

      drawBase(true, now);

      for (const dot of dots) {
        const elapsed = now - dot.flareStart;
        if (elapsed >= dot.riseMs + dot.fallMs) continue;
        const opacity =
          BASE_OPACITY + (dot.peak - BASE_OPACITY) * flareEnvelope(elapsed, dot.riseMs, dot.fallMs);
        ctx.fillStyle = `rgba(255,255,255,${opacity.toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }

      frameId = requestAnimationFrame(draw);
    };

    frameId = requestAnimationFrame(draw);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frameId);
    };
  }, [reduced]);

  return <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 size-full" aria-hidden />;
}
