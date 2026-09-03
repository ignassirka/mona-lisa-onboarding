import { useCallback, useMemo, useState } from "react";
import { mergeFreeSettings } from "../../../lib/jtbdMerge";
import {
  effectiveProfileSettings,
  strictestOf,
  JTBD_PROFILES,
  type ProfileSetting,
  type TunedProfile,
} from "../../../lib/jtbdProfiles";
import type { JtbdId, ProfileId } from "../../../lib/jtbdData";
import { PROFILES_FOR_JTBD } from "../../../lib/jtbdData";

export interface DraftProfile {
  /** Stable across edits — source intents joined, so a combination's id is
   * derivable from its parts and splitting is reversible. */
  id: string;
  /** Source intents. Length > 1 once combined. */
  jtbds: JtbdId[];
  /** User-editable. Seeded from `TunedProfile.name`, or from the combination
   * naming rule. */
  name: string;
  included: boolean;
  country: string | null;
  countryLabel: string;
  icon: string;
  /** Union of the sources' settings, never weaker than the baseline. Carried
   * in the model even though draft rows don't display it, so the data stays
   * correct where it isn't shown. */
  settings: ProfileSetting[];
  combined: boolean;
  /** True when the sources disagreed on destination and the combination fell
   * back to the fastest-country rule. */
  destinationFellBack: boolean;
}

export const MAX_DRAFT_NAME_LENGTH = 32;

interface UseDraftsResult {
  drafts: DraftProfile[];
  selectedIds: Set<string>;
  toggleIncluded: (id: string) => void;
  toggleSelected: (id: string) => void;
  rename: (id: string, name: string) => void;
  combine: (ids: string[]) => void;
  split: (id: string) => void;
  keptCount: number;
  quota: number | null;
  /** True when this draft is excluded AND including it would exceed quota. */
  isQuotaBlocked: (id: string) => boolean;
}

function draftFromProfile(profile: TunedProfile, baselineSettings: ProfileSetting[]): DraftProfile {
  return {
    // `profile.id`, not `profile.jtbd` — `privacy` alone can seed two rows
    // (Daily/Advanced privacy), which would collide on the same row id
    // otherwise. `jtbds` below stays `profile.jtbd`: it feeds
    // `mergeFreeSettings`, which is scoped to real intents, not profiles.
    id: profile.id,
    jtbds: [profile.jtbd],
    name: profile.name,
    included: true,
    country: profile.country,
    countryLabel: profile.countryLabel,
    icon: profile.icon,
    settings: effectiveProfileSettings(profile.jtbd, baselineSettings),
    combined: false,
    destinationFellBack: false,
  };
}

/** Combination rules, kept in one place because they're the concept's whole
 * reason for existing and each one is a correctness claim:
 *
 * - Settings are the strictest-wins union via the existing `mergeFreeSettings`
 *   engine, then re-checked against the baseline. A combination is therefore
 *   never weaker than any of its parts, which is what lets the UI honestly
 *   describe it as "everything both of these do".
 * - Destination keeps a shared label, and otherwise falls back to the
 *   fastest-country rule with the row saying so. A single connection can't be
 *   in two countries, and silently picking one source's country would
 *   misdescribe the result.
 * - The name seeds from the sources and is immediately editable, since the
 *   moment right after combining is when a user most wants to name the thing
 *   they just made. */
function combineDrafts(sources: DraftProfile[], baselineSettings: ProfileSetting[]): DraftProfile {
  const jtbds = sources.flatMap((d) => d.jtbds);

  const merged = mergeFreeSettings(jtbds).map((f) => ({
    label: f.settingsName,
    value: f.value,
    tooltip: f.tooltip,
  }));
  // Re-checked against the baseline so a combination can never present a
  // value weaker than what's already applied.
  const settings = strictestOf(merged, baselineSettings);

  const labels = new Set(sources.map((d) => d.countryLabel));
  const sharedLabel = labels.size === 1 ? sources[0].countryLabel : null;

  const names = sources.map((d) => d.name);
  const name = names.length <= 2 ? names.join(" and ") : "My setup";

  return {
    id: jtbds.join("+"),
    jtbds,
    name,
    included: true,
    country: sharedLabel ? sources[0].country : null,
    countryLabel: sharedLabel ?? "Fastest country",
    icon: sources[0].icon,
    settings,
    combined: true,
    destinationFellBack: sharedLabel === null,
  };
}

/** The editing model — the most stateful thing in the profiles family, so it
 * lives apart from the view.
 *
 * Seeded once from the selection via a `useState` initialiser rather than a
 * `useEffect`, so the materialization state changing can never wipe a user's
 * edits mid-screen. */
export function useDrafts(
  profiles: TunedProfile[],
  baselineSettings: ProfileSetting[],
  quota: number | null,
): UseDraftsResult {
  // Seeded exactly once. The initialiser form matters: the materialization
  // state changes on a timer while this screen is live, and an effect-based
  // seed would wipe a user's edits every time it fired. Selection can't
  // change without leaving the screen, and `OnboardingV2` remounts the
  // concept via `key`, so there's nothing to re-seed for.
  const [drafts, setDrafts] = useState<DraftProfile[]>(() => profiles.map((p) => draftFromProfile(p, baselineSettings)));
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const update = useCallback((fn: (drafts: DraftProfile[]) => DraftProfile[]) => setDrafts(fn), []);

  const toggleIncluded = useCallback(
    (id: string) => update((ds) => ds.map((d) => (d.id === id ? { ...d, included: !d.included } : d))),
    [update],
  );

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const rename = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim().slice(0, MAX_DRAFT_NAME_LENGTH);
      // Empty reverts silently rather than raising a validation error — the
      // gentlest possible failure for a purely cosmetic field.
      if (!trimmed) return;
      update((ds) => ds.map((d) => (d.id === id ? { ...d, name: trimmed } : d)));
    },
    [update],
  );

  const combine = useCallback(
    (ids: string[]) => {
      if (ids.length < 2) return;
      update((ds) => {
        const sources = ds.filter((d) => ids.includes(d.id));
        if (sources.length < 2) return ds;
        const merged = combineDrafts(sources, baselineSettings);
        const firstIndex = ds.findIndex((d) => d.id === sources[0].id);
        const remaining = ds.filter((d) => !ids.includes(d.id));
        return [...remaining.slice(0, firstIndex), merged, ...remaining.slice(firstIndex)];
      });
      setSelectedIds(new Set());
    },
    [update, baselineSettings],
  );

  /** Restores the sources with their ORIGINAL names, which is what makes
   * combining safe to try — the one destructive-feeling action here. */
  const split = useCallback(
    (id: string) => {
      update((ds) => {
        const target = ds.find((d) => d.id === id);
        if (!target || !target.combined) return ds;
        // `PROFILES_FOR_JTBD` expands each source intent back to its
        // profile(s) — 1:1 for five intents, both privacy profiles for
        // `privacy`. Splitting a combination that mixed BOTH privacy
        // profiles in with other picks would restore Daily and Advanced
        // twice each rather than once; this concept is prototype-only and
        // not currently reachable (see `VISIBLE_TUNING_CONCEPTS_BY_PLAN`),
        // so that edge case is left as a known limitation rather than
        // threading a second, profile-scoped id through this whole model.
        const restored = target.jtbds.flatMap((j: JtbdId) =>
          PROFILES_FOR_JTBD[j].map((profileId: ProfileId) => draftFromProfile(JTBD_PROFILES[profileId], baselineSettings)),
        );
        const index = ds.findIndex((d) => d.id === id);
        return [...ds.slice(0, index), ...restored, ...ds.slice(index + 1)];
      });
      setSelectedIds(new Set());
    },
    [update, baselineSettings],
  );

  const keptCount = drafts.filter((d) => d.included).length;

  const isQuotaBlocked = useCallback(
    (id: string) => {
      if (quota === null) return false;
      const draft = drafts.find((d) => d.id === id);
      if (!draft || draft.included) return false;
      return keptCount >= quota;
    },
    [quota, drafts, keptCount],
  );

  return useMemo(
    () => ({ drafts, selectedIds, toggleIncluded, toggleSelected, rename, combine, split, keptCount, quota, isQuotaBlocked }),
    [drafts, selectedIds, toggleIncluded, toggleSelected, rename, combine, split, keptCount, quota, isQuotaBlocked],
  );
}
