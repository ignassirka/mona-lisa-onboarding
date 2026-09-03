import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, type Variants } from "motion/react";
import { useReducedMotion } from "../lib/useReducedMotion";
import { useUpsellContent } from "./useUpsellContent";
import { useUpsellProfiles, type UpsellProfilePair } from "./profiles/useUpsellProfiles";
import { useTrackUpsellView } from "./lib/useTrackUpsellView";
import UpsellBackButton from "./lib/UpsellBackButton";
import UpsellCtaBlock from "./lib/UpsellCtaBlock";
import UpsellSubtitle from "./lib/UpsellSubtitle";
import StreamingLogos from "./lib/StreamingLogos";
import UpsellBenefitRow from "./profiles/UpsellBenefitRow";
import UpsellHeroMark from "./profiles/UpsellHeroMark";
import UpsellProfileThumb from "./profiles/UpsellProfileThumb";
import InfoTooltip from "./lib/InfoTooltip";
import { profileChips } from "../../lib/jtbdProfileMatrix";
import { UPSELL_VERSIONS_COPY } from "../../lib/upsellVersionsCopy";
import { UPSELL_VERSION_TIMING } from "./timing";
import type { UpsellVersionProps } from "./types";

export const PROFILES_PAIRED_VERSION = "profiles-paired";

const C = UPSELL_VERSIONS_COPY.profilesCombined;

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

/** One row: the profile that caused these features, beside the features it
 * caused. The chips live out here rather than on the thumbnail because at 116px
 * they wouldn't be readable inside the card — and out here they're doing more
 * work anyway, since they're the only place this row states settings. */
function PairedRow({ pair, variants }: { pair: UpsellProfilePair; variants: Variants }) {
  const chips = profileChips(pair.profile.id);

  return (
    <motion.div
      variants={variants}
      className="flex items-center gap-[14px] rounded-[12px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[12px]"
    >
      <UpsellProfileThumb profile={pair.profile} />

      <div className="flex min-w-0 flex-1 flex-col gap-[6px]">
        {pair.benefits.length > 0 ? (
          pair.benefits.map((benefit, i) => (
            <div key={`b-${i}`} className="flex min-w-0 flex-col gap-[2px]">
              <div className="flex items-start justify-between gap-[10px]">
                <p
                  className="min-w-0 font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white"
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
          ))
        ) : (
          <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[18px] text-white">{C.pairedSettingsOnly}</p>
        )}

        <div className="flex flex-wrap gap-[5px]">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-[4px] bg-[rgba(255,255,255,0.07)] px-[7px] py-[2px] font-['Segoe_UI_Variable',sans-serif] text-[11px] font-medium leading-[15px] text-[rgba(255,255,255,0.7)]"
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** Combined upsell — "Paired rows".
 *
 * The most integrated of the four, and the only one where the two content types
 * aren't two things on one screen. Each row is a profile AND the Plus feature
 * that profile is the reason for, so every claim on the screen arrives attached
 * to something with the user's own intent named on it, and nothing is stated
 * twice.
 *
 * **The pairing is causal, not positional.** Rows come from
 * `useUpsellProfiles`, which pairs each displayed feature with its
 * `primarySourceJtbd` — the intent that actually contributed it to the ranked
 * union. Pairing by array index instead would have been a line of code and
 * would caption the Gaming card with a file-sharing benefit the moment the two
 * lists ordered differently, which is the exact kind of plausible-looking lie
 * this screen can't afford.
 *
 * **Profiles with nothing to pair still appear.** The feature list caps at 3
 * while a 6-pick run has 6 profiles, and features dedupe by name, so unpaired
 * profiles are normal rather than exceptional. They go into a trailing
 * thumbnail strip instead of becoming full rows with a filler headline — they're
 * real picks and shouldn't vanish, but they also have nothing to add to the
 * argument, and six rows of which three say nothing is worse than three rows
 * and a strip. A profile with TWO displayed features stacks both in its row,
 * which keeps rows and profiles one-to-one either way. */
export default function ProfilesPaired({ jtbdKey, selectionMode = "single", selectedJtbds, onUpgrade, onContinueFree, onBack }: UpsellVersionProps) {
  const { isStreaming, subtitle, everythingElse } = useUpsellContent(jtbdKey, selectionMode, selectedJtbds);
  const { pairs, orphanBenefits } = useUpsellProfiles(jtbdKey, selectionMode, selectedJtbds);
  const selectionCount = selectedJtbds?.length ?? 1;
  const reduced = useReducedMotion();

  useTrackUpsellView(PROFILES_PAIRED_VERSION, jtbdKey, selectionMode, selectionCount);

  const paired = pairs.filter((p) => p.benefits.length > 0);
  const unpaired = pairs.filter((p) => p.benefits.length === 0);

  // Only when every profile turned out to be unpaired, which would leave the
  // screen with no rows at all. Not reachable with today's data — the ranked
  // list is always sourced from the selection — but a screen whose entire
  // argument can silently disappear needs the floor stated in code.
  const rows = paired.length > 0 ? paired : pairs;
  const strip = paired.length > 0 ? unpaired : [];

  return (
    <div className="absolute inset-0 z-[1000] flex items-center justify-center overflow-y-auto bg-[#16141c] px-[40px] py-[40px]">
      <UpsellBackButton version={PROFILES_PAIRED_VERSION} jtbdKey={jtbdKey} selectionMode={selectionMode} selectionCount={selectionCount} onBack={onBack} />

      <Tooltip.Provider delayDuration={200}>
        <motion.div
          initial={reduced ? undefined : "hidden"}
          animate={reduced ? undefined : "show"}
          variants={containerVariants}
          className="flex w-full max-w-[620px] flex-col gap-[12px]"
        >
          {/* The product mark sits BESIDE the header rather than above it.
              This layout's header is left-aligned, so a row reads naturally —
              and it costs 71px of the vertical budget instead of 139, which is
              what keeps a 6-pick run off the scrollbar. */}
          <motion.div variants={itemVariants} className="flex items-center gap-[16px]">
            <UpsellHeroMark width={120} />
            <div className="flex min-w-0 flex-col gap-[3px]">
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[#b09fff]">
                {C.pairedEyebrow}
              </span>
              <h1
                className="font-['Segoe_UI_Variable',sans-serif] text-[24px] font-semibold leading-[30px] text-white"
                style={{ fontVariationSettings: "'opsz' 24" }}
              >
                {UPSELL_VERSIONS_COPY.headline}
              </h1>
              <UpsellSubtitle
                subtitle={subtitle}
                className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[19px] text-[rgba(255,255,255,0.7)]"
              />
            </div>
          </motion.div>

          <div className="flex flex-col gap-[8px]">
            {rows.map((pair) => (
              <PairedRow key={pair.profile.id} pair={pair} variants={itemVariants} />
            ))}
          </div>

          {/* Defensive — see `useUpsellProfiles.orphanBenefits`. A feature the
              screen was told to show is never dropped just because its
              contributor couldn't be found. */}
          {orphanBenefits.length > 0 && (
            <div className="flex flex-col gap-[7px]">
              {orphanBenefits.map((benefit, i) => (
                <UpsellBenefitRow key={`orphan-${i}`} benefit={benefit} variant="line" variants={itemVariants} />
              ))}
            </div>
          )}

          {strip.length > 0 && (
            <motion.div variants={itemVariants} className="flex items-center gap-[10px]">
              <div className="flex gap-[6px]">
                {strip.map((pair) => (
                  <UpsellProfileThumb key={pair.profile.id} profile={pair.profile} />
                ))}
              </div>
              <span className="min-w-0 font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.7)]">
                {C.pairedMore(strip.length)}
              </span>
            </motion.div>
          )}

          {isStreaming && <StreamingLogos variants={itemVariants} />}

          <motion.p
            variants={itemVariants}
            className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.5)]"
            style={{ fontFeatureSettings: '"rclt" 0' }}
          >
            {everythingElse}
          </motion.p>

          <UpsellCtaBlock
            version={PROFILES_PAIRED_VERSION}
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
