import * as Tooltip from "@radix-ui/react-tooltip";
import ConceptFrame from "../ConceptFrame";
import { useProfilesConceptData } from "../../profiles/useProfilesConceptData";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import MaterializingSlot from "../../MaterializingSlot";
import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import ProfileCard from "../../profiles/ProfileCard";
import ProtectionAnchor from "../../profiles/ProtectionAnchor";
import { NOT_A_CHOICE_LINE, PERSISTENCE_CAPTION } from "../../profiles/profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { narrateChecking, narrateEnabling } from "../../copy";
import { effectiveProfileSettings } from "../../../lib/jtbdProfiles";
import type { TuningConceptProps } from "../types";

export const PROFILES_BASELINE_CONCEPT = "profiles-baseline";

const C = TUNING_CONCEPTS_COPY.profilesBaseline;

const TILE_BOX_CLASS =
  "flex min-h-[132px] w-full flex-col rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[14px]";

/** Column count by profile count. One profile gets a half-width tile rather
 * than a stretched full-width one, which would read as a second anchor. */
function gridClassFor(count: number): string {
  if (count === 1) return "grid grid-cols-2";
  if (count === 2) return "grid grid-cols-2";
  return "grid grid-cols-3";
}

/** Profiles concept #4 — "Baseline + shortcuts".
 *
 * Two visually distinct registers: a compact, bright, already-on protection
 * anchor, and beneath it a majority-of-the-screen tier of optional
 * shortcuts. The layout itself says "you're covered either way", so the
 * reassurances are carried by information architecture rather than by copy a
 * user might skip.
 *
 * The free user's answer is architectural: the free outcome (the anchor)
 * owns the visual hierarchy while the Plus outcome (the tiles) owns the
 * square footage, so the eye lands on something that is theirs and working
 * rather than on a screen of locked content. No new entitlement needed.
 *
 * See docs/specs/profiles-tuning/04-baseline.md. */
export default function ProfilesBaselineConcept({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  tone = "straightforward",
  userPlan = "free",
  onContinue,
  onBack,
}: TuningConceptProps) {
  const reduced = useReducedMotion();
  const data = useProfilesConceptData(jtbdKey, selectionMode, selectedJtbds, tone, reduced, userPlan);
  const {
    settingRows,
    profileRows,
    plusFeatureRows,
    paidUnlocked,
    rowStages,
    rowMounted,
    intentNames,
    baselineSettings,
  } = data;

  const settled = settingRows.every((r) => rowStages[r.index] === "resolved");

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_BASELINE_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        bodyMaxWidthClassName="max-w-[880px]"
      >
        {/* Upper register — the free outcome, loudest element, first present. */}
        <ProtectionAnchor
          settingRows={settingRows}
          rowStages={rowStages}
          rowMounted={rowMounted}
          intentNames={intentNames}
          settled={settled}
          reduced={reduced}
        />

        {/* Lower register — optional shortcuts, deliberately lighter. */}
        <div className="flex w-full flex-col gap-[10px]">
          <div className="flex flex-col gap-[2px]">
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
              {C.shortcutsHeader}
            </span>
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.55)]">
              {NOT_A_CHOICE_LINE}
            </span>
          </div>

          <div className={`${gridClassFor(profileRows.length)} w-full gap-[10px]`}>
            {profileRows.map((row) => {
              const stage = rowStages[row.index];
              if (!rowMounted[row.index] || !stage) return null;
              return (
                <MaterializingSlot
                  key={row.index}
                  stage={stage}
                  reduced={reduced}
                  className="w-full"
                  phase1Content={
                    <div className={TILE_BOX_CLASS}>
                      <PhaseOnePlaceholder narration={narrateChecking(row.profile.name)} arrangement="block" />
                    </div>
                  }
                  resolvedContent={
                    <ProfileCard
                      profile={row.profile}
                      size="tile"
                      state={paidUnlocked ? "active" : "locked"}
                      sentence="delta"
                      showComposition
                      settings={effectiveProfileSettings(row.profile.jtbd, baselineSettings)}
                      planAware={!paidUnlocked}
                      className="min-h-[132px]"
                    />
                  }
                />
              );
            })}
          </div>
        </div>

        {/* One muted line, never a section — profiles are the subject here. */}
        {plusFeatureRows.map((row) => {
          const stage = rowStages[row.index];
          if (!rowMounted[row.index] || !stage) return null;
          return (
            <MaterializingSlot
              key={row.index}
              stage={stage}
              reduced={reduced}
              className="w-full"
              phase1Content={<PhaseOnePlaceholder narration={narrateEnabling(row.featureName)} />}
              resolvedContent={
                <span className="flex items-center gap-[8px] font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.45)]">
                  <img src={row.asset} alt="" className="size-[16px] shrink-0 opacity-50" />
                  {C.plusFeatureLine(row.featureName)}
                </span>
              }
            />
          );
        })}

        <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.55)]">
          {PERSISTENCE_CAPTION}
        </p>
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
