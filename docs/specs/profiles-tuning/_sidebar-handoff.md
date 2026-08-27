# Sidebar handoff — making "these stay in your app" true

## Purpose

Reassurance **R3** ([_foundation.md](_foundation.md) §6) is that the setups a user is shown during tuning remain available afterwards. Every one of the five concepts promises this on screen. This spec makes the promise literally true: the profile names, destinations and glyphs a user saw on the tuning screen are the ones they find in the main app's sidebar.

Shared by all five concepts, specced once. Independent of the concepts themselves, so it can be built in parallel with any of them — but it must ship before or alongside the first concept, because otherwise all five make a claim the app contradicts one screen later.

## Status

Spec — not implemented. Depends on `JTBD_PROFILES` from [_foundation.md](_foundation.md) §2.

---

## 1. What happens today

Three pieces, all in place and all working:

**The exit payload.** `OnboardingV2`'s `onExit` (declared around line 248 of [OnboardingV2.tsx](../../../src/app/onboarding-v2/OnboardingV2.tsx)) passes three things:

```ts
onExit?: (
  selectedJtbds?: JtbdId[],
  plan?: SessionPlan,
  options?: OnboardingExitOptions,
) => void;
```

`OnboardingExitOptions` in [src/app/lib/sessionPlan.ts](../../../src/app/lib/sessionPlan.ts) carries `vpnConnected` and `deferredDueToConnectionFailure`. Nothing else.

**The store.** `handleEnterApp` in [App.tsx](../../../src/app/App.tsx) calls `setOnboardingJtbds(selectedJtbds)`, and that array is threaded into `CountryBrowser` as `onboardingJtbds` alongside `sessionPlan`.

**The sidebar.** [CountryBrowser.tsx](../../../src/app/components/CountryBrowser.tsx) holds six hardcoded entries (`profilesList`, around line 343):

| id | title | subtitle |
|---|---|---|
| `streaming-us` | Streaming US | United States |
| `gaming` | Gaming | Fastest country |
| `p2p` | P2P | Fastest country |
| `anticensors` | Anti-censorship | Fastest (excluding my country) |
| `max-security` | Maximum security | Fastest - Secure Core |
| `work-school` | Work and school | Fastest country |

`displayedProfiles` (around line 569) maps the selected intents through `JTBD_TO_PROFILE_ID`, filters to those, preserves selection order, and renames each `title` to `JTBD_PROFILE_LABEL[jtbd]`. So a user who picked Travel already sees a profile called "Travel", not "Work and school". That part is right and stays.

## 2. The gaps

**Gap 1 — the destination doesn't carry over.** `displayedProfiles` overrides `title` but keeps the entry's original `subtitle`. So for the intents where the two sources disagree, the sidebar says something different from what tuning said. Against the `JTBD_PROFILES` table in [_foundation.md](_foundation.md) §2.3:

- `privacy` — tuning will say "Switzerland", the sidebar says "Fastest - Secure Core"
- `downloading` — tuning will say "Netherlands", the sidebar says "Fastest country"
- `streaming`, `gaming`, `travel`, `bypass` — already agree

Two of six visibly contradict the screen the user just left, which is exactly the kind of small mismatch that undermines a reassurance.

**Gap 2 — the Plus country pick is discarded.** `OnboardingV2` owns `selectedCountry` (the Plus-only country selector on the Hybrid variants) but it is not part of the `onExit` payload, so the main app never learns it. A Plus user who deliberately chose Japan during onboarding sees no trace of that choice in their profiles.

**Gap 3 — two sources of truth.** After the foundation lands, profile names, destinations and glyphs exist in `JTBD_PROFILES`, while `profilesList` holds its own parallel copy. They will drift.

## 3. Change 1 — carry the country through the exit

Extend `OnboardingExitOptions` in [src/app/lib/sessionPlan.ts](../../../src/app/lib/sessionPlan.ts):

```ts
export type OnboardingExitOptions = {
  vpnConnected?: boolean;
  deferredDueToConnectionFailure?: boolean;
  /** The country the user picked on the Plus-only country selector during
   * onboarding, or null/undefined for "Fastest country" (the default, and
   * the entire Free-plan behaviour). Used to personalize the destination on
   * generated sidebar profiles. */
  selectedCountry?: string | null;
};
```

Optional, so every existing `onExit` call site is unaffected. `OnboardingV2`'s `handleExit` already spreads `options`, so it needs one addition — pass `selectedCountry` on the exits that come after tuning:

- the `TunedResult` and profiles-concept Plus path: `handleExit(effectiveSelectedJtbds, "plus", { selectedCountry })`
- the upsell's Continue-free path: `handleExit(effectiveSelectedJtbds, "free", { selectedCountry })`
- the Plus Welcome exit: same, with `"plus"`

Leave the connection-failure exits (Tier 2 and Tier 3) and the "Go to app directly" skip alone. Those pass `[]` for intents and never reached a country selection, so there is nothing to carry.

## 4. Change 2 — store it

In [App.tsx](../../../src/app/App.tsx), add state beside the existing `onboardingJtbds`:

```ts
/** The Plus-plan country picked during onboarding, or null for "Fastest
 * country". Set by `handleEnterApp`; personalizes generated sidebar
 * profiles. Distinct from the main app's own connected-country state. */
const [onboardingCountry, setOnboardingCountry] = useState<string | null>(null);
```

Set it in `handleEnterApp` next to `setOnboardingJtbds(selectedJtbds)`:

```ts
setOnboardingCountry(options.selectedCountry ?? null);
```

Thread it into `CountryBrowser` as a new optional prop alongside `onboardingJtbds`.

## 5. Change 3 — derive the sidebar from `JTBD_PROFILES`

The substantive change. In [CountryBrowser.tsx](../../../src/app/components/CountryBrowser.tsx):

**Keep** `ProfileEntry`, `ProfileRow`, `profilesList`, `JTBD_TO_PROFILE_ID`, the `p2p` tag, the Profiles tab, the onboarding banner, the `profilesOnboardingBannerDismissed` key, and `profilesLocked`. All unchanged.

**Change** `displayedProfiles` to take its title, subtitle and icon from `JTBD_PROFILES` rather than only overriding the title:

```ts
const displayedProfiles = useMemo(() => {
  if (!hasOnboardingIntents) return profilesList;          // unchanged fallback
  const byId = new Map(profilesList.map((p) => [p.id, p]));
  const seen = new Set<string>();
  const mapped: ProfileEntry[] = [];
  for (const jtbd of onboardingJtbds!) {
    const base = byId.get(JTBD_TO_PROFILE_ID[jtbd]);
    const profile = JTBD_PROFILES[jtbd];
    if (base && profile && !seen.has(base.id)) {
      seen.add(base.id);
      mapped.push({
        ...base,                                            // keeps id and the p2p tag
        title: profile.name,
        subtitle: sidebarSubtitle(profile, onboardingCountry),
        icon: profile.icon,
      });
    }
  }
  return mapped.length > 0 ? mapped : profilesList;
}, [hasOnboardingIntents, onboardingJtbds, onboardingCountry]);
```

`profile.name` is `JTBD_PROFILE_LABEL[jtbd]`, so this preserves the existing renaming behaviour exactly rather than replacing it. `profile.icon` resolves to the same six `profile-icon-*.svg` assets `profilesList` already imports, so no artwork changes and the glyph the tuning screen showed is the glyph in the row.

**Add** one small resolver, in `jtbdProfiles.ts` so both the tuning screen and the sidebar use the same rule:

```ts
/** The destination line for a generated sidebar profile. A Plus user's own
 * country pick wins over the profile's default destination, but only for
 * profiles that target a fixed country — the rule-based ones ("fastest
 * nearby", "fastest outside your country") describe a behaviour, not a
 * place, and overriding them would misdescribe what they do. */
export function sidebarSubtitle(
  profile: TunedProfile,
  onboardingCountry: string | null,
): string {
  if (profile.country && onboardingCountry) return onboardingCountry;
  return profile.countryLabel;
}
```

So a Plus user who picked Japan gets "Japan" on Streaming, Downloading and Privacy, while Gaming, Travel and Access keep their rule-based labels. A Free user, who never sees a country selector, gets `countryLabel` for all six — identical to today's behaviour for four of them and corrected for the two in Gap 1.

## 6. Free-plan behaviour

Unchanged. `profilesLocked = isFreePlan && hasOnboardingIntents` still disables the generated rows and still shows the Plus teaser banner. This handoff changes what the rows *say*, never who can use them.

This matters for honesty: on Free the sidebar rows are visible, correctly named, correctly described, and disabled with an aspiration framing. That is the same treatment the tuning screen gives a locked profile, so the two screens agree. The one concept that proposes a genuinely usable free profile (`03-draft.md`) owns that entitlement question itself and must not be built on the assumption that this spec grants it.

## 7. What must not change

- `profilesList` stays as the fallback for runs with no onboarding selection (skipped onboarding, `skipOnboarding`, the connection-failure exits). That path must remain byte-for-byte identical, including the default titles and subtitles.
- The Profiles tab default selection (`hasOnboardingIntents ? "profiles" : "countries"`), the profile count in the header, the "New profile" button, and the banner's dismissal persistence.
- `ProfilePreview` and `buildProfilePreviews` in [lib/jtbdMerge.ts](../../../src/app/onboarding-v2/lib/jtbdMerge.ts), and `ProfilesSummaryRow` — the default concept and the three existing alternatives still use them.

## 8. Verification

- `npx tsc --noEmit` clean; `npm run build` succeeds.
- Run onboarding on Free with Multiple selection picking Privacy then Downloading. The sidebar rows read "Privacy — Switzerland" and "Downloading — Netherlands", matching what the tuning screen showed, and both are disabled with the Plus teaser.
- Run on Plus with the country selector enabled and Japan chosen, picking Streaming and Gaming. Streaming reads "Japan"; Gaming still reads "Fastest country".
- Skip onboarding entirely. The Profiles tab shows all six original entries with their original titles and subtitles, and the Countries tab is the default selection.
- Take the connection-failure exit. `selectedCountry` is absent from the payload, `onboardingJtbds` is empty, and the sidebar falls back to `profilesList`.
- Confirm the glyph on each generated row is the same glyph the tuning screen showed for that intent.

## 9. Open items

- **The destination is descriptive, not functional.** Clicking a generated profile row does not connect to that country — `ProfileRow` has no connect handler today and this spec does not add one. The label is honest about intent, but a user who clicks expecting a connection gets nothing. Worth resolving before any concept leans on "one tap" language too hard, and worth noting that `05-rehearsal.md` is the concept most exposed to this gap.
- **[UNVERIFIED]** Whether the real product generates profiles from onboarding intents at all, or only reorders a fixed set. This spec follows the prototype's existing behaviour (reorder and rename the same six) rather than inventing creation.
