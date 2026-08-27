import { effectiveProfileSettings, type ProfileSetting, type TunedProfile } from "../../../lib/jtbdProfiles";

export interface ComparisonRow {
  /** Plain-language question — never a settings name. */
  question: string;
  now: string;
  withProfile: string;
  /** False when the two sides are identical. See the note below: this is a
   * feature of the concept, not a gap in the data. */
  changed: boolean;
  /** The winning value's own explanation, for the row's info affordance. */
  tooltip?: string;
}

/** The plain-language question each setting answers. Keyed by the exact
 * `settingsName` from `JTBD_TUNING_RESULT`; anything unlisted falls back to
 * its own name, so new settings never silently vanish from the comparison. */
const QUESTION_FOR: Record<string, string> = {
  Protocol: "How your connection is made",
  "Kill Switch": "If your protection drops",
};

const DESTINATION_QUESTION = "Where you appear to be";

/** Builds one card's before-and-after, so no card ever authors its own
 * comparison and every card compares the same three things in the same
 * order.
 *
 * Rows 2 and 3 will very often read as unchanged, and that is the point
 * rather than a defect. In single mode a profile's settings are identical to
 * the baseline's; in multiple mode `effectiveProfileSettings` guarantees a
 * profile is never weaker than the baseline. So usually only the destination
 * differs — which is exactly the reassuring truth this concept exists to
 * show: using a shortcut changes where you connect, not how protected you
 * are. Hiding these rows for looking repetitive would throw away the
 * strongest evidence on the screen. */
export function comparisonRows(
  profile: TunedProfile | null,
  baselineSettings: ProfileSetting[],
  baselineDestinationLabel: string,
): ComparisonRow[] {
  // The trailing "Everything at once" card: the baseline compared against
  // itself, because it's already what's running.
  if (profile === null) {
    return [
      {
        question: DESTINATION_QUESTION,
        now: baselineDestinationLabel,
        withProfile: baselineDestinationLabel,
        changed: false,
      },
      ...baselineSettings.map((s) => ({
        question: QUESTION_FOR[s.label] ?? s.label,
        now: s.value,
        withProfile: s.value,
        changed: false,
        tooltip: s.tooltip,
      })),
    ];
  }

  const effective = effectiveProfileSettings(profile.jtbd, baselineSettings);
  const effectiveByLabel = new Map(effective.map((s) => [s.label, s]));

  return [
    {
      question: DESTINATION_QUESTION,
      now: baselineDestinationLabel,
      withProfile: profile.countryLabel,
      changed: profile.countryLabel !== baselineDestinationLabel,
    },
    ...baselineSettings.map((baseline) => {
      const withIt = effectiveByLabel.get(baseline.label) ?? baseline;
      return {
        question: QUESTION_FOR[baseline.label] ?? baseline.label,
        now: baseline.value,
        withProfile: withIt.value,
        changed: withIt.value !== baseline.value,
        tooltip: withIt.tooltip,
      };
    }),
  ];
}
