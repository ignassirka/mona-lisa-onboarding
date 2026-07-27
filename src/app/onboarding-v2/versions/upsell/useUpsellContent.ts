import { JTBD_TUNING_RESULT, type JTBDKey } from "../../lib/jtbdTuningResult";
import {
  JTBD_UPSELL,
  UPSELL_PRICING,
  UPSELL_EVERYTHING_ELSE,
  UPSELL_TRUST_SIGNALS,
  UPSELL_MULTIPLE_HIGHLIGHT_CAP,
  upsellSubtitleMultiple,
  type UpsellBenefit,
} from "../../lib/jtbdUpsell";
import { mergeFreeSettings, rankFreeSettings, mergePaidFeatures, rankPaidFeatures, capList } from "../../lib/jtbdMerge";
import { TUNED_RESULT_TIMING } from "../../tuned-result/timing";
import type { SelectionMode } from "../../lib/jtbdData";
import sparkleUrl from "../../assets/upsell-sparkle.svg";

export interface UpsellBenefitView extends UpsellBenefit {
  /** Decorative icon for this benefit — the matching Plus feature's own
   * asset when one exists, else the shared sparkle placeholder (the SAME
   * fallback `VPNPlusUpsell.tsx` already uses for every benefit row, not a
   * new asset). */
  icon: string;
}

export interface FreeItemView {
  outcome: string;
  settingsName: string;
  value: string;
  tooltip?: string;
}

export interface PaidItemView {
  outcome: string;
  featureName: string;
  asset: string;
  tooltip?: string;
}

export interface UpsellSubtitleInfo {
  isMultiple: boolean;
  /** Single mode only — the word/phrase bolded inline in "Based on your
   * ___ pick" (`JTBD_UPSELL[jtbdKey].jtbdWord`). */
  jtbdWord?: string;
  /** Multiple mode only — the full "Based on your {count} picks…" sentence
   * (`upsellSubtitleMultiple`). */
  text?: string;
}

export interface UpsellContent {
  isMultipleActive: boolean;
  isStreaming: boolean;
  subtitle: UpsellSubtitleInfo;
  /** Same ranked/capped highlight set the default upsell screen shows —
   * single mode's 3 hand-curated `JTBD_UPSELL` benefits, or (2+ picks) the
   * top `UPSELL_MULTIPLE_HIGHLIGHT_CAP` of the shared ranked paid union —
   * byte-for-byte the same resolution `VPNPlusUpsell.tsx` already uses. */
  benefits: UpsellBenefitView[];
  /** Free-tier settings already active — for the comparison-table layout.
   * Single mode: the JTBD's own 3 `enabled` rows. Multiple mode: the
   * shared merged/ranked free union, capped at the SAME `freeRowCap` the
   * Tuned Result screen already uses for this list (no new cap invented). */
  freeItems: FreeItemView[];
  /** The Plus features being highlighted — for the comparison table's
   * "Plus" column. Single mode: the JTBD's own 2 `paid` features. Multiple
   * mode: the same ranked paid union used for `benefits`, at the SAME
   * `UPSELL_MULTIPLE_HIGHLIGHT_CAP` (the upsell's own established cap). */
  paidItems: PaidItemView[];
  everythingElse: string;
  trustSignals: typeof UPSELL_TRUST_SIGNALS;
  pricing: typeof UPSELL_PRICING;
}

/** Shared content-resolution hook for the 5 alternative upsell layouts.
 * Mirrors `VPNPlusUpsell.tsx`'s own inline resolution (lines 141-164)
 * exactly — that component is left fully untouched as the default option —
 * so every alternative draws from the EXACT same intent-driven ranked
 * feature engine, honesty rules, and pricing as the original. No new
 * ranking, no new caps beyond ones already established elsewhere in the
 * codebase (`UPSELL_MULTIPLE_HIGHLIGHT_CAP`, `TUNED_RESULT_TIMING.freeRowCap`). */
export function useUpsellContent(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode = "single",
  selectedJtbds?: JTBDKey[],
): UpsellContent {
  const upsell = JTBD_UPSELL[jtbdKey];
  const tuningResult = JTBD_TUNING_RESULT[jtbdKey];
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;

  const isStreaming = isMultipleActive ? (selectedJtbds?.includes("streaming") ?? false) : jtbdKey === "streaming";

  const subtitle: UpsellSubtitleInfo = isMultipleActive
    ? { isMultiple: true, text: upsellSubtitleMultiple(selectedJtbds!.length) }
    : { isMultiple: false, jtbdWord: upsell.jtbdWord };

  // Single source for the ranked paid union — feeds BOTH `benefits` and
  // `paidItems` so the two never disagree on order or cap.
  const cappedPaid = isMultipleActive
    ? capList(rankPaidFeatures(mergePaidFeatures(selectedJtbds!)), UPSELL_MULTIPLE_HIGHLIGHT_CAP)
    : null;

  const benefits: UpsellBenefitView[] = isMultipleActive
    ? cappedPaid!.displayed.map((f) => ({
        outcome: f.outcome,
        featureName: f.featureName,
        learnMore: true,
        tooltip: f.tooltip,
        icon: f.asset,
      }))
    : upsell.benefits.map((b) => ({
        ...b,
        icon: tuningResult.paid.find((p) => p.featureName === b.featureName)?.asset ?? sparkleUrl,
      }));

  const freeItems: FreeItemView[] = isMultipleActive
    ? capList(rankFreeSettings(mergeFreeSettings(selectedJtbds!)), TUNED_RESULT_TIMING.freeRowCap).displayed.map((f) => ({
        outcome: f.outcome,
        settingsName: f.settingsName,
        value: f.value,
        tooltip: f.tooltip,
      }))
    : tuningResult.enabled.map((f) => ({ outcome: f.outcome, settingsName: f.settingsName, value: f.value, tooltip: f.tooltip }));

  const paidItems: PaidItemView[] = isMultipleActive
    ? cappedPaid!.displayed.map((f) => ({ outcome: f.outcome, featureName: f.featureName, asset: f.asset, tooltip: f.tooltip }))
    : tuningResult.paid.map((f) => ({ outcome: f.outcome, featureName: f.featureName, asset: f.asset, tooltip: f.tooltip }));

  return {
    isMultipleActive,
    isStreaming,
    subtitle,
    benefits,
    freeItems,
    paidItems,
    everythingElse: UPSELL_EVERYTHING_ELSE,
    trustSignals: UPSELL_TRUST_SIGNALS,
    pricing: UPSELL_PRICING,
  };
}
