import { useId, useRef, useState } from "react";
import { Eye, EyeOff, X, AlertTriangle } from "lucide-react";

interface FigmaTextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /** `"password"` swaps the trailing clear (×) icon for a show/hide (eye)
   * toggle and masks the value by default — everything else (states,
   * colors, spacing) is identical between the two types, per the Figma
   * design system's "Input" component set. */
  type?: "text" | "password";
  placeholder?: string;
  /** Renders the Error state (red-tinted field + bottom border + caption
   * row with a warning glyph) when set. */
  error?: string;
}

/** A single input field, built to match the Figma design system's "Input"
 * component set (file `Vibing redesign`, node 165:9148 — pulled via the
 * Figma MCP) pixel-for-pixel across every documented state:
 * - **Default** (idle, empty): `rgba(255,255,255,0.05)` field background,
 *   no border, muted placeholder.
 * - **Hover** (idle, empty, hovered): `rgba(255,255,255,0.1)` background.
 * - **Filled** (idle, has a value, not focused): same background as
 *   Default — only the text itself (white, not muted) distinguishes it;
 *   the design system uses the identical `rgba(255,255,255,0.05)` fill for
 *   both, so no separate CSS state is needed here.
 * - **Focus (default/filled)**: `rgba(255,255,255,0.2)` background + a
 *   2px solid white BOTTOM-only border (not a full outline) + the trailing
 *   icon (clear/eye) appears — reserved via an always-present, normally
 *   transparent `border-b-2` so the border's appearance never shifts the
 *   field's box size.
 * - **Error**: `rgba(247,96,123,0.05)` background + a 2px solid `#F7607B`
 *   bottom border + a caption row below the field (warning triangle +
 *   message, `#F7607B`), regardless of focus (the design system defines no
 *   separate "focus + error" variant).
 *
 * The trailing icon (clear ×, or the password eye) is only rendered while
 * the field is actively focused, exactly matching the component set — the
 * Default/Hover/Filled/Error variants have no icon node at all, only the
 * two Focus variants do. Icons reuse `lucide-react` (already a project
 * dependency) rather than the Figma file's own icon components (`ic-cross`/
 * `ic-eye`/`ic-exclamation-triangle-filled`) — same "no new artwork,
 * reuse what's already used elsewhere" precedent as every other stage in
 * this app. Clicking the icon uses `onMouseDown` + `preventDefault` so it
 * never blurs the input first (keeping it visible/usable through the
 * click, rather than vanishing the instant the browser would otherwise
 * shift focus away). */
export default function FigmaTextField({ label, value, onChange, type = "text", placeholder, error }: FigmaTextFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  const hasError = !!error;
  const showTrailingIcon = focused && !hasError;

  // Default/Filled share one background (`rgba(255,255,255,0.05)` — the
  // design system uses the identical fill for both; only the text color
  // differs, handled natively via `::placeholder`); Hover only applies
  // when idle (not focused, no error), expressed as a plain Tailwind
  // `hover:` class rather than JS state, since CSS already knows when the
  // pointer is over the field.
  const fieldClassName = hasError
    ? "bg-[rgba(247,96,123,0.05)] border-b-[#F7607B]"
    : focused
      ? "bg-[rgba(255,255,255,0.2)] border-b-white"
      : "bg-[rgba(255,255,255,0.05)] border-b-transparent hover:bg-[rgba(255,255,255,0.1)]";

  const handleClear = () => {
    onChange("");
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <label
        htmlFor={id}
        className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-normal leading-[20px] text-white"
      >
        {label}
      </label>

      <div className="flex flex-col gap-[4px]">
        <div
          className={`flex items-end gap-[8px] rounded-[4px] border-b-2 pb-[5px] pl-[12px] pr-[12px] pt-[5px] transition-colors duration-150 ${fieldClassName}`}
        >
          <input
            id={id}
            ref={inputRef}
            type={isPassword && !showPassword ? "password" : "text"}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            className="min-w-0 flex-1 bg-transparent font-['Segoe_UI_Variable',sans-serif] text-[14px] font-normal leading-[20px] text-white caret-white outline-none placeholder:text-[rgba(255,255,255,0.5)]"
          />
          {showTrailingIcon && (
            <button
              type="button"
              tabIndex={-1}
              onMouseDown={(e) => e.preventDefault()}
              onClick={isPassword ? () => setShowPassword((v) => !v) : handleClear}
              aria-label={isPassword ? (showPassword ? "Hide password" : "Show password") : "Clear field"}
              className="flex size-[16px] shrink-0 items-center justify-center text-[rgba(255,255,255,0.7)] outline-none transition-colors hover:text-white"
            >
              {isPassword ? (
                showPassword ? <EyeOff size={16} strokeWidth={1.75} /> : <Eye size={16} strokeWidth={1.75} />
              ) : (
                <X size={16} strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>

        {hasError && (
          <div className="flex items-center gap-[4px] text-[#F7607B]">
            <AlertTriangle size={16} strokeWidth={2} className="shrink-0" />
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-normal leading-[16px]">{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
