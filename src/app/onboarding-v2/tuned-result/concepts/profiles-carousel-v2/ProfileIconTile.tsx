import type { CSSProperties } from "react";
import type { ProfileId } from "../../../lib/jtbdData";
import { PROFILE_CARD_ICON, PROFILE_CARD_ICON_COLOR, PROFILE_CARD_ICON_OVERLAY_SHAPES } from "../../../versions/lib/jtbdIcons";

/** The card's identity anchor: the per-profile icon for this card — usually
 * the same JTBD grid badge the picker uses, but Travel and Advanced privacy
 * deliberately swap to the Business and Security sidebar glyphs instead.
 * Shown at full colour rather than the picker's grayscale-until-selected
 * treatment — this card has no "unselected" state to distinguish.
 *
 * **Recolored per profile, without a second set of artwork.** Every badge
 * asset shares one purple gradient baked into the SVG itself — recoloring
 * six intents to six colours by hand-editing six files (or exporting six
 * variants) would mean the two ever having a reason to drift apart. Instead
 * a second layer sits on top of the same `<img>`: a solid fill in
 * `PROFILE_CARD_ICON_COLOR[id]`, blended against the base image beneath via
 * `mix-blend-mode: color`. `color` keeps the base artwork's LUMINANCE (its
 * gradient's light-to-dark falloff, so the badge still reads as
 * dimensional) and replaces its HUE and SATURATION with the overlay's —
 * which is what makes this an overlay tint rather than a flat recolor that
 * would flatten the badge into one solid shape.
 *
 * **Two different ways of shaping that fill layer, by profile.** Most
 * profiles clip it to the badge's silhouette via `mask-image: url(icon)` —
 * the browser masks by the image's ALPHA channel for a plain image URL, so
 * the fill exactly follows the badge's shape including its own soft edges.
 * Travel and Advanced privacy instead paint the fill as REAL inline SVG
 * `<path>`/`<rect>` elements (`PROFILE_CARD_ICON_OVERLAY_SHAPES`) — their
 * badges (`profile-card-icon-business.svg`'s inner-shadow `<filter>`,
 * `-security.svg`'s soft-edged asterisk decorations) were rasterizing into
 * an opaque bounding-box rectangle instead of their actual silhouette when
 * used as a CSS `mask-image` source, even after simplifying the mask file
 * itself — the rasterization step was the problem, not the file. Vector
 * paths with a direct `fill` have no mask to rasterize, so there's nothing
 * to get wrong. Privacy's overlay colour is the artwork's own native
 * purple, run through the same mask mechanism as the untouched profiles
 * rather than skipped as a special case. */
export default function ProfileIconTile({ profileId, className = "h-[36px] w-[54px]" }: { profileId: ProfileId; className?: string }) {
  const icon = PROFILE_CARD_ICON[profileId];
  const color = PROFILE_CARD_ICON_COLOR[profileId];
  const overlayShapes = PROFILE_CARD_ICON_OVERLAY_SHAPES[profileId];

  const maskStyle: CSSProperties = {
    backgroundColor: color,
    WebkitMaskImage: `url(${icon})`,
    maskImage: `url(${icon})`,
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskPosition: "center",
    maskPosition: "center",
    mixBlendMode: "color",
  };

  return (
    <div className={`relative shrink-0 ${className}`} aria-hidden="true">
      <img src={icon} alt="" className="absolute inset-0 size-full object-contain" />
      {overlayShapes ? (
        <svg viewBox="0 0 36 24" className="absolute inset-0 size-full" style={{ mixBlendMode: "color" }}>
          {overlayShapes.map((shape, i) =>
            shape.kind === "rect" ? (
              <rect
                key={i}
                x={shape.x}
                y={shape.y}
                width={shape.width}
                height={shape.height}
                rx={shape.rx}
                transform={shape.transform}
                fill={color}
              />
            ) : (
              <path key={i} d={shape.d} fillRule={shape.fillRule} fill={color} />
            ),
          )}
        </svg>
      ) : (
        <div className="absolute inset-0" style={maskStyle} />
      )}
    </div>
  );
}
