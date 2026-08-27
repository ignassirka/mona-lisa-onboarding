import type { JtbdId } from "../../../lib/jtbdData";
import { JTBD_ICONS } from "../../../versions/lib/jtbdIcons";

/** The card's identity anchor: the same per-intent badge icon the JTBD grid
 * picker uses (`JTBD_ICONS` — a 36×24 shield/badge shape with its purple
 * gradient, `#EEBEFF`→`#6D4AFF`, baked into the artwork itself), shown at
 * full colour rather than the picker's grayscale-until-selected treatment —
 * this card has no "unselected" state to distinguish.
 *
 * Reusing the real asset rather than building a second icon treatment is
 * what keeps this card visually part of the same product as the picker that
 * led here, instead of introducing a third icon language (after the
 * picker's badges and the sidebar's flag-composited glyphs) for a shape
 * that already exists.
 *
 * Decorative: the profile's name sits directly beneath it in text, so the
 * icon is `aria-hidden` rather than carrying a duplicate label. */
export default function ProfileIconTile({ jtbd }: { jtbd: JtbdId }) {
  return <img src={JTBD_ICONS[jtbd]} alt="" aria-hidden="true" className="h-[36px] w-[54px] shrink-0 object-contain" />;
}
