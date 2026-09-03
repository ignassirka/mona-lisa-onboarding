import { motion, type Variants } from "motion/react";
import uspOpenSource from "../../../assets/usp-open-source.svg";
import uspSwissBased from "../../../assets/usp-swiss-based.svg";
import uspNoLogs from "../../../assets/usp-no-logs.svg";
import { UPSELL_TRUST_SIGNALS } from "../../../lib/jtbdUpsell";

/** `UPSELL_TRUST_SIGNALS.asset` → the real exported SVG. Lives here rather
 * than in each layout that renders these three facts, so a third copy of the
 * same three-line map can't drift from the first two. `ValueStack` imports it
 * for its own vertical rendering. */
export const USP_ICONS: Record<string, string> = {
  "usp-open-source": uspOpenSource,
  "usp-swiss-based": uspSwissBased,
  "usp-no-logs": uspNoLogs,
};

/** Proton's three real trust facts as ONE horizontal line — open-source,
 * Swiss-based, no-logs, straight from `UPSELL_TRUST_SIGNALS` (never
 * fabricated stats, and never a per-layout copy of them).
 *
 * A row rather than `ValueStack`'s labelled vertical section: on the
 * features-led layouts the ranked feature list is the screen's subject, and a
 * second headed list underneath it would read as a competing block. As a
 * single 20px-tall line these facts still register as "and the company itself
 * is trustworthy" without taking billing off the features above them. */
export default function UpsellTrustRow({
  signals,
  className = "",
  variants,
}: {
  signals: typeof UPSELL_TRUST_SIGNALS;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div variants={variants} className={`flex flex-wrap items-center gap-x-[16px] gap-y-[6px] ${className}`}>
      {signals.map((signal) => (
        <div key={signal.asset} className="flex items-center gap-[6px]">
          <img src={USP_ICONS[signal.asset]} alt="" className="size-[16px] shrink-0" />
          <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.6)]">
            {signal.label}
          </span>
        </div>
      ))}
    </motion.div>
  );
}
