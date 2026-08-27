import { useState, type ReactNode } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence, type Variants } from "motion/react";
import ConceptFrame from "../ConceptFrame";
import MaterializingSlot from "../../MaterializingSlot";
import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import InfoTooltip from "../../../versions/upsell/lib/InfoTooltip";
import ProfileTabs from "./ProfileTabs";
import ProfilePreviewCard from "./ProfilePreviewCard";
import { useProfileFirstData } from "./useProfileFirstData";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { narrateEnabling } from "../../copy";
import checkmarkUrl from "../../../assets/checkmark-circle-filled.svg";
import type { JtbdId } from "../../../lib/jtbdData";
import type { TuningConceptProps } from "../types";

export const PROFILE_FIRST_CONCEPT = "profile-first";

const C = TUNING_CONCEPTS_COPY.profileFirst;

const PANEL_ID = "profile-first-panel";

// The same check-pop spring every other resolved row uses.
const popVariants: Variants = {
  hidden: { opacity: 0, scale: 0 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", stiffness: 500, damping: 14 } },
};

interface ProfileFirstConceptProps extends TuningConceptProps {
  /** The Plus country pick, when there is one — threaded to the preview
   * card's destination line, same as the Deck concept. */
  selectedCountry?: string | null;
}

function ClaimRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex w-full items-start gap-[8px]">
      <motion.img variants={popVariants} src={checkmarkUrl} alt="" className="mt-[1px] size-[20px] shrink-0" />
      <span
        className="font-['Segoe_UI_Variable',sans-serif] text-[16px] font-semibold leading-[22px] text-white"
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {children}
      </span>
    </div>
  );
}

/** Plus feature pill — the same container/padding as the free rows' setting
 * pills elsewhere, holding glyph + name + state instead of "label: value". */
function FeaturePill({ asset, name, tooltip }: { asset: string; name: string; tooltip?: string }) {
  return (
    <span className="flex shrink-0 items-center gap-[8px] whitespace-nowrap rounded-[8px] bg-[rgba(255,255,255,0.05)] px-[12px] pb-[7px] pt-[5px]">
      <img src={asset} alt="" className="size-[20px] shrink-0 object-contain" />
      <span
        className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]"
        style={{ fontFeatureSettings: '"rclt" 0' }}
      >
        {name}
      </span>
      <span
        className="font-['Segoe_UI_Variable',sans-serif] text-[14px] font-semibold leading-[20px] text-white"
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {C.featureValue}
      </span>
      <InfoTooltip content={tooltip} />
    </span>
  );
}

/** "Profile-first" — the Plus-only tuning concept.
 *
 * Where the other five profiles concepts have to answer "what does a Free
 * user get out of this screen", this one doesn't: it is registered Plus-only
 * (see `tuningConceptsForPlan` in `OnboardingV2.tsx`), so nothing on it is
 * ever locked, aspirational, or hedged. That single constraint is what buys
 * the layout its confidence — one profile at full size, with a photograph and
 * a real configuration, instead of a grid of tiles hedging about what a
 * shortcut might do once you pay.
 *
 * Three claims, in materialization order:
 *
 * 1. **The profiles themselves**, as a tabbed set with one shown in full.
 *    Their settings are not repeated as separate baseline rows — a profile
 *    CARRIES its settings here (`profileConfigRows`), which is what makes
 *    switching tabs a comparison rather than a filter.
 * 2. **Two standalone Plus features**, chosen so they can never duplicate
 *    anything the card configures — see `plusFeaturesFor`.
 *
 * The tabs and the card are one materializing row, not several: the profiles
 * are a single claim ("we built these for you"), and revealing tabs before
 * the card they control would show a control with nothing to control. */
export default function ProfileFirstConcept({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  tone = "straightforward",
  selectedCountry = null,
  onContinue,
  onBack,
}: ProfileFirstConceptProps) {
  const reduced = useReducedMotion();
  const data = useProfileFirstData(jtbdKey, selectionMode, selectedJtbds, tone, reduced);
  const { profiles, plusFeatureRows, profilesRowIndex, profilesRowLabel, rowStages, rowMounted } = data;

  const [picked, setPicked] = useState<JtbdId | null>(null);
  // Falls back rather than syncing state to props: a selection change
  // remounts this concept anyway, so there's nothing to reconcile.
  const activeJtbd = picked && profiles.some((p) => p.jtbd === picked) ? picked : profiles[0]!.jtbd;
  const activeProfile = profiles.find((p) => p.jtbd === activeJtbd)!;

  const profilesStage = rowStages[profilesRowIndex];

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILE_FIRST_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        bodyMaxWidthClassName="max-w-[860px]"
      >
        {rowMounted[profilesRowIndex] && profilesStage ? (
          <MaterializingSlot
            stage={profilesStage}
            reduced={reduced}
            className="w-full"
            phase1Content={
              // Roughly the resolved block's own height (claim + tabs +
              // card), so the Phase-1 → Phase-2 crossfade doesn't jump.
              <div className="flex min-h-[300px] w-full items-center justify-center rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[14px]">
                <PhaseOnePlaceholder narration={C.profilesNarration} arrangement="block" spinnerSize={20} />
              </div>
            }
            resolvedContent={
              <div className="flex w-full flex-col gap-[10px]">
                <ClaimRow>{profilesRowLabel}</ClaimRow>

                <ProfileTabs
                  profiles={profiles}
                  activeJtbd={activeJtbd}
                  onSelect={setPicked}
                  panelId={PANEL_ID}
                  reduced={reduced}
                  label={C.tabsLabel}
                />

                <div id={PANEL_ID} role="tabpanel" aria-labelledby={`${PANEL_ID}-tab-${activeJtbd}`}>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={activeJtbd}
                      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0.15 : 0.22, ease: "easeOut" }}
                    >
                      <ProfilePreviewCard profile={activeProfile} selectedCountry={selectedCountry} />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            }
          />
        ) : null}

        {/* The two Plus features that are NOT part of any profile's setup. */}
        {plusFeatureRows.map((row) => {
          const stage = rowStages[row.index];
          if (!rowMounted[row.index] || !stage) return null;
          return (
            <MaterializingSlot
              key={row.featureName}
              stage={stage}
              reduced={reduced}
              className="flex w-full items-start gap-[16px] py-[4px]"
              phase1Content={<PhaseOnePlaceholder narration={narrateEnabling(row.featureName)} />}
              resolvedContent={
                <div className="flex w-full items-center gap-[16px]">
                  <div className="min-w-0 flex-1">
                    <ClaimRow>{row.outcome}</ClaimRow>
                  </div>
                  <FeaturePill asset={row.asset} name={row.featureName} tooltip={row.tooltip} />
                </div>
              }
            />
          );
        })}
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
