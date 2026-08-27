import { ShieldAlert, Wifi, type LucideIcon } from "lucide-react";
import { JTBD_TUNING_RESULT } from "../../../lib/jtbdTuningResult";
import { mergeFreeSettings, outcomeForEnabled, type TuningResultLike } from "../../../lib/jtbdMerge";
import { PROFILE_CONFIG_LABELS } from "../../../lib/jtbdProfileConfig";
import type { JtbdId } from "../../../lib/jtbdData";
import type { ToneOfVoice } from "../../../lib/toneOfVoice";

/** One app-wide setting shown below the carousel, with its own toggle. */
export interface GlobalSetting {
  id: string;
  /** Canonical setting name. Not rendered — it's what the no-overlap rule in
   * `globalSettingsFor` matches against, and the toggle's accessible name. */
  settingName: string;
  /** The sentence beside the toggle: what having this on does for you. */
  label: string;
  tooltip?: string;
  Icon: LucideIcon;
}

/** How many global settings sit below the carousel. */
const GLOBAL_SETTING_COUNT = 2;

/** **Authored, and the only authored row here.** Sourced rather than
 * invented: `ISPRegulationsPanel.tsx`'s recommended-actions list already
 * carries this setting with this description and this glyph, so the wording a
 * user reads while onboarding is the wording the main app already uses.
 *
 * It has no entry in `JTBD_TUNING_RESULT` because it isn't tuned per intent —
 * which is precisely why it belongs down here rather than on a card. */
const AUTO_CONNECT: GlobalSetting = {
  id: "auto-connect",
  settingName: "Auto-connect",
  label: "Connect VPN automatically when you go online",
  tooltip: "Auto-connect on startup — there's no unprotected gap between signing in and being covered.",
  Icon: Wifi,
};

/** The global settings shown below the carousel, in reveal order.
 *
 * Kill Switch first because it's DERIVED: the value comes from
 * `mergeFreeSettings` (strictest across the selection, exactly as every other
 * concept resolves it) and the sentence from the tone-voiced outcome the
 * tuning rows already use, so this row can't claim protection the tuning step
 * didn't apply. It is also the one free setting no profile card accounts for
 * — the cards carry Protocol but not Kill Switch — so surfacing it here
 * completes the picture instead of repeating it.
 *
 * The filter is the load-bearing part, not a formality. It's the executable
 * form of the rule that a setting appears in exactly ONE place on this
 * screen: a card reading "NetShield: Off" above a global toggle reading
 * "NetShield — on" reads as a bug, not as a per-profile override. Any setting
 * later added to `PROFILE_CONFIG_LABELS` drops out of here automatically
 * rather than silently contradicting the cards. */
export function globalSettingsFor(selection: JtbdId[], tone: ToneOfVoice): GlobalSetting[] {
  const killSwitch = mergeFreeSettings(selection).find((f) => f.settingsName === "Kill Switch");

  const candidates: GlobalSetting[] = [];

  if (killSwitch) {
    const first = JTBD_TUNING_RESULT[selection[0]!];
    // `outcomeForEnabled` needs a result-shaped object for its single-mode
    // lookup path; a merged feature carries its own source, so this branch
    // only ever reads `killSwitch.primarySource*`.
    const result: TuningResultLike = { jtbdKey: first.jtbdKey, jtbdLabel: first.jtbdLabel, enabled: [killSwitch], paid: [], tip: null };
    candidates.push({
      id: "kill-switch",
      settingName: "Kill Switch",
      label: outcomeForEnabled(tone, result, 0, killSwitch),
      tooltip: killSwitch.tooltip,
      Icon: ShieldAlert,
    });
  }

  candidates.push(AUTO_CONNECT);

  return candidates
    .filter((setting) => !PROFILE_CONFIG_LABELS.some((label) => label.toLowerCase() === setting.settingName.toLowerCase()))
    .slice(0, GLOBAL_SETTING_COUNT);
}
