/** Tunable config for the Sign In screen's decorative ciphertext grid —
 * a full-bleed monospace glyph texture with occasional single-character
 * flips. All subtlety knobs live here so density/pace/opacity can be
 * adjusted without touching render logic. */
export const SIGN_IN_ENCRYPTION = {
  /** Monospace cell pitch (px) — caps grid density at the 1100×750 window. */
  cellWidth: 26,
  cellHeight: 30,
  fontSize: 18,
  /** Peak glyph opacity at the radial center (reference reads ~5–10%). */
  baseOpacity: 0.08,
  /** Muted bluish tone, consistent with the sign-in background. */
  glyphRgb: [132, 168, 204] as const,
  /** Radial falloff center (normalized 0–1 within the canvas). */
  radialCenterX: 0.5,
  radialCenterY: 0.38,
  /** Full-strength disk radius (normalized to half-diagonal). */
  radialFull: 0.42,
  /** Opacity multiplier at the farthest corners/edges. */
  radialEdgeMultiplier: 0.12,
  /** How often a new batch of random flips is scheduled. */
  flipIntervalMs: 400,
  /** Individual cells that change per cycle — keep small vs total cells. */
  flipsPerCycle: 6,
  /** Per-character crossfade duration when a glyph regenerates. */
  flipFadeDurationMs: 320,
  /** After a flip completes, hold the glyph at boosted opacity this long. */
  flipHighlightHoldMs: 2200,
  /** Then fade back to the normal subtle opacity over this duration. */
  flipHighlightFadeMs: 900,
  /** Opacity multiplier while a freshly flipped glyph is highlighted. */
  flipHighlightMultiplier: 6,
  /** Minimum radial strength required when picking a cell to flip — keeps
   * flips in the visible center rather than masked edge cells. */
  flipMinRadial: 0.5,
  /** Approximate foreground content bounds. Flip candidates inside this
   * normalized rectangle are excluded so changes never hide behind the
   * opaque sign-in card/logo stack. */
  foregroundExclusion: {
    left: 0.27,
    right: 0.73,
    top: 0.1,
    bottom: 0.77,
  },
  /** Prefer cells whose current glyph is already numeric/symbolic, making
   * the requested number regeneration visibly trackable. */
  numericFlipRatio: 0.75,
  /** Chance a flip lands on a digit/symbol rather than a letter. */
  digitFlipBias: 0.8,
  charset: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
  digitSymbolCharset: "0123456789+/=",
} as const;

export type SignInEncryptionConfig = typeof SIGN_IN_ENCRYPTION;
