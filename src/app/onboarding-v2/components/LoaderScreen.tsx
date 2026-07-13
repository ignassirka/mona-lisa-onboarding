import { useEffect } from "react";
import Spinner from "./Spinner";

export interface LoaderScreenProps {
  /** Main headline */
  title: string;
  /** First subtext line (muted) */
  subtitleLine1: string;
  /** Second subtext line (full white) — omit for single-line subtitle */
  subtitleLine2?: string;
  /** How long to hold before calling onComplete (ms) */
  durationMs: number;
  onComplete: () => void;
}

export default function LoaderScreen({ title, subtitleLine1, subtitleLine2, durationMs, onComplete }: LoaderScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onComplete, durationMs);
    return () => clearTimeout(timer);
  }, [onComplete, durationMs]);

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex w-[588px] flex-col items-center gap-[13px] text-center">
          <Spinner size={52} />
          <h1
            className="font-['Segoe_UI_Variable',sans-serif] text-[28px] font-semibold leading-[36px] text-white"
            style={{ fontVariationSettings: "'opsz' 24" }}
          >
            {title}
          </h1>
          <p
            className="font-['Segoe_UI_Variable',sans-serif] text-[16px] leading-[20px] text-[rgba(255,255,255,0.7)]"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {subtitleLine1}
            {subtitleLine2 && (
              <>
                <br />
                <span className="text-white">{subtitleLine2}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
