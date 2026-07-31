import { CONNECTION_RETRY_NARRATION } from "../lib/connectionFailureConfig";

interface ConnectingNarrationProps {
  narration: string | null;
  stillTrying: boolean;
  /** `"center"` (default) matches every centered layout (v1/v2, Hybrid, v4
   * Centered); `"left"` matches the split layouts' left rail. */
  align?: "center" | "left";
  /** Additional spacing/positioning only — never alignment (use `align`). */
  className?: string;
}

/** Shared, version-agnostic narration line for Tier 1's silent auto-remedies
 * — reused by every connection-stage version so the copy/behavior never
 * forks. Renders NOTHING (returns `null`) when both `narration` and
 * `stillTrying` are falsy, which is always true on the untouched happy path
 * (it resolves in ~3.2s, well before the "Still trying…" threshold), so this
 * component never appears unless a failure is actually being simulated.
 * `aria-live="polite"` announces the narration change to screen readers
 * without interrupting; no motion is applied (a plain text swap), matching
 * the "narration lines swap without animation" reduced-motion requirement
 * (unconditionally, since retries are calm, ambient status text, not a
 * moment worth animating either way). */
export default function ConnectingNarration({ narration, stillTrying, align = "center", className = "" }: ConnectingNarrationProps) {
  if (!narration && !stillTrying) return null;
  const alignClass = align === "left" ? "items-start text-left" : "items-center text-center";
  return (
    <div aria-live="polite" className={`flex flex-col ${alignClass} gap-[2px] ${className}`}>
      {narration && (
        <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[18px] text-[rgba(255,255,255,0.7)]">
          {narration}
        </p>
      )}
      {stillTrying && (
        <p className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]">
          {CONNECTION_RETRY_NARRATION.stillTrying}
        </p>
      )}
    </div>
  );
}
