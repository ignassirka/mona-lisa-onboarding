import { useEffect, useRef } from "react";
import { SIGN_IN_ENCRYPTION as C } from "./signInEncryptionConfig";

interface SignInEncryptionGridProps {
  width: number;
  height: number;
  /** When true, render a static grid with no character regeneration. */
  reduced: boolean;
  className?: string;
}

interface GridCell {
  char: string;
  nextChar: string | null;
  flipStart: number | null;
  /** Timestamp when the post-flip highlight finishes fading out. */
  highlightUntil: number | null;
}

function randomChar(): string {
  return C.charset[Math.floor(Math.random() * C.charset.length)]!;
}

function randomFromPool(pool: string, except?: string): string {
  let next = pool[Math.floor(Math.random() * pool.length)]!;
  while (except !== undefined && next === except && pool.length > 1) {
    next = pool[Math.floor(Math.random() * pool.length)]!;
  }
  return next;
}

function randomFlipChar(current: string): string {
  if (Math.random() < C.digitFlipBias) {
    return randomFromPool(C.digitSymbolCharset, current);
  }
  return randomFromPool(C.charset, current);
}

function radialMultiplier(x: number, y: number, width: number, height: number): number {
  const cx = width * C.radialCenterX;
  const cy = height * C.radialCenterY;
  const halfDiag = Math.hypot(width, height) * 0.5;
  const dist = Math.hypot(x - cx, y - cy) / halfDiag;
  if (dist <= C.radialFull) return 1;
  const t = Math.min(1, (dist - C.radialFull) / (1 - C.radialFull));
  return 1 - t * (1 - C.radialEdgeMultiplier);
}

/** Returns 1 normally; after a flip, ramps up then eases back down. */
function highlightMultiplier(cell: GridCell, now: number): number {
  if (cell.highlightUntil === null || now >= cell.highlightUntil) return 1;
  const fadeStart = cell.highlightUntil - C.flipHighlightFadeMs;
  if (now < fadeStart) return C.flipHighlightMultiplier;
  const t = (now - fadeStart) / C.flipHighlightFadeMs;
  return C.flipHighlightMultiplier + (1 - C.flipHighlightMultiplier) * t;
}

/** Decorative ciphertext grid for the Sign In window — full-bleed monospace
 * glyphs at very low opacity with a center-weighted radial fade. A few
 * random cells crossfade to new glyphs on a slow interval; freshly flipped
 * glyphs brighten briefly so the motion reads. Disabled under
 * `prefers-reduced-motion`. Canvas-backed; `pointer-events-none`. */
export default function SignInEncryptionGrid({ width, height, reduced, className = "" }: SignInEncryptionGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${C.fontSize}px Consolas, "Courier New", monospace`;

    const cols = Math.ceil(width / C.cellWidth);
    const rows = Math.ceil(height / C.cellHeight);
    const cells: GridCell[] = [];
    const positions: { x: number; y: number }[] = [];
    const radials: number[] = [];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * C.cellWidth + C.cellWidth * 0.5;
        const y = row * C.cellHeight + C.cellHeight * 0.5;
        positions.push({ x, y });
        radials.push(radialMultiplier(x, y, width, height));
        cells.push({ char: randomChar(), nextChar: null, flipStart: null, highlightUntil: null });
      }
    }

    const flipCandidateIndices = radials
      .map((radial, index) => {
        const position = positions[index]!;
        const normalizedX = position.x / width;
        const normalizedY = position.y / height;
        const behindForeground =
          normalizedX >= C.foregroundExclusion.left &&
          normalizedX <= C.foregroundExclusion.right &&
          normalizedY >= C.foregroundExclusion.top &&
          normalizedY <= C.foregroundExclusion.bottom;

        return radial >= C.flipMinRadial && !behindForeground ? index : -1;
      })
      .filter((index) => index >= 0);

    const [r, g, b] = C.glyphRgb;

    const pickFlipIndex = (preferNumeric: boolean): number => {
      const numericCandidates = preferNumeric
        ? flipCandidateIndices.filter((index) => C.digitSymbolCharset.includes(cells[index]!.char))
        : [];
      const pool = numericCandidates.length > 0 ? numericCandidates : flipCandidateIndices;
      if (pool.length > 0) {
        return pool[Math.floor(Math.random() * pool.length)]!;
      }
      return Math.floor(Math.random() * cells.length);
    };

    const beginHighlight = (cell: GridCell, now: number) => {
      cell.highlightUntil = now + C.flipHighlightHoldMs + C.flipHighlightFadeMs;
    };

    const draw = (now: number) => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]!;
        const { x, y } = positions[i]!;
        const radial = radials[i]!;
        const peakAlpha = C.baseOpacity * radial;
        if (peakAlpha <= 0.001) continue;

        const highlight = highlightMultiplier(cell, now);

        if (cell.flipStart !== null && cell.nextChar !== null) {
          const t = Math.min(1, (now - cell.flipStart) / C.flipFadeDurationMs);
          if (t >= 1) {
            cell.char = cell.nextChar;
            cell.nextChar = null;
            cell.flipStart = null;
            beginHighlight(cell, now);
            ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, peakAlpha * highlight)})`;
            ctx.fillText(cell.char, x, y);
          } else {
            const crossfadeBoost = 1 + (C.flipHighlightMultiplier - 1) * t;
            ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, peakAlpha * (1 - t))})`;
            ctx.fillText(cell.char, x, y);
            ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, peakAlpha * t * crossfadeBoost)})`;
            ctx.fillText(cell.nextChar, x, y);
          }
        } else {
          ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, peakAlpha * highlight)})`;
          ctx.fillText(cell.char, x, y);
        }
      }
    };

    let rafId: number | null = null;
    let flipTimerId: number | null = null;

    if (!reduced) {
      const loop = (now: number) => {
        draw(now);
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);

      flipTimerId = window.setInterval(() => {
        const picks = new Set<number>();
        const count = Math.min(C.flipsPerCycle, flipCandidateIndices.length || cells.length);
        let attempts = 0;
        while (picks.size < count && attempts < count * 12) {
          picks.add(pickFlipIndex(Math.random() < C.numericFlipRatio));
          attempts++;
        }

        const now = performance.now();
        for (const index of picks) {
          const cell = cells[index]!;
          if (cell.flipStart !== null) continue;
          cell.nextChar = randomFlipChar(cell.char);
          cell.flipStart = now;
        }
      }, C.flipIntervalMs);
    } else {
      draw(performance.now());
    }

    return () => {
      if (rafId !== null) window.cancelAnimationFrame(rafId);
      if (flipTimerId !== null) window.clearInterval(flipTimerId);
    };
  }, [width, height, reduced]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        maskImage:
          "radial-gradient(ellipse 72% 68% at 50% 38%, rgba(0,0,0,1) 18%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0) 88%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 72% 68% at 50% 38%, rgba(0,0,0,1) 18%, rgba(0,0,0,0.55) 58%, rgba(0,0,0,0) 88%)",
      }}
    />
  );
}
