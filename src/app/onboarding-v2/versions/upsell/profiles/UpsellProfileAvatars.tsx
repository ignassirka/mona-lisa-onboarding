import { PROFILE_CARD_PHOTO } from "../../../lib/jtbdProfileMatrix";
import { UPSELL_VERSIONS_COPY } from "../../../lib/upsellVersionsCopy";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

const C = UPSELL_VERSIONS_COPY.featuresLed;

/** How many faces the stack shows before it starts counting. Past four, a row
 * of 36px crops overlapping by 12px stops reading as "a few named things" and
 * starts reading as a texture — and unlike the card layouts, this element has
 * no room to grow. The caption beside it always states the REAL count, so a
 * 6-pick run reads "Your 6 personalized profiles" next to four faces and a
 * `+2`, never a quantity the artwork alone would understate. */
export const AVATAR_CAP = 4;

const SIZE = 36;
const OVERLAP = 12;

/** The same Plus-violet rim the card and the thumbnail carry, at 1px — see
 * `UpsellProfileCard`'s note on why the Plus signal is additive rather than a
 * dimming. No glow: at this size a halo per face would merge into one smear.
 * The outer dark ring is what keeps overlapping neighbours separable against
 * each other's artwork; it's translucent rather than the page's own `#16141c`
 * so it stays correct on the violet-tinted panel this row sits in. */
const RING = "inset 0 0 0 1px rgba(147,116,255,0.55), 0 0 0 2px rgba(11,9,18,0.85)";

/** The profiles at their smallest honest scale: a row of overlapping artwork
 * crops, for the layout that demotes them furthest.
 *
 * Not a resized `UpsellProfileThumb` (108×80, name burnt into the artwork):
 * at 36px no text survives, so the name moves OUT — to the caption beside the
 * row and to an `sr-only` list — rather than being shrunk into illegibility.
 * What's left is the one thing artwork can still say at this size: these are
 * distinct, real, picture-bearing objects, not a generic icon.
 *
 * **Hover lifts and brightens the row rather than spreading it.** Relaxing
 * each face's negative margin was the first version and looked better in
 * isolation, but it widens the row by up to 48px, and this row's only sibling
 * is the caption text right next to it — so revealing the stack meant sliding
 * a line of type sideways every time the pointer crossed it. A 2px lift and
 * the scrim fading off is transform/opacity only: the acknowledgement stays,
 * the layout doesn't move. The faces the overlap hides are accounted for by
 * the `+N` tile and named in the `sr-only` list, so nothing is only
 * discoverable by hovering. Suspended under reduced motion. */
export default function UpsellProfileAvatars({
  profiles,
  reduced,
  className = "",
}: {
  profiles: TunedProfile[];
  reduced: boolean;
  className?: string;
}) {
  const shown = profiles.slice(0, AVATAR_CAP);
  const overflow = profiles.length - shown.length;
  const lift = reduced ? "" : "transition-transform duration-200 ease-out group-hover:-translate-y-[2px]";

  return (
    <div className={`group flex items-center ${className}`} role="group" aria-label={C.groupLabel}>
      {shown.map((profile, i) => (
        <div
          key={profile.id}
          className={`relative shrink-0 overflow-hidden rounded-[9px] bg-[#0b0912] ${lift}`}
          style={{
            width: SIZE,
            height: SIZE,
            marginLeft: i === 0 ? 0 : -OVERLAP,
            boxShadow: RING,
            zIndex: shown.length - i,
          }}
        >
          <img src={PROFILE_CARD_PHOTO[profile.id]} alt="" className="absolute inset-0 size-full object-cover" />
          {/* Lifts on hover with the row — the artwork brightens rather than
              the stack rearranging (see the note on the component). */}
          <div
            className={`absolute inset-0 bg-[rgba(8,6,14,0.28)] ${reduced ? "" : "transition-opacity duration-200 ease-out group-hover:opacity-0"}`}
          />
        </div>
      ))}

      {overflow > 0 && (
        <span
          className={`flex shrink-0 items-center justify-center rounded-[9px] bg-[rgba(109,74,255,0.22)] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-semibold leading-[16px] text-[rgba(255,255,255,0.85)] ${lift}`}
          style={{ width: SIZE, height: SIZE, marginLeft: -OVERLAP, boxShadow: RING }}
          aria-hidden="true"
        >
          {C.avatarOverflow(overflow)}
        </span>
      )}

      {/* The names the artwork can't carry at 36px — stated once, in full,
          including any the `+N` face stands in for. */}
      <span className="sr-only">{profiles.map((p) => p.name).join(", ")}</span>
    </div>
  );
}
