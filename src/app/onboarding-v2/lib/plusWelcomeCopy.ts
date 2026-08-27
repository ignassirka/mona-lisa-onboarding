import type { JTBDKey } from "./jtbdTuningResult";

/** Copy for the **Profiles showcase** Plus Welcome layout — profiles as the
 * hero. Kept separate from `JTBD_PLUS_WELCOME` (the four settings-list
 * layouts) so the two welcome families can't drift apart on wording nobody
 * meant to change. */
export const PLUS_WELCOME_PROFILES_COPY = {
  /** Accessible name for the carousel group. */
  carouselLabel: (n: number) => (n === 1 ? "Your unlocked profile" : `Your ${n} unlocked profiles`),

  /** Per-card screen-reader hint on the unlocked cards. */
  profileReadyLabel: "Ready to use",
} as const;

/** Welcoming subheading when one profile is on screen. */
export function plusWelcomeProfilesSubheading(profileName: string): string {
  return `${profileName} is unlocked and ready to go — swipe through your profile and everything VPN Plus just turned on.`;
}

/** Welcoming subheading when several profiles are on screen. */
export function plusWelcomeProfilesSubheadingMultiple(count: number): string {
  return `All ${count} profiles are unlocked and ready to go — browse what you built and everything VPN Plus just turned on.`;
}

/** Fallback when only the primary JTBD key is known (shouldn't happen on
 * this layout, but keeps the type narrow). */
export function plusWelcomeProfilesSubheadingFromJtbd(_jtbdKey: JTBDKey, profileName: string): string {
  return plusWelcomeProfilesSubheading(profileName);
}
