import { motion, type Variants } from "motion/react";
import heroUrl from "../../../assets/upsell-hero.jpg";

/** The source art is **661×1024 — portrait**, sized for the default upsell's
 * own right-hand panel (~490×768, essentially the same 0.645 ratio). That fact
 * decides this component's entire shape.
 *
 * With `object-cover`, a box `W` wide scales the source to `1.549 × W` tall, so
 * the visible slice is `H / (1.549 × W)` of the image. The ▽+ badge occupies
 * roughly the middle third of the art. A full-width strip therefore CANNOT show
 * it: at 720×60 the visible slice is about 5% of the height, which renders as a
 * featureless dark band rather than a product render — the art would be
 * technically present and visually meaningless.
 *
 * So the height is derived from the width rather than passed in, at a ratio that
 * keeps roughly a third of the image in frame. Callers pick how much room they
 * can spare and the crop stays correct by construction, instead of a caller
 * being able to choose a plausible-looking pair of numbers that quietly hides
 * the subject. */
const RATIO = 0.47;

/** Slightly above centre — the badge sits a little high in the source. */
const FOCUS = "50% 46%";

/** The existing 3D product render, kept as a compact mark rather than dropped.
 *
 * In the default upsell this art owns a full 48% column, where its job is to
 * carry aspiration. On the combined layouts the profile cards do that job
 * better, because they have the user's own intents on them — so the art is
 * demoted rather than deleted: it still says "this is a product you're being
 * offered" at the top of the screen, at the size that claim is worth once
 * something more personal is present.
 *
 * Distinct from the flat VPN Plus badge on profile cards (`vpn-plus-mark.svg`,
 * see `UpsellProfileCard`) — that mark is the subscription glyph; this is the
 * 3D render. */
export default function UpsellHeroMark({
  width = 136,
  className = "",
  variants,
}: {
  width?: number;
  className?: string;
  variants?: Variants;
}) {
  return (
    <motion.div
      variants={variants}
      className={`relative shrink-0 overflow-hidden ${className}`}
      style={{ width, height: Math.round(width * RATIO) }}
    >
      <img src={heroUrl} alt="Proton VPN Plus" className="absolute inset-0 size-full object-cover" style={{ objectPosition: FOCUS }} />
    </motion.div>
  );
}
