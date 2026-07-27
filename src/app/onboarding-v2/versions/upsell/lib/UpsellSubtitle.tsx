import type { UpsellSubtitleInfo } from "../useUpsellContent";

/** Renders the SAME "Based on your ___ pick…" / "Based on your {count}
 * picks…" sentence every upsell layout (including the default) already
 * shows — centralized so all 5 alternatives stay word-for-word identical
 * to the original, while each can still style the wrapping element/tone
 * for its own layout via `className`/`boldClassName`. */
export default function UpsellSubtitle({
  subtitle,
  className = "",
  boldClassName = "font-semibold text-white",
}: {
  subtitle: UpsellSubtitleInfo;
  className?: string;
  boldClassName?: string;
}) {
  if (subtitle.isMultiple) {
    return <p className={className}>{subtitle.text}</p>;
  }
  return (
    <p className={className}>
      Based on your <span className={boldClassName}>{subtitle.jtbdWord}</span> pick, here is what VPN Plus turns on.
    </p>
  );
}
