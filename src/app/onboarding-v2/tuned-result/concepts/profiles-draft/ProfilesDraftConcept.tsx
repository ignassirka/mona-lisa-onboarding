import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "motion/react";
import { Combine } from "lucide-react";
import ConceptFrame from "../ConceptFrame";
import { useProfilesConceptData } from "../../profiles/useProfilesConceptData";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import MaterializingSlot from "../../MaterializingSlot";
import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import ProtectionAnchor from "../../profiles/ProtectionAnchor";
import SidebarDockIllustration, { type DockEntry } from "../../profiles/SidebarDockIllustration";
import DraftRow from "./DraftRow";
import { useDrafts } from "./useDrafts";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { narrateChecking, narrateEnabling } from "../../copy";
import { TUNED_RESULT_TIMING as T, sec } from "../../timing";
import type { TuningConceptProps } from "../types";

export const PROFILES_DRAFT_CONCEPT = "profiles-draft";

const C = TUNING_CONCEPTS_COPY.profilesDraft;

/** The free-tier quota. **This is an unsettled product decision**, not a
 * settled entitlement, and it deliberately contradicts today's behaviour
 * (where generated profiles land in the sidebar disabled on Free).
 *
 * The proposal it encodes: a Free user keeps ONE profile of their choosing,
 * fully working, that they named themselves — a real usable artifact rather
 * than a description, and an upgrade moment that arrives from the user's own
 * intent when they want a second. If the quota is rejected, this becomes
 * `null` on Free too and the free payoff shrinks to the pinned protection
 * block plus the authorship itself, which is a materially weaker screen.
 * See docs/specs/profiles-tuning/03-draft.md §9. */
const FREE_PROFILE_QUOTA = 1;

const ROW_BOX_CLASS =
  "flex w-full items-center gap-[10px] rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] px-[12px] py-[10px]";

/** Profiles concept #3 — "The Draft".
 *
 * The tuning screen produces a proposal, not a verdict. The user sees the
 * setups the app drafted for them, renames them, drops the ones they don't
 * want, combines the ones they'd rather have as one, and watches their
 * sidebar assemble itself as they go.
 *
 * The only concept that hands over authorship, and the only one where "why
 * don't I have one profile with all of them?" is answered by simply letting
 * the user do it. Its cost is engagement: understanding here comes from
 * editing, so a user who wants to click Continue and leave learns less on
 * this screen than on any of the other four.
 *
 * See docs/specs/profiles-tuning/03-draft.md. */
export default function ProfilesDraftConcept({
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
    rowsComplete,
  } = data;

  const quota = paidUnlocked ? null : FREE_PROFILE_QUOTA;
  const { drafts, selectedIds, toggleIncluded, toggleSelected, rename, combine, split, keptCount, isQuotaBlocked } =
    useDrafts(profileRows.map((r) => r.profile), baselineSettings, quota);

  const settled = settingRows.every((r) => rowStages[r.index] === "resolved");

  // A draft row only appears once its own profile row has materialized, so
  // the sidebar preview assembles itself in front of the user before they
  // touch anything — which teaches the mechanic without instruction.
  const arrivedIds = new Set(
    profileRows.filter((r) => rowStages[r.index] === "resolved").map((r) => r.profile.jtbd as string),
  );
  const visibleDrafts = drafts.filter((d) => d.jtbds.some((j) => arrivedIds.has(j)));

  const entries: DockEntry[] = visibleDrafts
    .filter((d) => d.included)
    .map((d) => ({ id: d.id, name: d.name, icon: d.icon, locked: !paidUnlocked }));

  const canCombine = rowsComplete && selectedIds.size >= 2;

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_DRAFT_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        bodyMaxWidthClassName="max-w-[920px]"
      >
        <div className="flex w-full items-start gap-[16px]">
          {/* Left — the drafts. */}
          <div className="flex min-w-0 flex-[3] flex-col gap-[10px]">
            <ProtectionAnchor
              settingRows={settingRows}
              rowStages={rowStages}
              rowMounted={rowMounted}
              intentNames={intentNames}
              settled={settled}
              reduced={reduced}
              note={C.protectionPinnedNote}
              alwaysShowSettings
            />

            <div className="flex items-baseline justify-between gap-[10px]">
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
                {C.draftsHeader}
              </span>

              <AnimatePresence initial={false}>
                {canCombine ? (
                  <motion.button
                    key="combine"
                    type="button"
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: sec(T.resolveDuration) }}
                    onClick={() => combine([...selectedIds])}
                    className="flex shrink-0 items-center gap-[5px] rounded-[6px] bg-[rgba(109,74,255,0.25)] px-[10px] py-[5px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-white outline-none transition-colors duration-150 hover:bg-[rgba(109,74,255,0.4)] focus-visible:ring-1 focus-visible:ring-white/40"
                  >
                    <Combine size={12} strokeWidth={2} />
                    {C.combineLabel}
                  </motion.button>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Rows still materializing show the shared placeholder; rows
                whose profile has arrived become editable drafts. */}
            <div className="flex w-full flex-col gap-[8px]">
              <AnimatePresence initial={false}>
                {visibleDrafts.map((draft) => (
                  <motion.div
                    key={draft.id}
                    layout={!reduced}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                    transition={{ duration: sec(T.resolveDuration) }}
                  >
                    <DraftRow
                      draft={draft}
                      selected={selectedIds.has(draft.id)}
                      interactive={rowsComplete}
                      quotaBlocked={isQuotaBlocked(draft.id)}
                      onToggleIncluded={() => toggleIncluded(draft.id)}
                      onToggleSelected={() => toggleSelected(draft.id)}
                      onRename={(name) => rename(draft.id, name)}
                      onSplit={() => split(draft.id)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>

              {profileRows.map((row) => {
                const stage = rowStages[row.index];
                if (!rowMounted[row.index] || stage !== "spinner") return null;
                return (
                  <MaterializingSlot
                    key={row.index}
                    stage={stage}
                    reduced={reduced}
                    className="w-full"
                    phase1Content={
                      <div className={ROW_BOX_CLASS}>
                        <PhaseOnePlaceholder narration={narrateChecking(row.profile.name)} />
                      </div>
                    }
                    resolvedContent={null}
                  />
                );
              })}
            </div>

            {quota !== null ? (
              <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.45)]">
                {C.quotaNote(quota)}
                {keptCount > quota ? ` You've kept ${keptCount}.` : ""}
              </span>
            ) : null}
          </div>

          {/* Right — the live sidebar preview. */}
          <div className="flex min-w-0 flex-[2] flex-col gap-[10px]">
            <SidebarDockIllustration
              entries={entries}
              caption={C.previewCaption}
              live
              /* A user who unchecks everything must be told they're still
                 protected, not shown an empty state implying they broke
                 something. */
              emptyLabel={C.emptyPreview}
            />
          </div>
        </div>

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
