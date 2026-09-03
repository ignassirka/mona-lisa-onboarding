import ProfileIconTile from "../profiles-carousel-v2/ProfileIconTile";
import CardShimmer from "../profiles-carousel-v2/CardShimmer";
import { PROFILE_CARD_PHOTO, profileChips } from "../../../lib/jtbdProfileMatrix";
import { PLUS_AVAILABILITY_LABEL } from "../../profiles/profilesCopy";
import vpnPlusMarkUrl from "../../../assets/vpn-plus-mark.svg";
import type { TunedProfile } from "../../../lib/jtbdProfiles";

/** Card height, in px, and the number the rest of this screen is budgeted
 * against.
 *
 * `ConceptFrame` spends 328px of the 768px window on chrome (Back, the 128px
 * header block, its 30px gap, the 24px gap to Continue, Continue itself and
 * 40px of bottom padding), leaving 440px of body. Above the cards this
 * concept spends roughly 84px on the two setting rows, 72px on
 * `BoundaryDivider` (a shared component, so that number isn't ours to
 * change), and 32px on `ConceptFrame`'s own two 16px body gaps — about 188px,
 * which leaves ~250px including `CarouselTrack`'s 2px. The 240 spent here
 * keeps ~10px in hand for a header title that wraps to two lines in a longer
 * tone. Past that the body scrolls rather than breaking, since
 * `ConceptFrame`'s column is `overflow-y-auto`.
 *
 * Exported because the phase-1 placeholder has to reserve exactly this height
 * or the group crossfade jumps. */
export const FREE_CARD_H = 240;

/** How far the card is dimmed. 0.45 is not a new number: it's the treatment
 * the main app already uses for a Free user's locked profile rows in
 * `CountryBrowser`, so a profile looks the same amount of unavailable in
 * onboarding as it will five minutes later in the sidebar. */
const DISABLED_OPACITY = 0.45;

/** One profile as a short, inert, unavailable card — v2's card with
 * everything a Free run can't honour taken out of it.
 *
 * What's gone, and why each thing had to go rather than be disabled in place:
 *
 * - **Connect.** Not one of v2's six profiles is fully deliverable on Free:
 *   every one needs at least one Plus thing (Secure Core, P2P servers, a
 *   specific country, fastest-outside-country, and NetShield on all six). A
 *   disabled Connect would still be a button promising a connection that
 *   can't happen.
 * - **The country dropdown.** It offers 93 countries and three rules, all
 *   Plus. A Free user picking one would be choosing between things they can't
 *   have.
 * - **The hover disclosure.** With no Connect underneath it, the settings
 *   panel would be a spec sheet for a product this run doesn't have, and the
 *   two scrims and portalled tooltips it needs exist to serve a decision
 *   nobody is making here.
 *
 * What's left is the part that's still true: this profile exists, it's named
 * after something the user told us they do, it carries these specific
 * settings, and it comes with VPN Plus. So the card is deliberately NOT
 * interactive — no hover state, no focus stop, nothing to click. It is a
 * picture of a thing, and the dimming plus the badge say which thing.
 *
 * The artwork stays the same asset v2 uses at the same 280px width, so the
 * two versions are recognisably the same card rather than two designs that
 * happen to share a name. */
export default function FreeProfileCard({
  profile,
  reduced,
  sweepDelayMs = 0,
}: {
  profile: TunedProfile;
  reduced: boolean;
  /** Offsets this card's freshness sweep from its siblings' — see
   *  `carouselFreshnessStaggerMs`. */
  sweepDelayMs?: number;
}) {
  const chips = profileChips(profile.id);

  return (
    <div
      className="relative w-[280px] shrink-0 snap-start overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.1)] bg-[#0b0912]"
      style={{ height: FREE_CARD_H }}
    >
      {/* Everything identifying the profile dims together, as one layer,
          rather than each element carrying its own muted colour. A single
          opacity is what makes this read as "this card is unavailable"
          instead of as six independently faded pieces of text. */}
      <div className="absolute inset-0" style={{ opacity: DISABLED_OPACITY }}>
        <img src={PROFILE_CARD_PHOTO[profile.id]} alt="" className="absolute inset-0 size-full object-cover" />

        {/* Same top-weighted scrim as v2's card: this artwork is bright, and
            the icon and name sit over its lightest region. */}
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(8,6,14,0.92)] via-[rgba(8,6,14,0.25)] to-[rgba(8,6,14,0.5)]" />

        <div className="absolute inset-0 flex flex-col px-[16px] pt-[16px]">
          <ProfileIconTile profileId={profile.id} />

          <p
            className="mt-[8px] truncate font-['Segoe_UI_Variable',sans-serif] text-[26px] font-semibold leading-[32px] text-white"
            style={{ fontVariationSettings: "'opsz' 24", fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {profile.name}
          </p>

          {/* The same derived chips v2 shows, in the same treatment — a chip
              can't contradict a settings list that isn't on this card, but it
              can contradict the Plus version of the same card, and these are
              the same values from the same `profileChips`. */}
          <div className="mt-[10px] flex flex-wrap gap-[6px]">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-[4px] border border-[rgba(255,255,255,0.16)] bg-[rgba(12,10,18,0.55)] px-[8px] py-[3px] font-['Segoe_UI_Variable',sans-serif] text-[12px] font-medium leading-[16px] text-white backdrop-blur-[2px]"
              >
                {chip}
              </span>
            ))}
          </div>
        </div>
      </div>

      <img
        src={vpnPlusMarkUrl}
        alt=""
        aria-hidden="true"
        className="absolute right-[12px] top-[12px] h-[24px] w-[39px]"
      />

      {/* The freshness pass, outside the dimmed layer and at full strength.
          Dimming it along with the identity would be the one place where the
          "unavailable" treatment costs the card something real: the sweep is
          how a Free user sees that these profiles were BUILT for them, which is
          the whole reason they're on screen. Being unavailable and being freshly
          made are two different claims, and the card makes both. */}
      <CardShimmer mode="sweep" reduced={reduced} delayMs={sweepDelayMs} />

      {/* The badge is the only visual signal of availability, and an image
          plus an opacity says nothing to a screen reader. */}
      <span className="sr-only">{`${profile.name} — ${PLUS_AVAILABILITY_LABEL}`}</span>
    </div>
  );
}
