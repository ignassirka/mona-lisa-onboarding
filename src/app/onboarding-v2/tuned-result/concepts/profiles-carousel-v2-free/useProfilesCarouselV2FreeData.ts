import { JTBD_TUNING_RESULT, type JTBDKey } from "../../../lib/jtbdTuningResult";
import {
  mergeFreeSettings,
  rankFreeSettings,
  capList,
  outcomeForEnabled,
  type TuningResultLike,
} from "../../../lib/jtbdMerge";
import { profilesForSelection, type ProfileSetting, type TunedProfile } from "../../../lib/jtbdProfiles";
import { useTunedMaterialization, type RowStage } from "../../useTunedMaterialization";
import { TUNED_RESULT_TIMING as T } from "../../timing";
import {
  titleDuring,
  titleComplete,
  titleDuringMultiple,
  titleCompleteMultiple,
  introSubtext,
  counterSubtext,
  summarySubtext,
  summarySubtextMultiple,
} from "../../copy";
import type { SelectionMode } from "../../../lib/jtbdData";
import type { ToneOfVoice } from "../../../lib/toneOfVoice";
import type { ConceptFrameData } from "../types";

export interface FreeSettingRow {
  index: number;
  setting: ProfileSetting;
  /** Tone-voiced outcome sentence — the row's left-hand claim. */
  outcome: string;
}

export interface ProfilesCarouselV2FreeData extends ConceptFrameData {
  /** The tuned baseline, and the only thing on this screen a Free run
   * actually owns. Single mode: that intent's own 2. Multiple: the merged,
   * ranked, capped union, so a merged value is always the STRICTEST of its
   * contributors. */
  settingRows: FreeSettingRow[];
  /** One per selected intent, in selection order. */
  profiles: TunedProfile[];
  /** Schedule index of the profiles BLOCK — one row for every card, not one
   * row each. See the note on `totalRows` below. */
  profilesIndex: number;

  rowStages: RowStage[];
  rowMounted: boolean[];
  boundaryVisible: boolean;
}

/** Content resolution for the Free-only "Profiles carousel v2".
 *
 * Unlike v1's and v2's own hooks, this one **delegates to the shared
 * `useTunedMaterialization`** rather than owning a bespoke scheduling effect.
 * Those two had to fork because a carousel where every card gets its own
 * narrated 3000ms cycle has a total duration of `cards × 3000ms`, which the
 * shared hook's fixed-per-row formula can't express. Here the cards arrive as
 * a single group, so the schedule is just three fixed-duration rows and the
 * shared hook expresses it exactly — which is the cheaper answer and keeps
 * this screen's pacing identical to every settings-first concept's.
 *
 * The schedule, and the reason it's shaped this way:
 *
 * 1. `settingRows` (indices `0..s-1`) — the free settings, one at a time.
 *    This is where the "personalization illusion" lands on a Free run, and it
 *    has to, because these two settings are the only claim on this screen the
 *    run can actually back up.
 * 2. The boundary, at `boundaryIndex = s`. Restored deliberately: v2 pushes it
 *    past the end (nothing on a Plus run is locked, so a pause with no visible
 *    cause would be a beat for nothing), whereas here it's the exact moment
 *    the screen stops describing what happened and starts describing what
 *    Plus would add.
 * 3. The profiles block, as ONE row (`profilesIndex`). Six rows of narrated
 *    per-card labor would be twelve seconds spent building things this user
 *    can't use, and "Personalizing your Gaming profile…" is a sentence a Free
 *    run has no right to. One placeholder, then all the cards together.
 *
 * Everything else is the shared engine untouched: the same
 * `mergeFreeSettings → rankFreeSettings → capList` pipeline, the same tone
 * helpers, `useTunedMaterialization` called exactly once. */
export function useProfilesCarouselV2FreeData(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode,
  selectedJtbds: JTBDKey[] | undefined,
  tone: ToneOfVoice,
  reduced: boolean,
): ProfilesCarouselV2FreeData {
  const single = JTBD_TUNING_RESULT[jtbdKey];
  const isMultipleActive = selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2;
  const effectiveSelection: JTBDKey[] = isMultipleActive ? selectedJtbds! : [jtbdKey];

  // ── The free baseline ──────────────────────────────────────────────────
  const freeCapped = isMultipleActive
    ? capList(rankFreeSettings(mergeFreeSettings(selectedJtbds!)), T.freeRowCap).displayed
    : single.enabled.slice();

  // `outcomeForEnabled` needs a result-shaped object for its single-mode tone
  // lookup, which keys off `jtbdKey` + row index.
  const result: TuningResultLike = {
    jtbdKey: single.jtbdKey,
    jtbdLabel: single.jtbdLabel,
    enabled: freeCapped,
    paid: [],
    tip: null,
  };

  const settingRows: FreeSettingRow[] = freeCapped.map((feature, i) => ({
    index: i,
    setting: { label: feature.settingsName, value: feature.value, tooltip: feature.tooltip },
    outcome: outcomeForEnabled(tone, result, i, feature),
  }));

  // ── The profiles, as one block ─────────────────────────────────────────
  const profiles = profilesForSelection(effectiveSelection);
  const profilesIndex = settingRows.length;

  const totalRows = settingRows.length + 1;

  const { introDone, rowStages, rowMounted, boundaryVisible, appliedSoFar, rowsComplete, continueDelayMs } =
    useTunedMaterialization({
      jtbdKey: effectiveSelection.join(","),
      totalRows,
      boundaryIndex: profilesIndex,
      reduced,
    });

  const settingCount = settingRows.length;

  return {
    settingRows,
    profiles,
    profilesIndex,

    rowStages,
    rowMounted,
    boundaryVisible,

    introDone,
    rowsComplete,
    appliedSoFar,
    totalRows,
    isMultipleActive,
    continueDelayMs,
    selectionCount: effectiveSelection.length,

    titleDuringText: isMultipleActive
      ? titleDuringMultiple(tone, effectiveSelection.length)
      : titleDuring(tone, single.jtbdLabel),
    titleCompleteText: isMultipleActive
      ? titleCompleteMultiple(tone, effectiveSelection.length)
      : titleComplete(tone, single.jtbdLabel),
    introText: introSubtext(tone),
    // Counts describe what's on screen, never a literal — and the counter
    // counts SETTINGS, so it's clamped to the setting rows rather than to
    // `totalRows`. Without the clamp it would read "Applying 3 of 3 settings"
    // while the third row is a block of profiles that aren't settings and
    // aren't being applied.
    counterText: (applied: number) => counterSubtext(Math.min(applied, settingCount), settingCount),
    summaryText: isMultipleActive
      ? summarySubtextMultiple(tone, settingCount, profiles.length)
      : summarySubtext(tone, settingCount, profiles.length),
  };
}
