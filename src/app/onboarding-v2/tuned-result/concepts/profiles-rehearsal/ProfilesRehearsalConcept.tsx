import { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Play, Check } from "lucide-react";
import ConceptFrame from "../ConceptFrame";
import { useProfilesConceptData } from "../../profiles/useProfilesConceptData";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import MaterializingSlot from "../../MaterializingSlot";
import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import ProfileCard from "../../profiles/ProfileCard";
import SidebarDockIllustration, { type DockEntry } from "../../profiles/SidebarDockIllustration";
import RehearsalStage from "./RehearsalStage";
import { useRehearsal } from "./useRehearsal";
import { PERSISTENCE_CAPTION } from "../../profiles/profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import { narrateChecking } from "../../copy";
import { effectiveProfileSettings } from "../../../lib/jtbdProfiles";
import type { JtbdId } from "../../../lib/jtbdData";
import type { TuningConceptProps } from "../types";

export const PROFILES_REHEARSAL_CONCEPT = "profiles-rehearsal";

const C = TUNING_CONCEPTS_COPY.profilesRehearsal;

const TILE_BOX_CLASS =
  "flex min-h-[120px] w-full flex-col rounded-[12px] border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.03)] p-[14px]";

/** Profiles concept #5 — "The Rehearsal".
 *
 * A single persistent stage plus a row of profiles the user can rehearse.
 * Pressing one plays what it would do, then the stage RETURNS to the
 * protected baseline — every time, without exception. The return is the
 * concept: it converts "will I break something?" from a claim to be trusted
 * into a behaviour the user watches, repeatedly.
 *
 * This is the only concept in the family that lets a user act on the
 * combination instinct directly. "Rehearse everything" plays each selected
 * profile in turn and lands back on the baseline, which shows rather than
 * argues that the combined setup already exists and is what they return to.
 *
 * Free users rehearse freely — a rehearsal is a demonstration, not a
 * connection, so nothing is gated. What's gated is KEEPING one, which is
 * where the Plus badge sits.
 *
 * See docs/specs/profiles-tuning/05-rehearsal.md. */
export default function ProfilesRehearsalConcept({
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
  const { settingRows, profileRows, paidUnlocked, rowStages, rowMounted, intentNames, baselineSettings, rowsComplete } = data;

  const { rehearsing, phase, narrationShown, rehearsedIds, start, startAll } = useRehearsal(reduced);
  const [kept, setKept] = useState<Set<JtbdId>>(() => new Set());

  const settled = settingRows.every((r) => rowStages[r.index] === "resolved");
  const busy = rehearsing !== null;

  const toggleKeep = (jtbd: JtbdId) =>
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(jtbd)) next.delete(jtbd);
      else next.add(jtbd);
      return next;
    });

  const dockEntries: DockEntry[] = profileRows
    .filter((row) => kept.has(row.profile.jtbd))
    .map((row) => ({
      id: row.profile.jtbd,
      name: row.profile.name,
      icon: row.profile.icon,
      locked: !paidUnlocked,
    }));

  // While rehearsing, the header's "N of M settings" counter is stale and
  // slightly misleading — the stage is showing something else entirely. Swap
  // in what's actually happening instead.
  const subtextSlot = busy && rehearsing ? `Rehearsing ${rehearsing.name.toLowerCase()} — your protection comes back after.` : undefined;

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_REHEARSAL_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        subtextSlot={subtextSlot}
        bodyMaxWidthClassName="max-w-[840px]"
      >
        <RehearsalStage
          rehearsing={rehearsing}
          phase={phase}
          narrationShown={narrationShown}
          baselineSettings={baselineSettings}
          intentNames={intentNames}
          settled={settled}
          planAware={!paidUnlocked}
          reduced={reduced}
        />

        <div className="flex w-full flex-col gap-[10px]">
          <div className="flex items-baseline justify-between gap-[12px]">
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
              {C.tilesHeader}
            </span>

            {/* The direct answer to "why not one profile with all of them?" —
                play them all and land back on the combined baseline. */}
            {profileRows.length >= 2 && rowsComplete ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => startAll(profileRows.map((r) => r.profile))}
                className="shrink-0 rounded-[6px] px-[8px] py-[4px] font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-[rgba(255,255,255,0.7)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.06)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/30 disabled:opacity-40"
              >
                {C.rehearseAllLabel}
              </button>
            ) : null}
          </div>

          <div className={`grid w-full gap-[10px] ${profileRows.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
            {profileRows.map((row) => {
              const stage = rowStages[row.index];
              if (!rowMounted[row.index] || !stage) return null;

              const isRehearsing = rehearsing?.jtbd === row.profile.jtbd && phase !== "returning";
              const isKept = kept.has(row.profile.jtbd);
              const wasRehearsed = rehearsedIds.has(row.profile.jtbd);

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
                      state={isRehearsing ? "running" : paidUnlocked ? "active" : "locked"}
                      sentence="delta"
                      settings={effectiveProfileSettings(row.profile.jtbd, baselineSettings)}
                      planAware={!paidUnlocked}
                      className="min-h-[120px]"
                      footer={
                        <div className="mt-auto flex items-center gap-[6px] pt-[4px]">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => start(row.profile)}
                            className="flex items-center gap-[5px] rounded-[6px] bg-[rgba(255,255,255,0.08)] px-[10px] py-[5px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-white outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.14)] focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-40"
                          >
                            <Play size={11} strokeWidth={2.5} />
                            {wasRehearsed ? "Again" : "Try it"}
                          </button>

                          {/* Keeping is what carries a plan implication, not
                              rehearsing — so the badge sits here. */}
                          <button
                            type="button"
                            onClick={() => toggleKeep(row.profile.jtbd)}
                            aria-pressed={isKept}
                            className={`flex min-w-0 items-center gap-[5px] rounded-[6px] px-[8px] py-[5px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-white/40 ${
                              isKept
                                ? "bg-[rgba(44,255,204,0.15)] text-[rgba(44,255,204,0.95)]"
                                : "text-[rgba(255,255,255,0.6)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
                            }`}
                          >
                            {isKept ? <Check size={11} strokeWidth={3} /> : null}
                            <span className="truncate">{isKept ? "Kept" : "Keep"}</span>
                          </button>
                        </div>
                      }
                    />
                  }
                />
              );
            })}
          </div>

          {profileRows.length >= 2 ? (
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.5)]">
              {C.combinationNote}
            </span>
          ) : null}
        </div>

        {/* Shown only once something has been kept — an empty dock would
            invite the reading that nothing persists unless you act. */}
        {dockEntries.length > 0 ? (
          <SidebarDockIllustration entries={dockEntries} caption={PERSISTENCE_CAPTION} live />
        ) : (
          <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.55)]">
            {PERSISTENCE_CAPTION}
          </p>
        )}
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
