import { Minus, Square, X } from "lucide-react";
import protonVpnLogoUrl from "../assets/proton-vpn-logo.png";

interface WindowChromeProps {
  /** Fired by the "X" close control — returns to the prototype's initial
   * start screen (the 3-button screen), same as closing the real app
   * window would exit the onboarding entirely. Minus/Square (minimize/
   * maximize) stay decorative — no real window to minimize/maximize in a
   * browser tab, and nothing in the prototype spec asked for them. */
  onClose?: () => void;
  /** Onboarding-length indicator, shown centered in the chrome row —
   * present on every screen that mounts `WindowChrome` (Sign In through
   * every `OnboardingV2` phase, both plans), so it reads as one continuous
   * progress bar across the whole flow rather than a per-screen widget.
   * Both props are required together; omit both to render the chrome bar
   * without it (kept optional so `WindowChrome` still works standalone —
   * e.g. any future screen that doesn't participate in onboarding length). */
  progress?: {
    /** 0-indexed current step — 0 is always "Sign in". */
    current: number;
    /** Total step count — plan-aware (Plus has fewer steps than Free; see
     * `onboardingProgressTotal` in `OnboardingV2.tsx`). */
    total: number;
  };
}

/** The onboarding-length indicator itself — a row of thin rounded segments,
 * same "flat bars, filled by count" idiom as `RiskMeter`
 * (`ISPRegulationsPanel.tsx`), reused here for a step count instead of a
 * risk tier. Steps up to and including `current` read as "reached" (solid
 * white) — the active step isn't visually distinguished from completed
 * ones, since the bar's only job is showing how far in you are, not which
 * exact step is active; steps after `current` stay dim. Purely
 * presentational — has no notion of phases/stages/plan, so it can't drift
 * from whatever the caller's own step math decides. */
function OnboardingProgressIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-[6px]"
      role="progressbar"
      aria-valuenow={current + 1}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`Step ${current + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-[3px] w-[24px] rounded-full transition-colors duration-300"
          style={{
            backgroundColor: i <= current ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.15)",
          }}
        />
      ))}
    </div>
  );
}

export default function WindowChrome({ onClose, progress }: WindowChromeProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-[1200] flex h-[40px] items-center justify-between px-[16px]">
      <div className="flex items-center gap-[10px]">
        <img src={protonVpnLogoUrl} alt="" className="size-[16px] shrink-0 object-contain" />
        <span
          className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.85)]"
        >
          Proton VPN
        </span>
      </div>

      {progress && <OnboardingProgressIndicator current={progress.current} total={progress.total} />}

      <div className="flex items-center gap-[6px] text-[rgba(255,255,255,0.7)]">
        <Minus size={16} strokeWidth={1.5} />
        <Square size={12} strokeWidth={1.5} className="mx-[6px]" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="pointer-events-auto flex items-center justify-center rounded-[3px] p-[2px] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.1)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/40"
        >
          <X size={16} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
