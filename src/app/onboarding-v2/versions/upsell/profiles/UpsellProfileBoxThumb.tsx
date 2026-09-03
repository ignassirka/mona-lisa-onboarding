import { PROFILE_CARD_PHOTO } from "../../../lib/jtbdProfileMatrix";
import { PLUS_AVAILABILITY_LABEL } from "../../../tuned-result/profiles/profilesCopy";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

/** Small enough that a 6-pick run's row still fits beside the box's caption
 * rather than needing its own scroll — see `FeaturesLedBand`'s note on
 * where each layout spends its width. */
export const BOX_THUMB_W = 88;
const IMAGE_H = 58;

/** A profile as [image, name below] — distinct from `UpsellProfileThumb`
 * (108×80, the name burnt into the artwork via a bottom scrim), which
 * `profiles-paired` still needs unchanged for its own trailing strip.
 *
 * The name moves OFF the artwork here because this thumbnail sits inside a
 * bordered box next to a sentence already making the "these are profiles"
 * claim in words — a scrim + overlaid name repeats that framing per-thumbnail
 * instead of stating it once. Dropping the scrim also means the image plays
 * at full brightness rather than being dimmed for legibility underneath text
 * that no longer needs to sit on top of it.
 *
 * No separate Plus-lock signal (no rim, no badge) — this is the one profile
 * presentation in the codebase without one, and deliberately so: the box it
 * lives in IS the signal, the same "this is part of the deal" framing
 * `ValueStack`'s price panel and the inline avatar row's violet panel already
 * carry, so a badge repeated three more times inside that box would be
 * restating what the box's own border already says once. */
export default function UpsellProfileBoxThumb({ profile }: { profile: TunedProfile }) {
  return (
    <div className="flex shrink-0 flex-col items-center gap-[6px]" style={{ width: BOX_THUMB_W }}>
      <div className="w-full overflow-hidden rounded-[8px] bg-[#0b0912]" style={{ height: IMAGE_H }}>
        <img src={PROFILE_CARD_PHOTO[profile.id]} alt="" className="size-full object-cover" />
      </div>
      <span
        className="max-w-full truncate font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-white"
        style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
      >
        {profile.name}
      </span>
      <span className="sr-only">{`${profile.name} — ${PLUS_AVAILABILITY_LABEL}`}</span>
    </div>
  );
}
