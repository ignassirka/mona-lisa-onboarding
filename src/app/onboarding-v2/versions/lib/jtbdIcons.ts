import type { JtbdId, ProfileId } from "../../lib/jtbdData";
import iconDownloading from "../../assets/jtbd-downloading.svg";
import iconTravel from "../../assets/jtbd-travel.svg";
import iconPrivacy from "../../assets/jtbd-privacy.svg";
import iconGaming from "../../assets/jtbd-gaming.svg";
import iconStreaming from "../../assets/jtbd-streaming.svg";
import iconBypass from "../../assets/jtbd-bypass.svg";
import iconBusinessCard from "../../assets/profile-card-icon-business.svg";
import iconSecurityCard from "../../assets/profile-card-icon-security.svg";

/** The JTBD category icons, shared by the grid picker (`JtbdGridPanel`) and
 * the tuned-result header (`TunedResult`, where the loader spinner
 * crossfades into the selected JTBD's icon). */
export const JTBD_ICONS: Record<JtbdId, string> = {
  downloading: iconDownloading,
  travel: iconTravel,
  privacy: iconPrivacy,
  gaming: iconGaming,
  streaming: iconStreaming,
  bypass: iconBypass,
};

/** Per-JTBD recolor for the badge shown INSIDE a profile card
 * (`ProfileIconTile`) — every asset above is baked with the same purple
 * badge gradient, so this is a colour OVERLAY applied on top of that
 * artwork, not a swap to a different asset. See `ProfileIconTile`'s own
 * comment for how (mask + `mix-blend-mode: color`). Privacy keeps the
 * artwork's own native purple (`#6D4AFF`, the same value as every
 * `TunedProfile.accent`), applied through the identical overlay mechanism
 * as the other five rather than skipped as a special case — so there's one
 * code path, not "five recolored plus one left alone". */
export const PROFILE_ICON_COLOR: Record<JtbdId, string> = {
  privacy: "#6D4AFF",
  streaming: "#F45E5E",
  downloading: "#F79F4D",
  gaming: "#7FDF66",
  travel: "#7B7BFB",
  bypass: "#F9E646",
};

/** Per-profile icon for v2 profile cards (`ProfileIconTile`) and the upsell
 * tab strip. Most profiles reuse their intent's JTBD grid badge; Travel and
 * Advanced privacy swap to flag-less Business and Security badge glyphs
 * (`profile-card-icon-*.svg`, 36×24 — the sidebar's `profile-icon-*.svg`
 * composites a country flag beneath the glyph, which would contradict the
 * card's own country dropdown three rows below). Daily privacy keeps the
 * privacy badge — the lighter of the two privacy cards. */
export const PROFILE_CARD_ICON: Record<ProfileId, string> = {
  streaming: iconStreaming,
  downloading: iconDownloading,
  gaming: iconGaming,
  travel: iconBusinessCard,
  bypass: iconBypass,
  "privacy-daily": iconPrivacy,
  "privacy-advanced": iconSecurityCard,
};

/** Recolor overlay for `PROFILE_CARD_ICON` — keyed by `ProfileId` so Travel
 * and both privacy cards can diverge from a shared `JtbdId` tint. */
export const PROFILE_CARD_ICON_COLOR: Record<ProfileId, string> = {
  streaming: PROFILE_ICON_COLOR.streaming,
  downloading: PROFILE_ICON_COLOR.downloading,
  gaming: PROFILE_ICON_COLOR.gaming,
  travel: PROFILE_ICON_COLOR.travel,
  bypass: PROFILE_ICON_COLOR.bypass,
  "privacy-daily": PROFILE_ICON_COLOR.privacy,
  "privacy-advanced": PROFILE_ICON_COLOR.privacy,
};

/** One filled shape in an `INLINE_OVERLAY_SHAPES` entry — either a `<path>`
 * or (for Business's clasp) a `<rect>`, since that's how the source artwork
 * expresses it. */
export type OverlayShape =
  | { kind: "path"; d: string; fillRule?: "evenodd" }
  | { kind: "rect"; x: number; y: number; width: number; height: number; rx?: number; transform?: string };

/** Vector geometry (viewBox `0 0 36 24`, matching every badge here) for
 * Travel's and Advanced privacy's colour overlay, rendered as a real inline
 * `<svg>` with `fill={color}` rather than a CSS `mask-image`.
 *
 * `mask-image: url(...)` against an external SVG file — the mechanism every
 * OTHER profile's overlay uses (`ProfileIconTile`) — rasterizes that file to
 * a bitmap first and masks by ITS alpha. For `profile-card-icon-business.svg`
 * (a Figma-exported inner-shadow `<filter>` on the lid) and
 * `-security.svg` (small soft-edged asterisk decorations), that
 * rasterization pass was producing an opaque bounding-box rectangle instead
 * of the glyph's actual silhouette — visible as a box behind the icon —
 * even after swapping in a filter-stripped, flattened silhouette file as the
 * mask source; the rasterizer itself, not just the filter, was the problem.
 * Painting the same geometry as real SVG `<path>`/`<rect>` elements with a
 * direct `fill` sidesteps rasterization entirely — there is no mask to
 * compute, so there is nothing for a browser to get wrong. The five other
 * badges (plain paths/gradients, badge-shaped so a bounding box and the
 * true silhouette read the same regardless) are unaffected and keep the
 * simpler `mask-image` path. */
export const PROFILE_CARD_ICON_OVERLAY_SHAPES: Partial<Record<ProfileId, OverlayShape[]>> = {
  travel: [
    {
      kind: "path",
      fillRule: "evenodd",
      d: "M23 2H13C12.4477 2 12 2.44772 12 3V5C12 5.55228 12.4477 6 13 6H23C23.5523 6 24 5.55228 24 5V3C24 2.44772 23.5523 2 23 2ZM13 0C11.3431 0 10 1.34315 10 3V5C10 6.65685 11.3431 8 13 8H23C24.6569 8 26 6.65685 26 5V3C26 1.34315 24.6569 0 23 0H13Z",
    },
    { kind: "path", d: "M2 8C2 6.34315 3.34315 5 5 5H31C32.6569 5 34 6.34315 34 8V21C34 22.6569 32.6569 24 31 24H5C3.34315 24 2 22.6569 2 21V8Z" },
    {
      kind: "path",
      d: "M2 7C2 5.89543 2.89543 5 4 5H32C33.1046 5 34 5.89543 34 7V10L25.7247 13.1032C20.7442 14.9709 15.2558 14.9709 10.2753 13.1032L2 10V7Z",
    },
    { kind: "rect", x: 21, y: 13, width: 4, height: 6, rx: 0.989732, transform: "rotate(90 21 13)" },
  ],
  "privacy-advanced": [
    {
      kind: "path",
      d: "M12 9.5V6.43195C12 2.87839 14.6851 0 18 0C21.3149 0 24 2.87839 24 6.43195V12H22.0457V6.43195C22.0457 3.87339 20.3536 2.05948 17.9668 2.05948C15.5801 2.05948 13.888 3.87339 13.888 6.43195V9.5H12Z",
    },
    {
      kind: "path",
      d: "M25.5813 24H10.4187C9.65024 24 9 23.3738 9 22.5686V10.4314C9 9.65606 9.62069 9 10.4187 9H25.5813C26.3498 9 27 9.62624 27 10.4314V22.5686C27 23.3439 26.3793 24 25.5813 24Z",
    },
    {
      kind: "path",
      d: "M20 14.9174C20 13.8522 19.1111 13 18 13C16.8889 13 16 13.8522 16 14.9174C16 15.6478 16.4127 16.2565 17.0476 16.5913L16.3718 19.3823C16.2956 19.697 16.534 20 16.8577 20H19.1423C19.466 20 19.7044 19.697 19.6282 19.3823L18.9524 16.5913C19.5873 16.287 20 15.6478 20 14.9174Z",
    },
    {
      kind: "path",
      d: "M31.0952 20L29.6372 18.8283C30.1007 18.2876 30.5834 17.7701 31.0855 17.2761C31.2851 17.0758 31.4106 16.949 31.4621 16.8956C31.3011 16.8689 30.8409 16.7587 30.0814 16.5651C29.5343 16.4249 29.1738 16.3214 29 16.2546L29.5697 14.4921C30.4129 14.846 31.166 15.2365 31.829 15.6638C31.6745 14.5756 31.5972 13.6876 31.5972 13H33.3159C33.3159 13.4874 33.229 14.382 33.0552 15.6838C33.1839 15.6304 33.4607 15.5002 33.8855 15.2933C34.4648 15.0196 34.9991 14.7859 35.4883 14.5923L36 16.4049C35.2855 16.5718 34.4584 16.7353 33.5186 16.8956L34.6772 18.2475C34.909 18.5212 35.0924 18.7449 35.2276 18.9185L33.7503 19.9299L32.4469 17.6967C32.0543 18.4177 31.6037 19.1855 31.0952 20Z",
    },
    {
      kind: "path",
      d: "M2.09517 20L0.637241 18.8283C1.10069 18.2876 1.58345 17.7701 2.08552 17.2761C2.28506 17.0758 2.41057 16.949 2.46207 16.8956C2.30115 16.8689 1.84092 16.7587 1.08138 16.5651C0.534253 16.4249 0.173793 16.3214 0 16.2546L0.569655 14.4921C1.41287 14.846 2.16598 15.2365 2.82897 15.6638C2.67448 14.5756 2.59724 13.6876 2.59724 13H4.31586C4.31586 13.4874 4.22897 14.382 4.05517 15.6838C4.18391 15.6304 4.46069 15.5002 4.88552 15.2933C5.46483 15.0196 5.99908 14.7859 6.48828 14.5923L7 16.4049C6.28552 16.5718 5.45839 16.7353 4.51862 16.8956L5.67724 18.2475C5.90897 18.5212 6.09241 18.7449 6.22759 18.9185L4.75034 19.9299L3.4469 17.6967C3.05425 18.4177 2.60368 19.1855 2.09517 20Z",
    },
  ],
};
