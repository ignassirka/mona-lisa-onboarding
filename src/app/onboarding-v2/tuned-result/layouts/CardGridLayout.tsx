import EnabledFeatureRow from "../../components/EnabledFeatureRow";
import PaidFeatureRow from "../../components/PaidFeatureRow";
import MaterializingSlot from "../MaterializingSlot";
import PhaseOnePlaceholder from "../PhaseOnePlaceholder";
import TransformingPaidCell from "../TransformingPaidCell";
import { narrateEnabling, narrateChecking } from "../copy";
import { toneOutcome } from "../../lib/jtbdTuningToneCopy";
import type { ToneOfVoice } from "../../lib/toneOfVoice";
import type { RowStage } from "../useTunedMaterialization";
import type { JTBDTuningResult } from "../../lib/jtbdTuningResult";

interface CardGridLayoutProps {
  result: JTBDTuningResult;
  paidUnlocked: boolean;
  rowStages: RowStage[];
  rowMounted: boolean[];
  reduced: boolean;
  /** Tone of voice for the outcome sentences — settings names/values/feature
   * names/asset stay unchanged regardless of tone. */
  tone: ToneOfVoice;
  /** Stage 3 only — see `StackedLayout`'s doc for the exact contract. */
  unlockTransition?: { unlocked: boolean; showChip: boolean };
}

// Matches `EnabledFeatureRow`/`PaidFeatureRow`'s own `layout="card"` outer
// classes exactly, so the Phase-1 placeholder is the same shape as the
// Phase-2 resolved card it crossfades into.
const FREE_CARD_CLASS = "relative flex h-full flex-col rounded-[12px] bg-[rgba(255,255,255,0.05)] p-[14px]";
const PAID_CARD_CLASS = "relative flex h-full flex-col rounded-[12px] border border-[rgba(255,255,255,0.1)] p-[14px] shadow-[0px_4px_4px_0px_rgba(0,0,0,0.25)]";

/** "Card Grid" — 3 applied cards on top, 2 wider locked cards below (each
 * card ~1.5× an applied card's width, since two independent equal-width CSS
 * grid rows share one container width). Materializes in reading order — the
 * 3 applied cards first (top row, left→right), then the 2 locked cards
 * (bottom row) — the same underlying 0..4 order the shared hook drives; the
 * row separation itself stands in for a divider, so no separate boundary
 * widget is rendered here (unlike Stacked/Compact List/Split by Status). */
export default function CardGridLayout({ result, paidUnlocked, rowStages, rowMounted, reduced, tone, unlockTransition }: CardGridLayoutProps) {
  const renderEnabledCard = (i: number) => {
    const feature = result.enabled[i];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    const toneFeature = { ...feature, outcome: toneOutcome(tone, result.jtbdKey, "enabled", i) };
    return (
      <MaterializingSlot
        key={`enabled-${i}`}
        stage={stage}
        reduced={reduced}
        className="h-full"
        phase1Content={<div className={FREE_CARD_CLASS}><PhaseOnePlaceholder narration={narrateEnabling(feature.settingsName)} arrangement="block" /></div>}
        resolvedContent={<EnabledFeatureRow feature={toneFeature} layout="card" />}
      />
    );
  };

  const renderPaidCard = (pIdx: number) => {
    const i = result.enabled.length + pIdx;
    const feature = result.paid[pIdx];
    const stage = rowStages[i];
    if (!rowMounted[i] || !stage) return null;
    const narration = paidUnlocked ? narrateEnabling(feature.featureName) : narrateChecking(feature.featureName);
    const toneFeature = { ...feature, outcome: toneOutcome(tone, result.jtbdKey, "paid", pIdx) };

    if (unlockTransition) {
      return (
        <MaterializingSlot
          key={`paid-${i}`}
          stage={stage}
          reduced={reduced}
          className="h-full"
          phase1Content={null}
          resolvedContent={
            <TransformingPaidCell
              feature={toneFeature}
              unlocked={unlockTransition.unlocked}
              showChip={unlockTransition.showChip}
              index={pIdx}
              layout="card"
            />
          }
        />
      );
    }

    return (
      <MaterializingSlot
        key={`paid-${i}`}
        stage={stage}
        reduced={reduced}
        className="h-full"
        phase1Content={<div className={PAID_CARD_CLASS}><PhaseOnePlaceholder narration={narration} arrangement="block" /></div>}
        resolvedContent={<PaidFeatureRow feature={toneFeature} unlocked={paidUnlocked} layout="card" />}
      />
    );
  };

  return (
    <div className="flex w-full max-w-[820px] flex-col gap-[16px]">
      {/* Applied — 3 equal cards. Wide: 3 cols. Medium (@max-900px): 2 cols
          (flows 2+1). Narrow (@max-560px): 1 col. */}
      <div className="grid grid-cols-3 gap-[16px] @max-[900px]:grid-cols-2 @max-[560px]:grid-cols-1">
        {result.enabled.map((_, i) => renderEnabledCard(i))}
      </div>

      {/* Locked — 2 equal cards spanning the same total width. Narrow: 1
          col, same order (applied before locked). */}
      <div className="grid grid-cols-2 gap-[16px] @max-[560px]:grid-cols-1">{result.paid.map((_, i) => renderPaidCard(i))}</div>
    </div>
  );
}
