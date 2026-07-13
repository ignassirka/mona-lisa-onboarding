import { useEffect, useState } from "react";

// Progressive asterisk redaction — adapted from v1's ConnectionDetails.
// When `active`, non-whitespace characters are systematically replaced with
// "*" one at a time in a shuffled order over ~`stepMs` per character.

function shuffleIndices(indices: number[]): number[] {
  const arr = [...indices];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

export function useProgressiveMask(text: string, active: boolean, stepMs = 150): string {
  const [step, setStep] = useState(0);
  const [maskOrder, setMaskOrder] = useState<number[]>([]);

  useEffect(() => {
    if (!active) {
      setStep(0);
      setMaskOrder([]);
      return;
    }

    const raw = [...text]
      .map((ch, i) => (!/\s/.test(ch) ? i : -1))
      .filter((i): i is number => i >= 0);
    const order = shuffleIndices(raw);
    const max = order.length;

    setMaskOrder(order);
    setStep(0);
    if (max === 0) return;

    const id = window.setInterval(() => {
      setStep((s) => {
        if (s >= max) return max;
        const next = s + 1;
        if (next >= max) window.clearInterval(id);
        return next;
      });
    }, stepMs);

    return () => window.clearInterval(id);
  }, [active, text, stepMs]);

  if (!active) return text;

  const masked = new Set(maskOrder.slice(0, step));
  return [...text]
    .map((ch, i) => (/\s/.test(ch) ? ch : masked.has(i) ? "*" : ch))
    .join("");
}
