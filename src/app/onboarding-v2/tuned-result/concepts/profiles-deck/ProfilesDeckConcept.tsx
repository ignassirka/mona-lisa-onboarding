import { useState } from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ConceptFrame from "../ConceptFrame";
import { useProfilesConceptData } from "../../profiles/useProfilesConceptData";
import { useReducedMotion } from "../../../versions/lib/useReducedMotion";
import PhaseOnePlaceholder from "../../PhaseOnePlaceholder";
import MaterializingSlot from "../../MaterializingSlot";
import DeckCard from "./DeckCard";
import DeckPager, { type PagerItem } from "./DeckPager";
import { comparisonRows } from "./comparisonRows";
import { PERSISTENCE_CAPTION } from "../../profiles/profilesCopy";
import { TUNING_CONCEPT_TIMING as CT, sec } from "../../timing";
import { narrateEnabling } from "../../copy";
import type { JtbdId } from "../../../lib/jtbdData";
import type { TunedProfile } from "../../../lib/jtbdProfiles";
import type { TuningConceptProps } from "../types";

export const PROFILES_DECK_CONCEPT = "profiles-deck";

interface ProfilesDeckConceptProps extends TuningConceptProps {
  /** The Plus country pick, when there is one — the "Now" column's
   * destination. Free runs resolve everything to the fastest country, so
   * `null` is correct there. */
  selectedCountry?: string | null;
}

/** Profiles concept #2 — "The Deck".
 *
 * One setup at a time, big enough to be understood completely, with a
 * before-and-after of exactly what it changes. Depth-first where the Shelf
 * is breadth-first: the user meets one profile at a time and can't mistake
 * what it is, because the screen is doing nothing else.
 *
 * The settings stop being an outcome and become the "Now" column — they get
 * a job rather than a slot, and every card silently restates that the
 * baseline exists and is applied.
 *
 * TWO EXTERNAL DEPENDENCIES, neither settled — this is built as a prototype
 * demonstration, and "Try it now" here marks the card as tried rather than
 * actually applying and reverting anything:
 *   1. Product: whether one-time application of a profile is offered free at
 *      all. If not, this degrades to a deck of locked cards, which isn't a
 *      valid free-user outcome by the brief's own standard.
 *   2. Technical: whether settings can be applied and cleanly reverted
 *      within a session. `useConnectionAttempt` has no notion of a temporary
 *      settings change today.
 *
 * See docs/specs/profiles-tuning/02-deck.md §9. */
export default function ProfilesDeckConcept({
  jtbdKey,
  selectionMode = "single",
  selectedJtbds,
  tone = "straightforward",
  userPlan = "free",
  selectedCountry = null,
  onContinue,
  onBack,
}: ProfilesDeckConceptProps) {
  const reduced = useReducedMotion();
  const data = useProfilesConceptData(jtbdKey, selectionMode, selectedJtbds, tone, reduced, userPlan);
  const { settingRows, profileRows, plusFeatureRows, paidUnlocked, rowStages, rowMounted, baselineSettings, rowsComplete } = data;

  const [current, setCurrent] = useState(0);
  const [tried, setTried] = useState<Set<JtbdId>>(() => new Set());
  const [kept, setKept] = useState<Set<JtbdId>>(() => new Set());

  const baselineDestinationLabel = selectedCountry ?? "Fastest country";

  // Cards materialize in the shared schedule's order, and the trailing
  // baseline card only joins once every profile has arrived.
  const arrivedProfiles = profileRows.filter((row) => rowStages[row.index] === "resolved");
  const deck: (TunedProfile | null)[] = [...arrivedProfiles.map((r) => r.profile), ...(rowsComplete ? [null] : [])];

  const resolvedSettingCount = settingRows.filter((r) => rowStages[r.index] === "resolved").length;
  const firstCardBuilding = arrivedProfiles.length === 0;

  const safeCurrent = Math.min(current, Math.max(0, deck.length - 1));
  const focused = deck[safeCurrent] ?? null;

  const pagerItems: PagerItem[] = deck.map((profile) => ({
    id: profile?.jtbd ?? "baseline",
    icon: profile?.icon ?? null,
    label: profile?.name ?? "Everything at once",
  }));

  const toggle = (set: Set<JtbdId>, jtbd: JtbdId) => {
    const next = new Set(set);
    if (next.has(jtbd)) next.delete(jtbd);
    else next.add(jtbd);
    return next;
  };

  const move = (delta: number) => setCurrent((c) => Math.min(Math.max(0, c + delta), deck.length - 1));

  return (
    <Tooltip.Provider delayDuration={200}>
      <ConceptFrame
        concept={PROFILES_DECK_CONCEPT}
        jtbdKey={jtbdKey}
        selectionMode={selectionMode}
        selectedJtbds={selectedJtbds}
        data={data}
        reduced={reduced}
        onBack={onBack}
        onContinue={onContinue}
        bodyMaxWidthClassName="max-w-[900px]"
      >
        <div
          className="flex w-full flex-col items-center gap-[14px]"
          tabIndex={0}
          role="group"
          aria-label="Profile deck"
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") {
              e.preventDefault();
              move(1);
            } else if (e.key === "ArrowLeft") {
              e.preventDefault();
              move(-1);
            }
          }}
        >
          <div className="flex w-full items-center gap-[10px]">
            <button
              type="button"
              onClick={() => move(-1)}
              disabled={safeCurrent === 0}
              aria-label="Previous setup"
              className="flex size-[32px] shrink-0 items-center justify-center rounded-full text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-25"
            >
              <ChevronLeft size={18} strokeWidth={2} />
            </button>

            <div className="flex min-w-0 flex-1 justify-center">
              <div className="w-full max-w-[560px]">
                {/* While the first card is still assembling, the "Now"
                    column builds row by row through the shared schedule. */}
                {firstCardBuilding ? (
                  <div className="flex min-h-[300px] w-full flex-col items-center justify-center rounded-[14px] border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] p-[20px]">
                    <PhaseOnePlaceholder
                      narration={
                        resolvedSettingCount < settingRows.length
                          ? narrateEnabling(settingRows[resolvedSettingCount]?.setting.label ?? "your settings")
                          : "Building your first setup…"
                      }
                      arrangement="block"
                    />
                  </div>
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={focused?.jtbd ?? "baseline"}
                      initial={reduced ? { opacity: 0 } : { opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={reduced ? { opacity: 0 } : { opacity: 0, x: -24, transition: { duration: 0.15 } }}
                      transition={{ duration: reduced ? 0.2 : sec(CT.deckSlideMs) }}
                    >
                      <DeckCard
                        profile={focused}
                        rows={comparisonRows(focused, baselineSettings, baselineDestinationLabel)}
                        unlocked={paidUnlocked}
                        tried={focused ? tried.has(focused.jtbd) : false}
                        kept={focused ? kept.has(focused.jtbd) : false}
                        interactive={rowsComplete}
                        onTry={() => focused && setTried((s) => toggle(s, focused.jtbd))}
                        onKeep={() => focused && setKept((s) => toggle(s, focused.jtbd))}
                        reduced={reduced}
                      />
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => move(1)}
              disabled={safeCurrent >= deck.length - 1}
              aria-label="Next setup"
              className="flex size-[32px] shrink-0 items-center justify-center rounded-full text-[rgba(255,255,255,0.6)] outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.08)] hover:text-white focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-25"
            >
              <ChevronRight size={18} strokeWidth={2} />
            </button>
          </div>

          {pagerItems.length > 1 ? (
            <DeckPager items={pagerItems} current={safeCurrent} onSelect={setCurrent} />
          ) : null}
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

        <p className="text-center font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.55)]">
          {PERSISTENCE_CAPTION}
        </p>
      </ConceptFrame>
    </Tooltip.Provider>
  );
}
