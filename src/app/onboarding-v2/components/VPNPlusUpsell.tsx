import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { Info } from "lucide-react";
import {
  JTBD_UPSELL,
  UPSELL_PRICING,
  UPSELL_EVERYTHING_ELSE,
  UPSELL_TRUST_SIGNALS,
  UPSELL_MULTIPLE_HIGHLIGHT_CAP,
  upsellSubtitleMultiple,
  type UpsellBenefit,
} from "../lib/jtbdUpsell";
import { mergePaidFeatures, rankPaidFeatures, capList } from "../lib/jtbdMerge";
import type { JTBDKey } from "../lib/jtbdTuningResult";
import type { SelectionMode } from "../lib/jtbdData";
import heroUrl from "../assets/upsell-hero.jpg";
import { UPSELL_VERSIONS_COPY } from "../lib/upsellVersionsCopy";
import sparkleUrl from "../assets/upsell-sparkle.svg";
import logoNetflix from "../assets/streaming-netflix.png";
import logoBbc from "../assets/streaming-bbc.png";
import logoPrime from "../assets/streaming-prime.png";
import logoParamount from "../assets/streaming-paramount.png";
import logoMax from "../assets/streaming-max.png";
import logoHulu from "../assets/streaming-hulu.png";
import logoDisney from "../assets/streaming-disney.png";

const STREAMING_LOGOS = [
  { src: logoNetflix, alt: "Netflix" },
  { src: logoPrime, alt: "Prime Video" },
  { src: logoDisney, alt: "Disney+" },
  { src: logoMax, alt: "Max" },
  { src: logoHulu, alt: "Hulu" },
  { src: logoBbc, alt: "BBC iPlayer" },
  { src: logoParamount, alt: "Paramount+" },
];

import uspOpenSource from "../assets/usp-open-source.svg";
import uspSwissBased from "../assets/usp-swiss-based.svg";
import uspNoLogs from "../assets/usp-no-logs.svg";

const USP_ICONS: Record<string, string> = {
  "usp-open-source": uspOpenSource,
  "usp-swiss-based": uspSwissBased,
  "usp-no-logs": uspNoLogs,
};

interface VPNPlusUpsellProps {
  jtbdKey: JTBDKey;
  /** "Selection" prototype control — defaults to `"single"`, which is this
   * component's entire pre-existing behavior, byte-for-byte. `"multiple"`
   * only changes anything once `selectedJtbds.length >= 2` (same "1
   * selected → exactly as today" gate `TunedResult` uses). */
  selectionMode?: SelectionMode;
  /** Multiple mode only — the full ordered selection (first-selected
   * first). Ignored in single mode. */
  selectedJtbds?: JTBDKey[];
  /** Get VPN Plus → upgrade flow (out of scope) */
  onUpgrade: () => void;
  /** Continue free → next step (out of scope) */
  onContinueFree: () => void;
  /** Back → return to the Tuned Result screen */
  onBack: () => void;
}


const leftVariants: Variants = {
  hidden: { opacity: 0, x: -48 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1], staggerChildren: 0.07, delayChildren: 0.12 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, x: -18 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};

function InfoTooltip({ content }: { content?: string }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button
          type="button"
          aria-label="More information"
          className="flex size-[16px] shrink-0 items-center justify-center text-[rgba(255,255,255,0.5)] outline-none transition-colors hover:text-white focus-visible:text-white"
        >
          <Info size={16} strokeWidth={1.75} />
        </button>
      </Tooltip.Trigger>
      {content ? (
        <Tooltip.Portal>
          <Tooltip.Content
            side="top"
            sideOffset={6}
            className="z-[1300] max-w-[280px] rounded-[6px] bg-[#0a0a0f] px-[10px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.9)] shadow-[0_8px_24px_rgba(0,0,0,0.5)]"
          >
            {content}
            <Tooltip.Arrow className="fill-[#0a0a0f]" />
          </Tooltip.Content>
        </Tooltip.Portal>
      ) : null}
    </Tooltip.Root>
  );
}

function BenefitCard({ benefit }: { benefit: UpsellBenefit }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-start gap-[10px] rounded-[10px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] px-[14px] py-[10px]"
    >
      <img src={sparkleUrl} alt="" className="mt-[1px] size-[16px] shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="flex items-start justify-between gap-[12px]">
          <p
            className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {benefit.outcome}
          </p>
          <InfoTooltip content={benefit.tooltip} />
        </div>
        <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[17px]">
          <span className="text-[rgba(255,255,255,0.5)]">via </span>
          <span className="text-[rgba(255,255,255,0.8)]">{benefit.featureName}</span>
        </span>
      </div>
    </motion.div>
  );
}

export default function VPNPlusUpsell({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  onUpgrade,
  onContinueFree,
  onBack,
}: VPNPlusUpsellProps) {
  const upsell = JTBD_UPSELL[jtbdKey];

  // Multiple mode only changes anything once 2+ JTBDs are actually
  // selected — with exactly 1, this screen behaves identically to Single
  // mode (same convention `TunedResult` uses).
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;

  // Multiple mode: reuse the result screen's SAME paid-feature engine
  // (deduped union → `FEATURES_RANK` order) rather than the single-JTBD
  // `JTBD_UPSELL[jtbdKey].benefits` — this is what keeps the upsell's
  // highlighted features, the result screen's capped Plus section, and the
  // welcome's unlocked items all drawing from one consistent ranked list.
  // Capped independently at `UPSELL_MULTIPLE_HIGHLIGHT_CAP` (3) — a
  // deliberately larger reveal than the result/welcome screens' own cap,
  // confirmed at checkpoint: no disagreement on ranking, just how much of
  // the same ranked list each screen shows.
  const benefits: UpsellBenefit[] = isMultipleActive
    ? capList(rankPaidFeatures(mergePaidFeatures(selectedJtbds!)), UPSELL_MULTIPLE_HIGHLIGHT_CAP).displayed.map((feature) => ({
        outcome: feature.outcome,
        featureName: feature.featureName,
        learnMore: true,
        tooltip: feature.tooltip,
      }))
    : upsell.benefits;

  return (
    // `@container` lets the split-screen respond to the panel's own width
    // (the onboarding window is a fixed box, so viewport breakpoints wouldn't fire).
    <div className="absolute inset-0 z-[1000] flex bg-[#16141c] @container">
      {/* Back button — top-left, matching the Tuned Result screen */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        onClick={onBack}
        aria-label="Back to tuned result"
        className="absolute left-[20px] top-[52px] z-20 flex items-center gap-[6px] rounded-[4px] px-[8px] py-[6px] font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30"
        style={{ fontVariationSettings: "'opsz' 11" }}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Back
      </motion.button>
      {/* LEFT — conversion content (~52%); single column below ~900px */}
      <div className="flex w-[52%] items-center overflow-y-auto px-[48px] py-[24px] @max-[900px]:w-full @max-[900px]:px-[32px]">
        <Tooltip.Provider delayDuration={200}>
          <motion.div
            initial="hidden"
            animate="show"
            variants={leftVariants}
            className="flex w-full max-w-[520px] flex-col gap-[20px]"
          >
            <motion.div variants={itemVariants} className="flex flex-col gap-[5px]">
              <h1
                className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                {UPSELL_VERSIONS_COPY.headline}
              </h1>
              <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]">
                {isMultipleActive ? (
                  upsellSubtitleMultiple(selectedJtbds!.length)
                ) : (
                  <>
                    Based on your <span className="font-semibold text-white">{upsell.jtbdWord}</span> pick, here is what VPN Plus turns on.
                  </>
                )}
              </p>
            </motion.div>

            {/* Streaming logos — only shown for the streaming JTBD */}
            {jtbdKey === "streaming" && (
              <motion.div variants={itemVariants} className="flex items-center gap-[10px]">
                {STREAMING_LOGOS.map(({ src, alt }) => (
                  <img
                    key={alt}
                    src={src}
                    alt={alt}
                    title={alt}
                    className="size-[28px] rounded-[6px] object-cover"
                  />
                ))}
                <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]">
                  + and more
                </span>
              </motion.div>
            )}

            <div className="flex flex-col gap-[8px]">
              {benefits.map((benefit, i) => (
                <BenefitCard key={`benefit-${i}`} benefit={benefit} />
              ))}
            </div>

            <motion.p
              variants={itemVariants}
              className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
              style={{ fontFeatureSettings: '"rclt" 0' }}
            >
              {UPSELL_EVERYTHING_ELSE}
            </motion.p>

            {/* CTAs — pricing folded into the primary button */}
            <motion.div variants={itemVariants} className="flex flex-col gap-[7px]">
              <button
                onClick={onUpgrade}
                className="flex w-full flex-col items-center justify-center gap-[1px] rounded-[6px] bg-[#6d4aff] px-[24px] py-[9px] font-['Segoe_UI_Variable',sans-serif] text-white transition-all duration-150 hover:bg-[#7c5cff] active:scale-[0.98]"
                style={{ fontVariationSettings: "'opsz' 12" }}
              >
                <span className="text-[16px] font-semibold leading-[20px]">Get VPN Plus</span>
                <span className="text-[12px] leading-[16px] text-[rgba(255,255,255,0.8)]">
                  {UPSELL_PRICING.yearlyMonthlyPrice}/mo, {UPSELL_PRICING.billingNote} · save {UPSELL_PRICING.savingsPercent}
                </span>
              </button>
              <button
                onClick={onContinueFree}
                className="flex h-[38px] w-full items-center justify-center whitespace-nowrap rounded-[6px] border border-[rgba(255,255,255,0.2)] bg-transparent font-['Segoe_UI_Variable',sans-serif] text-[15px] font-semibold leading-[20px] text-[rgba(255,255,255,0.85)] transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white active:scale-[0.98]"
                style={{ fontVariationSettings: "'opsz' 12" }}
              >
                Continue free
              </button>
            </motion.div>
          </motion.div>
        </Tooltip.Provider>
      </div>

      {/* RIGHT — 3D hero (~48%); hidden below ~900px so CTAs stay visible */}
      <motion.div
        initial={{ opacity: 0, x: 64 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-[48%] overflow-hidden bg-black @max-[900px]:hidden"
      >
        <img
          src={heroUrl}
          alt="Proton VPN Plus"
          className="absolute inset-0 size-full object-cover"
        />
      </motion.div>
    </div>
  );
}
