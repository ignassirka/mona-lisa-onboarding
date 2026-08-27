# Concept 1 — The Shelf

**Concept id:** `profiles-shelf`
**Dropdown label:** `Profiles — Shelf gallery`
**Build order:** third. Needs no product decision; the safest of the five to build and the weakest on clarity.

> Prerequisite: [_foundation.md](_foundation.md). Registration follows [_foundation.md](_foundation.md) §7.

## 1. Essence

The tuning screen resolves into a shelf of named, ready-made setups laid out as equals — and the first one on the shelf is the free user's own protection, already switched on.

Where [04-baseline.md](04-baseline.md) separates protection from shortcuts into two visual registers, this concept puts them in one register as peers and lets position and state carry the difference. Breadth-first: the whole set is visible at a glance.

## 2. What the user sees

Body slot at `bodyMaxWidthClassName="max-w-[920px]"`.

A single line beneath the header reassures that these are shortcuts rather than choices, and then the shelf fills the remainder: a grid of cards, all the same shape and size, where the first cell is **"Everyday protection"** and the rest are the user's profiles in selection order.

The leading card is lit and active. Its status line reads "On now — covers everything you picked", its second line names every selected intent, and its body holds the tuned settings as chips. It is the same size and shape as its neighbours, so it reads as a member of the collection, not a preamble to it.

Each profile card carries, top to bottom: the intent glyph and profile name; a destination chip; one future-tense sentence; a contents strip of chips; and a state label. On Free the profile cards read "Available with VPN Plus".

Beneath the shelf: the sidebar dock illustration with its caption, and if the data has one, a muted line naming the top-ranked Plus feature.

## 3. Component tree

New folder `src/app/onboarding-v2/tuned-result/concepts/profiles-shelf/`.

**`ProfilesShelfConcept.tsx`**

```tsx
export const PROFILES_SHELF_CONCEPT = "profiles-shelf";

export default function ProfilesShelfConcept({
  jtbdKey, selectionMode = "single", selectedJtbds,
  tone = "straightforward", userPlan = "free", onContinue, onBack,
}: TuningConceptProps)
```

**`BaselineCard.tsx`** — the leading cell. Deliberately a separate component rather than a `ProfileCard` variant, because it represents something categorically different (an always-on state, not a shortcut) and conflating them would invite the two to drift toward each other visually, which is the one thing that would break this concept.

```tsx
interface BaselineCardProps {
  settingRows: SettingRow[];
  rowStages: RowStage[];
  rowMounted: boolean[];
  intentNames: string[];
  /** True once every settingRow has resolved. */
  settled: boolean;
  size: ProfileCardSize;
  reduced: boolean;
}
```

It must match `ProfileCard`'s outer box geometry exactly at the same `size` — same padding, radius, and min-height — so the grid is even. Its *treatment* differs: filled and lit where profile cards are outlined and muted.

**`ShelfCard.tsx`** — thin wrapper over the shared `ProfileCard`:

```tsx
interface ShelfCardProps {
  profile: TunedProfile;
  /** effectiveProfileSettings output — see §7. */
  settings: ProfileSetting[];
  unlocked: boolean;
  size: ProfileCardSize;
}
// <ProfileCard size={size} sentence="effect" showContents showComposition
//   settings={settings} state={unlocked ? "active" : "locked"} ... />
```

Note `sentence="effect"`, not `"delta"`. In this concept cards stand alone as descriptions of themselves, so they use `TunedProfile.effectSentence` ("Use this and Proton VPN connects you through…"). The delta phrasing belongs to concepts that frame profiles relative to a baseline bar.

### Adaptive density

Total cells is `1 + profileRows.length`, so two to seven. To keep the screen height stable across selection counts:

- Two to four cells: `size="card"`, `grid-cols-2`
- Five to seven cells: `size="tile"`, `grid-cols-3`

At `size="tile"` the contents strip drops to the destination chip only and the sentence truncates to two lines. This is a real information trade at high selection counts and is called out as a risk in §11.

## 4. States

**Intro / applying.** `ConceptFrame` owns the intro. At `introDone` the `BaselineCard` mounts in its unsettled state ("Turning on your protection…", spinner in place of the lit glyph) and fills in one settings chip per resolving setting row. Profile cards then mount one at a time through `MaterializingSlot`, Phase 1 using `PhaseOnePlaceholder` at `arrangement="block"` so the placeholder occupies the same box as the resolved card and there is no size pop.

**Resolved, Free.** Baseline card lit and settled. Profile cards `state="locked"`: dimmed glyph, muted text, Plus availability label, and `DestinationChip` with `planAware` so Plus-only destinations carry the badge.

**Resolved, Plus.** Profile cards `state="active"`, no badges, no availability labels. The baseline card is identical on both plans.

**Reduced motion.** `reduced` passed to `ConceptFrame` and every `MaterializingSlot`. The baseline card renders settled immediately. Cards fade in without Phase 1.

## 5. Motion

All existing keys, no new ones. `centerHold` / `moveToTop` / `iconCrossfade` in `ConceptFrame`; `spinnerHold`, `resolveDuration`, `rowGap` per card via the shared schedule, with `spinnerHoldCompressed` engaging automatically past `pacingGuardRowThreshold` (six rows), which happens at four or more selected intents.

The baseline card must materialize **before** the first profile card, which the row schedule in [_foundation.md](_foundation.md) §5.3 already guarantees — setting rows occupy indices `0..s-1`, ahead of every profile row. Reading order and reveal order agree, which is what lets the baseline card set the frame for everything after it.

## 6. Copy

New key in `TUNING_CONCEPTS_COPY` in [conceptsCopy.ts](../../../src/app/onboarding-v2/tuned-result/conceptsCopy.ts):

```ts
profilesShelf: {
  baselineDuring: "Turning on your protection…",
  baselineStatus: "On now — covers everything you picked.",
  shelfIntro: "Your protection is already on. These are shortcuts you can use any time.",
},
```

From `profilesCopy.ts`: `BASELINE_NAME` for the leading card's title, `baselineCoverage(intentNames)` for its second line, `PLUS_AVAILABILITY_LABEL`, `PERSISTENCE_CAPTION` as the dock illustration's caption.

Card sentences come from `TunedProfile.effectSentence`. Every one opens "Use this and Proton VPN connects you…", which is what makes seven cards scannable in parallel — the reader learns the sentence shape once and can then diff them.

Header strings come from `useProfilesConceptData` unchanged; all four tones work.

## 7. Data requirements

From `useProfilesConceptData`: `settingRows`, `intentNames`, `profileRows`, `plusFeatureRows`, `paidUnlocked`, and the materialization state.

Per card, from `TunedProfile`: `name`, `icon`, `countryLabel`, `freeRunnable`, `effectSentence`.

Contents-strip settings come from **`effectiveProfileSettings(jtbd, baselineSettings)`**, never `profileSettings` directly ([_foundation.md](_foundation.md) §2.2b). This matters here specifically: the shelf shows all cards at once, so a Multiple-mode selection would put the baseline card's Kill Switch `"Advanced"` directly next to a Gaming card claiming `"Standard"`, and the contradiction would be visible in a single glance rather than needing navigation to find. `profileSettings(jtbd).length` is still fine for the composition count, since the length is the same either way.

Nothing missing from the foundation.

## 8. Settings tuning: stays

**Stays, demoted twice over.** The settings never appear as their own list or section again. They appear in exactly two places: as the contents chips inside the baseline card, and as the contents strip on each profile card — the latter resolved through `effectiveProfileSettings` so the two can never disagree (§7).

Rationale: the chips are what make a card feel like an object with parts rather than a black box, and they are the evidence that stops the cards from being unfalsifiable marketing. But they were never the emotional payoff, so they never get their own row.

At `size="tile"` (five or more cells) the per-card settings chips are dropped and only the destination chip remains. The baseline card keeps its settings chips at every size — it is the one card where the settings are the substance rather than the detail.

## 9. The mandated behaviours

**What a Free user gets.** One real, working, named setup that is already on — "Everyday protection" — sitting first on the shelf in the same visual language as everything else, plus full inspection rights over every profile card.

This is honest rather than a consolation prize. The merged baseline genuinely is a configuration built from the user's stated intents, it genuinely is active, and it genuinely covers every intent selected. What the shelf changes is that it stops being an anonymous list of applied settings and becomes a named thing the user owns. "2 settings applied" is a receipt; "Everyday protection — on now" is a possession. The framing shift is the whole free-tier answer, and it requires **no new entitlement**.

**Clarity about what a profile does.** Four layers per card: name, destination, sentence, contents. The sentence carries most of the weight, which makes reading the clarity mechanism — the weakest of the five approaches, and the honest limitation of this concept. A jargon-averse first-time user faced with up to six similar sentences may read one and skip the rest. The parallel sentence structure (§6) and the contents chips are the mitigations, and they are partial.

**R1 — "Why not one profile with all of them?"** Answered by making that profile the first card on the shelf. `BASELINE_NAME` plus `baselineCoverage(intentNames)` names it and enumerates what it covers. The others are visibly additive, and a user looking for the combined option finds it in the first position rather than being told the question is misplaced.

**R2 — "Travel but also privacy?"** The leading card's status line sits above the profile cards in reading order and reveal order, so the answer arrives before the question forms. `shelfIntro` states it once in words directly beneath the header, in the position Jira's template picker uses for the same job.

This is the concept's weakest reassurance, because it depends on the baseline card winning a visual hierarchy contest against up to six same-sized peers. [04-baseline.md](04-baseline.md) exists partly because that contest is fragile.

**R3 — persistence.** This is the concept that uses `SidebarDockIllustration`, docked beneath the shelf with `PERSISTENCE_CAPTION`, in its default static mode (`live` off). Map each profile to a `DockEntry` at the call site — `{ id: jtbd, name, icon, locked: !paidUnlocked }` — so a Free user's preview shows the rows muted with the availability label, matching what [_sidebar-handoff.md](_sidebar-handoff.md) §6 actually delivers rather than over-promising. Showing the destination beats describing it, and the shelf has the horizontal room for it that the two-register concept does not.

## 10. Wiring

Per [_foundation.md](_foundation.md) §7, with `PROFILES_SHELF_CONCEPT` as the analytics id. Nothing concept-specific.

## 11. Trade-offs, risks, verification

**Risks.**

- **Density.** Six intents means seven information-dense cards. The adaptive density rule (§3) keeps the height stable but pays for it by dropping the per-card settings chips at exactly the selection counts where users picked the most and might most want detail.
- **The 1:6 perception problem.** One active card among six locked ones can read as a value ratio no matter how prominently the active one is placed. Mitigating this depends entirely on the baseline card winning the hierarchy contest, which is a fragile thing to depend on and the main reason this concept is not recommended first.
- **Clarity is reading** (§9). The concept's core weakness, and structural rather than fixable with better copy.
- **Two card components must stay geometrically identical.** `BaselineCard` and `ProfileCard` are separate on purpose (§3), which means an uneven grid is a live regression risk whenever either changes. Worth a visual check in review rather than trusting it.

**Verification.**

- `npx tsc --noEmit` clean; `npm run build` succeeds.
- Single mode: two cells (baseline plus one profile) at `size="card"`, `grid-cols-2`, evenly sized.
- Multiple mode at two, three, four, five and six intents: cell count is always `1 + n`, the density rule switches at five cells, and the body does not scroll at seven cells on the default window size.
- The baseline card materializes before any profile card, at every selection count.
- Baseline card geometry matches profile card geometry exactly at both sizes.
- Free plan: every profile card locked with the availability label; Plus-only destinations (Streaming, Privacy, Access) badged; free-runnable ones (Gaming, Travel, Downloading) not.
- Plus plan: no badges or availability labels; Continue exits to the app, not the upsell.
- Each of the six cards shows the correct `effectSentence`, and no sentence contains a technical term.
- Contents chip values match `JTBD_TUNING_RESULT` for that intent.
- The dock illustration shows one icon per selected profile, matching the glyphs on the cards.
- All four tones render without layout breakage.
- `prefers-reduced-motion`: everything present immediately, no spinners, no centered-to-top travel.
- The default `TunedResult` and the three existing concepts are unchanged.
