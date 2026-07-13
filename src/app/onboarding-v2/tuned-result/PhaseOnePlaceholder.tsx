import Spinner from "../components/Spinner";

interface PhaseOnePlaceholderProps {
  narration: string;
  /** `"row"` — icon left, narration text right (Stacked/Compact List rows,
   * Split by Status tiles). `"block"` — icon above narration, both centered
   * (Card Grid's vertical card face). */
  arrangement?: "row" | "block";
  spinnerSize?: number;
}

/** The Phase-1 "spinner + narration" placeholder shown inside a
 * `MaterializingSlot` before an item resolves — shared markup so every
 * layout only needs to supply its own outer shape (className) around this,
 * rather than re-implementing the spinner+text arrangement 4 times. */
export default function PhaseOnePlaceholder({ narration, arrangement = "row", spinnerSize = 16 }: PhaseOnePlaceholderProps) {
  if (arrangement === "block") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-[10px] text-center">
        <Spinner size={spinnerSize} />
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.6)]">{narration}</span>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 flex-1 items-center gap-[8px]">
      <span className="flex size-[20px] shrink-0 items-center justify-center">
        <Spinner size={spinnerSize} />
      </span>
      <span className="min-w-0 flex-1 font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.6)]">{narration}</span>
    </div>
  );
}
