import { useEffect, useRef, useState } from "react";

/** Instantly returns `text` with every non-whitespace char replaced by `char`.
 * Used for the reduced-motion path (no progressive animation). */
export function maskAll(text: string, char = "*"): string {
  return [...text].map((ch) => (/\s/.test(ch) ? ch : char)).join("");
}

function shuffle(indices: number[]): number[] {
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

/**
 * Progressive scramble/redaction — a generalization of the shared
 * `useProgressiveMask` (kept local so the shared hook is untouched). When
 * `active`, non-whitespace characters are replaced with `char` one at a time in
 * shuffled order, spread evenly across `durationMs`. When `reduced`, the text
 * is masked instantly. When inactive, the original text is returned.
 */
export function useScramble(
  text: string,
  active: boolean,
  { durationMs = 600, char = "*", reduced = false }: { durationMs?: number; char?: string; reduced?: boolean } = {},
): string {
  const [step, setStep] = useState(0);
  const orderRef = useRef<number[]>([]);

  useEffect(() => {
    if (!active) {
      setStep(0);
      orderRef.current = [];
      return;
    }

    const targets = [...text]
      .map((ch, i) => (!/\s/.test(ch) ? i : -1))
      .filter((i): i is number => i >= 0);
    orderRef.current = shuffle(targets);
    const max = targets.length;

    if (reduced || max === 0 || durationMs <= 0) {
      setStep(max);
      return;
    }

    setStep(0);
    const stepMs = Math.max(12, durationMs / max);
    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= max) return max;
        const next = s + 1;
        if (next >= max) window.clearInterval(id);
        return next;
      });
    }, stepMs);
    return () => window.clearInterval(id);
  }, [active, text, durationMs, char, reduced]);

  if (!active) return text;

  const masked = new Set(orderRef.current.slice(0, step));
  return [...text].map((ch, i) => (/\s/.test(ch) ? ch : masked.has(i) ? char : ch)).join("");
}
