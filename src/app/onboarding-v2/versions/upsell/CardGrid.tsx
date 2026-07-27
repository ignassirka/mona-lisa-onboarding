import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import PaidFeatureRow from "../../components/PaidFeatureRow";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import StreamingLogos from "./lib/StreamingLogos";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const CARD_GRID_VERSION = "card-grid";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: UPSELL_VERSION_TIMING.staggerChildren, delayChildren: UPSELL_VERSION_TIMING.delayChildren },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: UPSELL_VERSION_TIMING.itemDuration, ease: [0.22, 1, 0.36, 1] } },
};

const gridVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } },
};

/** Alternative upsell #3 — "Benefit card grid". A 2×2 tile grid, each tile
 * the SAME `PaidFeatureRow` card face (`layout="card"`) the Tuned Result /
 * Plus Welcome screens already use, so the Reddit-Premium-style grid
 * reuses an existing component instead of a new one. An odd final tile
 * spans both columns rather than leaving an empty cell. */
export default function CardGrid({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, paidItems, everythingElse } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(CARD_GRID_VERSION, jtbdKey, selectionMode, selectionCount);

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[48px]">
      <UpsellBackButton version={CARD_GRID_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[520px] flex-col gap-[16px]"
        >
          <motion.div variants={itemVariants} className="flex flex-col gap-[5px] text-center">
            <h1
              className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
              style={{ fontVariationSettings: "'opsz' 24" }}
            >
              {UPSELL_VERSIONS_COPY.headline}
            </h1>
            <UpsellSubtitle subtitle={subtitle} className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]" />
          </motion.div>

          {isStreaming && <StreamingLogos variants={itemVariants} className="justify-center" />}

          <motion.p
            variants={itemVariants}
            className="text-center font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]"
          >
            {UPSELL_VERSIONS_COPY.cardGrid.sectionHeading}
          </motion.p>

          <motion.div
            variants={gridVariants}
            className="grid grid-cols-2 gap-[12px] [&>*:last-child:nth-child(odd)]:col-span-2"
          >
            {paidItems.map((feature, i) => (
              <motion.div key={`tile-${i}`} variants={tileVariants} className="h-[140px]">
                <PaidFeatureRow feature={feature} unlocked={false} layout="card" />
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {everythingElse}
          </motion.p>

          <UpsellCtaBlock
            version={CARD_GRID_VERSION}
            jtbdKey={jtbdKey}
            selectionMode={selectionMode}
            selectionCount={selectionCount}
            onUpgrade={onUpgrade}
            onContinueFree={onContinueFree}
            variants={itemVariants}
          />
        </motion.div>
      </Tooltip.Provider>
    </div>
  );
}
