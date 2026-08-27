import * as Tooltip from "@radix-ui/react-tooltip";
import ConceptFrame from "../ConceptFrame";
import { useProfilesConceptData } from "../../profiles/useProfilesConceptData";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import MaterializingSlot from "../../MaterializingSlot";
import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import SidebarDockIllustration, { type DockEntry } from "../../profiles/SidebarDockIllustration";
import BaselineCard from "./BaselineCard";
import ShelfCard from "./ShelfCard";
import { PERSISTENCE_CAPTION } from "../../profiles/profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { narrateChecking, narrateEnabling } from "../../copy";
import { effectiveProfileSettings } from "../../../lib/jtbdProfiles";
import type { ProfileCardSize } from "../../profiles/ProfileCard";
import type { TuningConceptProps } from "../types";

export const PROFILES_SHELF_CONCEPT = "profiles-shelf";

const C = TUNING_CONCEPTS_COPY.profilesShelf;

/** Adaptive density. Total cells is `1 + profileRows.length`, so 2 to 7.
 * Switching to three narrower columns past four cells keeps the shelf's
 * height stable across every selection count, at the cost of the per-card
 * settings chips (see `ShelfCard`). */
function densityFor(cells: number): { size: ProfileCardSize; cols: string } {
  return cells <= 4 ? { size: "card", cols: "grid-cols-2" } : { size: "tile", cols: "grid-cols-3" };
}

const MIN_H: Record<ProfileCardSize, string> = { tile: "min-h-[132px]", card: "min-h-[168px]", hero: "min-h-[200px]" };

/** Profiles concept #1 — "The Shelf".
 *
 * The tuning screen resolves into a shelf of named, ready-made setups laid
 * out as equals — and the first one on the shelf is the free user's own
 * protection, already switched on. Breadth-first: the whole set is visible
 * at a glance.
 *
 * Where the Baseline concept separates protection from shortcuts into two
 * visual registers, this one puts them in a single register as peers and
 * lets position and state carry the difference. That's also its main risk:
 * the baseline card has to win a hierarchy contest against up to six
 * same-sized neighbours, and one active card among six locked ones can read
 * as a value ratio however well it's placed.
 *
 * See docs/specs/profiles-tuning/01-shelf.md. */
export default function ProfilesShelfConcept({
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
  const { size, cols } = densityFor(1 + profileRows.length);

  const dockEntries: DockEntry[] = profileRows.map((row) => ({
    id: row.profile.jtbd,
    name: row.profile.name,
    icon: row.profile.icon,
    locked: !paidUnlocked,
  }));

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_SHELF_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        bodyMaxWidthClassName="max-w-[920px]"
      >
        <p className="w-full font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.6)]">
          {C.shelfIntro}
        </p>

        <div className={`grid w-full gap-[10px] ${cols}`}>
          {/* Always first, and — via the row schedule — always the first to
              materialize, so reading order and reveal order agree. */}
          <BaselineCard
            settingRows={settingRows}
            rowStages={rowStages}
            rowMounted={rowMounted}
            intentNames={intentNames}
            settled={settled}
            size={size}
            reduced={reduced}
          />

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
                  <div
                    className={`flex w-full flex-col rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[16px] ${MIN_H[size]}`}
                  >
                    <PhaseOnePlaceholder narration={narrateChecking(row.profile.name)} arrangement="block" />
                  </div>
                }
                resolvedContent={
                  <ShelfCard
                    profile={row.profile}
                    settings={effectiveProfileSettings(row.profile.jtbd, baselineSettings)}
                    unlocked={paidUnlocked}
                    size={size}
                  />
                }
              />
            );
          })}
        </div>

        <SidebarDockIllustration entries={dockEntries} caption={PERSISTENCE_CAPTION} />

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
                <span className="flex items-center justify-center gap-[8px] font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.45)]">
                  <img src={row.asset} alt="" className="size-[16px] shrink-0 opacity-50" />
                  {row.outcome}
                </span>
              }
            />
          );
        })}
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
