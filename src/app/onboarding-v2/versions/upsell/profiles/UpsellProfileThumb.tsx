import { PROFILE_CARD_PHOTO } from "../../../lib/jtbdProfileMatrix";
import { PLUS_AVAILABILITY_LABEL } from "../../../tuned-result/profiles/profilesCopy";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

/** 4:3, and small enough that a row is only as tall as its text at one
 * benefit — the thumbnail stops being the thing that sets row height, which is
 * what keeps a 5- or 6-pick run from needing a scroll it can't avoid. */
export const UPSELL_THUMB_W = 108;
export const UPSELL_THUMB_H = 80;

/** The same Plus-violet rim as the full card, at 1px — see
 * `UpsellProfileCard`'s note on why the Plus signal here is additive. No outer
 * glow: six of these stacked in a list would turn into one violet smear. */
const RIM = "inset 0 0 0 1px rgba(147,116,255,0.5)";

/** A profile at list-row scale — the artwork and its name.
 *
 * Not a resized `UpsellProfileCard`: at 116px the icon tile (54px wide) and
 * the chips can't fit without becoming illegible, so the pieces that don't
 * survive the scale are dropped rather than shrunk. In the layout that uses
 * this, the chips move out to the row beside the thumbnail, where they have
 * room to be read.
 *
 * The name stays ON the artwork rather than moving to the row, because it's
 * what makes the thumbnail identifiable as a specific profile rather than
 * decorative imagery. */
export default function UpsellProfileThumb({ profile }: { profile: TunedProfile }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-[10px] bg-[#0b0912]"
      style={{ width: UPSELL_THUMB_W, height: UPSELL_THUMB_H, boxShadow: RIM }}
    >
      <img src={PROFILE_CARD_PHOTO[profile.id]} alt="" className="absolute inset-0 size-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,6,14,0.9)] via-[rgba(8,6,14,0.15)] to-[rgba(8,6,14,0.45)]" />

      <div className="absolute inset-x-0 bottom-0 px-[8px] pb-[7px]">
        <span
          className="block min-w-0 truncate font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-white"
          style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
        >
          {profile.name}
        </span>
      </div>

      <span className="sr-only">{`${profile.name} — ${PLUS_AVAILABILITY_LABEL}`}</span>
    </div>
  );
}
