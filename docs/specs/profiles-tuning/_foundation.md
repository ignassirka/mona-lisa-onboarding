# Foundation — shared prerequisites for the profiles-first tuning concepts

## Purpose

Five design concepts (`01-shelf.md` through `05-rehearsal.md`) explore making **Profiles the primary outcome of the tuning screen** instead of a small locked preview. All five depend on the same three things that do not exist in the codebase today:

1. A profile object that is more than a label — one with a destination, the settings it carries, and a plain-language description of what it does.
2. A notion of which destinations a Free-plan user can actually reach.
3. Plan-awareness on the concept axis, which is currently hardcoded to Free.

This document specs those three, plus the shared components, copy homes, and wiring recipe every concept reuses. **Build this first.** The five concept specs assume the type names defined here.

## Status

Spec — not implemented. These are build inputs, not a record of what exists.

Per the project documentation protocol, `docs/features/` is the living record of shipped behaviour. When any of these concepts is implemented, the implementing task updates [docs/features/onboarding-v2.md](../../features/onboarding-v2.md) (section "Tuning alternative concepts") and the Feature Index in [docs/features/_overview.md](../../features/_overview.md). This spec directory is not a substitute for that.

## Scope

Stage 2 (the tuning result screen) in full, plus the sidebar handoff specced separately in [_sidebar-handoff.md](_sidebar-handoff.md). Stage 3 (Plus Welcome) is out of scope for all five concepts and keeps its current behaviour.

---

## 1. The gap: what exists today

The only profile-shaped object in the onboarding code is `ProfilePreview` in [src/app/onboarding-v2/lib/jtbdMerge.ts](../../../src/app/onboarding-v2/lib/jtbdMerge.ts):

```ts
export interface ProfilePreview {
  jtbd: JtbdId;
  label: string;   // from JTBD_PROFILE_LABEL
  icon: string;    // from JTBD_ICONS
}
```

Built by `buildProfilePreviews(selectedJtbds)`, rendered by [ProfilesSummaryRow.tsx](../../../src/app/onboarding-v2/tuned-result/ProfilesSummaryRow.tsx) as one pill per intent. No country. No settings. No description. It is a label with an icon, which is exactly why the current screen cannot answer "what will happen if I click".

Separately, the main app has six hardcoded `ProfileEntry` items in [src/app/components/CountryBrowser.tsx](../../../src/app/components/CountryBrowser.tsx) (`profilesList`, line ~343) with static subtitle strings. Nothing connects the two. See [_sidebar-handoff.md](_sidebar-handoff.md).

---

## 2. New file: `src/app/onboarding-v2/lib/jtbdProfiles.ts`

The single source of truth for what a profile is. All five concepts read from this and nothing else.

### 2.1 Types

```ts
import type { JtbdId } from "./jtbdData";

/** One setting a profile carries. Derived from `JTBD_TUNING_RESULT`, never
 * authored here, so a profile can never claim a setting value the tuning
 * screen doesn't actually apply. */
export interface ProfileSetting {
  /** "Protocol" | "Kill Switch" */
  label: string;
  /** e.g. "Smart", "WireGuard UDP", "Stealth", "Advanced", "Standard" */
  value: string;
  /** The same plain-language explanation the tuning rows already use. */
  tooltip?: string;
}

export interface TunedProfile {
  jtbd: JtbdId;
  /** Card and sidebar name. Reuses `JTBD_PROFILE_LABEL` — no new naming. */
  name: string;
  /** Concrete destination, or `null` when the profile targets a RULE
   * ("fastest nearby", "fastest outside your country") rather than a fixed
   * country. When non-null it MUST be a name present in `countryMarkers`
   * so `resolveVpnDestination` can resolve it. */
  country: string | null;
  /** What the user reads as the destination. Matches the subtitle strings
   * `CountryBrowser`'s `profilesList` already uses, so the tuning screen and
   * the sidebar say the same thing. */
  countryLabel: string;
  /** True when a Free-plan user can actually reach this destination. See
   * §3 for how this is determined and what the UI must do when false. */
  freeRunnable: boolean;
  /** Future-tense sentence: what happens if you use this. One sentence,
   * no jargon, same grammatical shape across all six. */
  effectSentence: string;
  /** The same effect phrased as an ADDITION to the tuned baseline, for
   * concepts that frame profiles as shortcuts on top of protection. */
  deltaSentence: string;
  /** Card accent. See §2.4 — placeholder values pending design sign-off. */
  accent: string;
  /** Glyph. Reuses the same six profile icons the sidebar already uses. */
  icon: string;
}
```

### 2.2 Derived settings helper

Settings are read, never authored, so profile content cannot drift from what the screen applies:

```ts
import { JTBD_TUNING_RESULT } from "./jtbdTuningResult";

export function profileSettings(jtbd: JtbdId): ProfileSetting[] {
  return JTBD_TUNING_RESULT[jtbd].enabled.map((f) => ({
    label: f.settingsName,
    value: f.value,
    tooltip: f.tooltip,
  }));
}
```

This always returns exactly two entries — Protocol then Kill Switch — because `JTBDTuningResult.enabled` is typed as a 2-tuple. Concepts that show a count ("1 country, 2 settings") derive it from `profileSettings(jtbd).length`, never a literal.

### 2.2b A profile must never be a downgrade

`profileSettings` alone is not safe to display in Multiple mode, and this is the subtlest correctness rule in the whole family.

In Single mode a profile's settings are identical to the baseline's, because both read the same `JTBD_TUNING_RESULT[jtbd].enabled`. In Multiple mode the baseline is the *merged* union, resolved by "strictest wins" via `SETTING_VALUE_PRIORITY` in [lib/jtbdMerge.ts](../../../src/app/onboarding-v2/lib/jtbdMerge.ts). So a single intent's own value can be weaker than the merged baseline. Selecting Gaming and Privacy merges Kill Switch to `"Advanced"` (Privacy's stricter value wins), while Gaming's own value is `"Standard"`.

Displaying Gaming's profile with `"Standard"` would tell the user that using the Gaming shortcut *lowers* their protection. That directly contradicts reassurance R2 (§6), and it would be contradicted by the product's own merge rule.

Every concept therefore displays **effective** settings, never raw ones:

```ts
import { SETTING_VALUE_PRIORITY } from "./jtbdMerge";

/** A profile's settings as the user would actually experience them: the
 * STRICTER of the profile's own value and the current merged baseline, per
 * SETTING_VALUE_PRIORITY (index 0 = strictest). Guarantees a profile is
 * never presented as weakening protection the user already has — which is
 * what makes reassurance R2 a fact about the product rather than a claim in
 * the copy. In Single mode the two inputs are identical and this is a
 * no-op. */
export function effectiveProfileSettings(
  jtbd: JtbdId,
  baselineSettings: ProfileSetting[],
): ProfileSetting[];
```

Resolution rule per setting name: if either value is absent from `SETTING_VALUE_PRIORITY[label]`, keep the profile's own value rather than guessing. Otherwise take whichever has the lower index. Carry the winning value's `tooltip` along with it, so the explanation always matches the value shown.

`ProfileCard`, `SettingChip` consumers, and any before/after comparison take their settings from this function. `profileSettings` remains exported for the count and for Single-mode use, but no concept should render its values directly.

### 2.3 The table

Icons import from the same six assets `CountryBrowser` already uses (`src/imports/profile-icons/profile-icon-*.svg`), so the glyph a user sees during tuning is the glyph in their sidebar.

```ts
export const JTBD_PROFILES: Record<JtbdId, TunedProfile> = { ... };
```

All six entries, authored in full:

**`streaming`**
- name: `"Streaming"` (`JTBD_PROFILE_LABEL.streaming`)
- country: `"United States"`, countryLabel: `"United States"`
- freeRunnable: `false`
- icon: `profile-icon-streaming.svg`
- effectSentence: `"Use this and Proton VPN connects you through the United States and applies the settings that keep video playing smoothly."`
- deltaSentence: `"Everything above, plus a United States connection tuned for smooth video."`

**`gaming`**
- name: `"Gaming"`
- country: `null`, countryLabel: `"Fastest country"`
- freeRunnable: `true`
- icon: `profile-icon-gaming.svg`
- effectSentence: `"Use this and Proton VPN connects you to the fastest nearby country and applies the settings built to keep your game responsive."`
- deltaSentence: `"Everything above, plus the fastest nearby connection tuned to stay responsive."`

**`downloading`**
- name: `"Downloading"`
- country: `"Netherlands"`, countryLabel: `"Netherlands"`
- freeRunnable: `true`
- icon: `profile-icon-p2p.svg`
- effectSentence: `"Use this and Proton VPN connects you through the Netherlands and applies the settings that keep a download protected from start to finish."`
- deltaSentence: `"Everything above, plus a Netherlands connection tuned to keep downloads protected."`

**`travel`**
- name: `"Travel"`
- country: `null`, countryLabel: `"Fastest country"`
- freeRunnable: `true`
- icon: `profile-icon-business.svg`
- effectSentence: `"Use this and Proton VPN connects you to the fastest nearby country and applies the settings that keep you safe on Wi-Fi you don't control."`
- deltaSentence: `"Everything above, plus the fastest nearby connection tuned for Wi-Fi you don't control."`

**`privacy`**
- name: `"Privacy"`
- country: `"Switzerland"`, countryLabel: `"Switzerland"`
- freeRunnable: `false`
- icon: `profile-icon-security.svg`
- effectSentence: `"Use this and Proton VPN connects you through Switzerland and applies the strictest protection settings."`
- deltaSentence: `"Everything above, plus a Switzerland connection on the strictest settings."`

**`bypass`**
- name: `"Access"`
- country: `null`, countryLabel: `"Fastest outside your country"`
- freeRunnable: `false`
- icon: `profile-icon-anticensorship.svg`
- effectSentence: `"Use this and Proton VPN connects you to the fastest country outside your own and applies the settings that let your connection through networks that block VPNs."`
- deltaSentence: `"Everything above, plus a connection outside your country that gets through networks that block VPNs."`

**Why these countries.** Each is either already implied by existing app data or is a real member of an existing filter list, so nothing is invented:

- Streaming's `"United States"` matches `profilesList`'s existing `streaming-us` subtitle exactly.
- Downloading's `"Netherlands"` is in `p2pCountries` in `CountryBrowser.tsx` and is also the app's fastest-server destination (`VPN_SERVER`), which is what makes it free-runnable.
- Privacy's `"Switzerland"` is in `secureCoreCountries`, matching the existing `max-security` entry's "Fastest - Secure Core" intent.
- Gaming and Travel use the fastest-nearby rule, which is genuinely the right answer for latency and for Wi-Fi safety respectively, and matches their existing `profilesList` subtitles ("Fastest country").
- Bypass's "fastest outside your country" matches the existing `anticensors` subtitle "Fastest (excluding my country)" and the intent's own Plus feature, "Fastest outside-country".

**Copy rules for `effectSentence` and `deltaSentence`.** Both are tone-constant, matching the existing convention where settings names and values never vary by tone while outcome sentences do (see `JTBD_TONE_OUTCOMES` in [lib/jtbdTuningToneCopy.ts](../../../src/app/onboarding-v2/lib/jtbdTuningToneCopy.ts)). Every `effectSentence` opens "Use this and Proton VPN connects you…" and every `deltaSentence` opens "Everything above, plus…" so the six read in parallel and a user learns the shape once. No sentence may reference protocol names, NAT, IP, ports, or encryption. Nothing may promise access to a named third-party service.

### 2.4 Accent colours — open item

`accent` exists as a field because three concepts (Shelf, Baseline, Rehearsal) give each profile a visual identity. This prototype has no six-colour categorical palette; the only accents in use are `#6d4aff` (primary purple) and `rgba(44,255,204,*)` (applied/success teal).

Seed all six entries with `#6d4aff` and treat per-intent colour as **[UNVERIFIED] — needs design sign-off**. Concepts must not depend on colour to carry meaning: identity comes from the icon and the name, and colour is decoration layered on later. A concept that becomes unreadable at a single accent colour is mis-specced.

### 2.5 Convenience selector

```ts
export function profilesForSelection(selectedJtbds: JtbdId[]): TunedProfile[];
```

Returns one `TunedProfile` per selected intent, in selection order, mirroring `buildProfilePreviews`'s ordering contract exactly. `ProfilePreview` and `buildProfilePreviews` stay untouched — the default concept and the three existing alternatives keep using them, so nothing that works today changes.

---

## 3. Free-tier destinations

### 3.1 What is actually true today

There is no free-versus-Plus country list anywhere in the codebase. Tiering is behavioural:

- Free: always "Fastest country", resolving to the single hardcoded `VPN_SERVER` in [lib/server.ts](../../../src/app/onboarding-v2/lib/server.ts) — Netherlands / Amsterdam. Onboarding never shows a country picker on Free (`showCountrySelect = plan === "plus" && countrySelectionEnabled`).
- Plus: all 93 names from `countryMarkers`, via `CountrySelect` and `resolveVpnDestination`.
- In the main app, `countriesLocked = isFreePlan && vpnStatus === "unprotected"` disables individual country rows while the fastest row stays active.

### 3.2 What to add

```ts
/** Destinations a Free-plan run can actually reach. Mirrors what
 * `lib/server.ts` already does — Free resolves every connection to
 * `VPN_SERVER` — rather than describing the real product's free country
 * list, which this prototype has no data for. */
export const FREE_TIER_COUNTRIES: readonly string[] = [VPN_SERVER.country];

/** A profile is free-runnable when it targets the fastest-country rule (no
 * fixed country) or a country in FREE_TIER_COUNTRIES. `bypass` is the one
 * exception: its rule ("fastest OUTSIDE your country") depends on the Plus
 * "Fastest outside-country" feature, so it is not free-runnable despite
 * having a null country. */
export function isFreeRunnable(profile: TunedProfile): boolean;
```

**[UNVERIFIED]** The real Proton VPN free tier offers more than one country. `FREE_TIER_COUNTRIES` here describes this prototype's own behaviour only, and the real list needs product confirmation before any concept claims a specific number of free countries. No concept may state a count of free countries.

### 3.3 Display rules when `freeRunnable` is false

Non-negotiable across all five concepts:

- The destination is still shown, in full, by name. Never hidden, never blurred.
- Its state reads **"Available with VPN Plus"** — aspiration, never an error, never a failure, never a warning colour.
- Where a concept offers to run or rehearse a profile (Deck, Rehearsal), a non-free-runnable profile either offers the free fallback with explicit language — "We'll use a free location for this. The settings are the same." — or is presented as a demonstration rather than a connection. Each concept states which it does and must never let a simulation read as a real connection.

---

## 4. Plan-awareness on the concept axis

### 4.1 Why this is needed

Every one of the five concepts has a mandatory Free-user answer and a different Plus state, but the concept axis is currently Free-only by construction. Two changes, both small and both backwards-compatible.

### 4.2 `TuningConceptProps`

In [tuned-result/concepts/types.ts](../../../src/app/onboarding-v2/tuned-result/concepts/types.ts), add one optional prop and update the doc comment, which currently explains the omission:

```ts
import type { SessionPlan } from "../../../lib/sessionPlan";

export interface TuningConceptProps {
  jtbdKey: JTBDKey;
  selectionMode?: SelectionMode;
  selectedJtbds?: JTBDKey[];
  tone?: ToneOfVoice;
  /** Defaults to "free" — the behaviour every existing concept has today,
   * unchanged. The profiles concepts branch on this. */
  userPlan?: SessionPlan;
  onContinue: () => void;
  onBack: () => void;
}
```

Optional with a `"free"` default means `ProgressRingConcept`, `ChecklistConcept`, and `ReceiptConcept` need no edit and keep their current behaviour byte-for-byte.

### 4.3 `useTuningConceptData` stays untouched

The existing hook is **not modified**. Two reasons:

- It is shared by the three existing concepts, and its row schedule is load-bearing for all of them.
- It only emits a profiles row when Multiple mode is active (`isMultipleActive`, requiring two or more selected intents). In Single mode there is no profiles row at all — which makes it structurally unusable for concepts whose entire subject is profiles, since a user who picks one intent would see none.

Plan-awareness and the profiles-first row schedule both live in a new sibling hook instead. See §5.3.

### 4.4 `OnboardingV2` render blocks

Each new concept's render block passes `userPlan={plan}` alongside the existing props, and routes Continue the same way `TunedResult` already does, so a Plus run skips the upsell:

```tsx
onContinue={() => (plan === "plus" ? handleExit(effectiveSelectedJtbds, "plus") : setPhase("upsell"))}
```

Note this differs from the three existing concepts, which always `setPhase("upsell")`. The profiles concepts must use the plan-aware form, because they render a real Plus state and sending a Plus user to the upsell afterwards would contradict it.

---

## 5. Components

### 5.1 Reused unchanged

No edits to any of these:

- [ConceptFrame.tsx](../../../src/app/onboarding-v2/tuned-result/concepts/ConceptFrame.tsx) — Back, the centered-to-top header, Continue, and the `children` body slot. All five concepts are body implementations. Body width is set per concept via `bodyMaxWidthClassName` (default `max-w-[704px]`).
- [MaterializingSlot.tsx](../../../src/app/onboarding-v2/tuned-result/MaterializingSlot.tsx) — the two-phase spinner-to-resolved crossfade, `stage: RowStage`.
- [PhaseOnePlaceholder.tsx](../../../src/app/onboarding-v2/tuned-result/PhaseOnePlaceholder.tsx) — spinner plus narration, `arrangement: "row" | "block"`.
- [BoundaryDivider.tsx](../../../src/app/onboarding-v2/tuned-result/BoundaryDivider.tsx), [CircleSlashIcon.tsx](../../../src/app/onboarding-v2/tuned-result/CircleSlashIcon.tsx), [Spinner.tsx](../../../src/app/onboarding-v2/components/Spinner.tsx), `UnlockedChip` from [TransformingPaidCell.tsx](../../../src/app/onboarding-v2/tuned-result/TransformingPaidCell.tsx).
- [useTunedMaterialization.ts](../../../src/app/onboarding-v2/tuned-result/useTunedMaterialization.ts) and `TUNED_RESULT_TIMING` from [timing.ts](../../../src/app/onboarding-v2/tuned-result/timing.ts).
- `useReducedMotion` from [versions/lib/useReducedMotion.ts](../../../src/app/onboarding-v2/versions/lib/useReducedMotion.ts) — each concept calls it itself and passes `reduced` to `ConceptFrame`, matching the existing convention.

### 5.2 New shared components

New folder `src/app/onboarding-v2/tuned-result/profiles/`. These four are shared by two or more concepts; anything used by exactly one concept lives in that concept's own file.

**`ProfileCard.tsx`**

The workhorse. One component, three sizes, so the Shelf's grid, the Baseline's tiles, and the Deck's focused card share one implementation and cannot drift.

```tsx
export type ProfileCardSize = "tile" | "card" | "hero";
export type ProfileCardState = "locked" | "active" | "running";

interface ProfileCardProps {
  profile: TunedProfile;
  size: ProfileCardSize;
  state: ProfileCardState;
  /** Which sentence to show. Concepts framing profiles as additions to the
   * baseline pass "delta"; concepts presenting them standalone pass "effect". */
  sentence?: "effect" | "delta" | "none";
  /** Show the derived "1 country · 2 settings" composition line. */
  showComposition?: boolean;
  /** Show the destination and setting chips. */
  showContents?: boolean;
  /** REQUIRED when showContents is true. Must be the output of
   * effectiveProfileSettings (§2.2b) — the card deliberately does not derive
   * settings from `profile` itself, because doing so would let a caller
   * render a value weaker than the baseline. Making it a prop puts the rule
   * at the component boundary instead of trusting six call sites. */
  settings?: ProfileSetting[];
  onClick?: () => void;
  /** Rendered under the body — per-concept actions (Try, Keep, Rehearse). */
  footer?: ReactNode;
}
```

Size contract: `tile` is compact and grid-friendly (icon, name, destination chip, optional one-line sentence); `card` adds the contents chips and composition line; `hero` is the focused single-card treatment with room for a visual above the body. `state="locked"` uses the same aspiration treatment the existing locked rows use — dimmed icon, muted text, "Available with VPN Plus" — never an error style.

**`DestinationChip.tsx`**

```tsx
interface DestinationChipProps {
  profile: TunedProfile;
  /** When true, a non-free-runnable destination is marked Plus. */
  planAware?: boolean;
}
```

Renders `countryLabel`. When `planAware` and `!freeRunnable`, appends the Plus badge (`assets/vpn-plus-badge.svg`, the same asset the locked rows use). Single place where the §3.3 display rule is enforced, so no concept can get it wrong independently.

**`SettingChip.tsx`**

```tsx
interface SettingChipProps {
  setting: ProfileSetting;
  muted?: boolean;
}
```

The `{label}: {value}` pill. Visual language is lifted from the existing non-exported `SettingLabelPill` in [StackedLayout.tsx](../../../src/app/onboarding-v2/tuned-result/layouts/StackedLayout.tsx) — same shape, same tooltip behaviour via the existing Radix tooltip pattern. `StackedLayout` keeps its own copy; do not refactor it, since the default concept must stay untouched.

**`SidebarDockIllustration.tsx`**

```tsx
export interface DockEntry {
  id: string;
  name: string;
  icon: string;
  /** Rendered muted with the Plus availability label. */
  locked?: boolean;
}

interface SidebarDockIllustrationProps {
  entries: DockEntry[];
  caption?: string;
  /** Animates entries in and out on change. Off by default. */
  live?: boolean;
}
```

A small representation of the app sidebar with the profiles docked into it. This is reassurance R3 (§6) made visual rather than asserted. Its visual language matches `CountryBrowser`'s real profile rows and it uses the same six `profile-icon-*.svg` assets, so it reads as the actual sidebar the user is about to see.

It takes `DockEntry` rather than `TunedProfile` because two concepts need it with different inputs: `01-shelf.md` maps its profiles straight through, while `03-draft.md` drives it from user-renamed drafts that may combine several intents. Concepts map to `DockEntry` at the call site.

`live` exists for the same reason. Default off and unanimated for the static case; when on, entries animate in and out on change using Framer's `layout` with `resolveDuration`, so no new timing keys either way.

### 5.3 New hook: `useProfilesConceptData`

`src/app/onboarding-v2/tuned-result/profiles/useProfilesConceptData.ts`. The data layer all five concepts use, replacing `useTuningConceptData` for this family only.

It exists because the profiles concepts need a different row schedule: **one row per profile, always, in Single mode as well as Multiple**. It follows the same "mirror the derivation rather than share a parameterized one" convention `useTuningConceptData` itself documents, calls `useTunedMaterialization` exactly once, and imports the same merge engine and copy helpers, so pacing and tone stay identical to every other concept.

```ts
export interface SettingRow {
  index: number;
  setting: ProfileSetting;
  /** Tone-voiced outcome, via outcomeForEnabled / toneOutcome. */
  outcome: string;
}

export interface ProfileRow {
  index: number;
  profile: TunedProfile;
}

export interface PlusFeatureRow {
  index: number;
  featureName: string;
  outcome: string;
  tooltip?: string;
  asset: string;
}

/** Extends ConceptFrameData (§5.4), which supplies the header strings and
 * the frame-facing materialization fields — introDone, rowsComplete,
 * appliedSoFar, totalRows, isMultipleActive, continueDelayMs,
 * selectionCount, titleDuringText, titleCompleteText, introText,
 * summaryText, counterText. Listed there rather than repeated here. */
export interface ProfilesConceptData extends ConceptFrameData {
  /** Free settings shared by every selected intent — the tuned baseline.
   * Single mode: that intent's own 2. Multiple: the merged, ranked, capped
   * union (mergeFreeSettings -> rankFreeSettings -> capList at freeRowCap). */
  settingRows: SettingRow[];
  /** One per selected intent, in selection order. Length 1 in Single mode. */
  profileRows: ProfileRow[];
  /** Top-ranked Plus features. Capped at paidFeatureCap (currently 1) in
   * BOTH modes — see the note below. May be empty. */
  plusFeatureRows: PlusFeatureRow[];
  /** userPlan === "plus". Profiles and Plus features render active. */
  paidUnlocked: boolean;

  /** Per-row materialization state, same shape and semantics as
   * useTuningConceptData's. The indices above address these arrays. */
  rowStages: RowStage[];
  rowMounted: boolean[];
  boundaryVisible: boolean;

  jtbdLabel: string;
  /** Ordered intent names for baselineCoverage() and headline copy. */
  intentNames: string[];
}

export function useProfilesConceptData(
  jtbdKey: JTBDKey,
  selectionMode: SelectionMode,
  selectedJtbds: JTBDKey[] | undefined,
  tone: ToneOfVoice,
  reduced: boolean,
  userPlan: SessionPlan,
): ProfilesConceptData
```

**Row schedule.** Indices are assigned in this order, and this is the order the materialization sequence reveals them in:

1. `settingRows` — indices `0 .. s-1`
2. `profileRows` — indices `s .. s+p-1`
3. `plusFeatureRows` — indices `s+p .. s+p+f-1`

So `totalRows = s + p + f`.

**Boundary.** `boundaryIndex = settingRows.length` on Free, because profiles are the first Plus-only thing revealed — the free/Plus boundary falls exactly between the baseline settings and the profiles. On Plus (`paidUnlocked`), pass `boundaryIndex = totalRows` so `useTunedMaterialization` skips the boundary pause entirely, which is its documented behaviour for `boundaryIndex >= totalRows`. Concepts are free to ignore `boundaryVisible` if their design has no divider; several do.

**Selection handling.** `isMultipleActive` uses the same gate as everywhere else — `selectionMode === "multiple" && (selectedJtbds?.length ?? 0) >= 2`. With exactly one selection in Multiple mode the result is identical to Single mode, matching the convention every other multi-select surface in this codebase follows. `profileRows` is built with `profilesForSelection` on the effective selection, which is `selectedJtbds` when Multiple is active and `[jtbdKey]` otherwise.

**Plus features are capped in both modes**, unlike `useTuningConceptData`, which caps at `paidFeatureCap` in Multiple mode but shows both of an intent's `paid` features in Single mode. Here the cap applies either way, using `rankPaidFeatures` in Multiple mode and `FEATURES_RANK` order in Single mode. The reason is hierarchy: profiles are the subject of these five concepts, and a Single-mode screen with one profile and two competing Plus feature rows would bury it. `paidFeatureCap` is currently `1`, so `plusFeatureRows` holds at most one entry and every concept renders it as a single muted line rather than a section.

**Row counts stay small.** With six intents selected: two setting rows (only Protocol and Kill Switch exist), six profile rows, one Plus feature row — nine total. That exceeds `pacingGuardRowThreshold` (6), so `useTunedMaterialization` compresses `spinnerHold` to `spinnerHoldCompressed` automatically. No new timing keys, and no concept needs its own pacing logic.

**Honest counts.** `summaryText` must describe what is actually on screen, matching the convention documented for the default concept. Use the existing `summarySubtextMultiple(tone, applied, features)` and `summarySubtext(tone, applied, locked)` helpers from [copy.ts](../../../src/app/onboarding-v2/tuned-result/copy.ts), passing `settingRows.length` as applied and `profileRows.length + plusFeatureRows.length` as the Plus-side count. Never a literal.

### 5.4 Making `ConceptFrame` accept either hook

`ConceptFrame` currently requires `data: TuningConceptData`, so `ProfilesConceptData` would not type-check against it. Rather than widen the prop to a union or duplicate the frame, extract the subset the frame actually consumes.

`ConceptFrame` reads exactly twelve fields — verified by reading the component, not assumed:

```ts
/** The only fields ConceptFrame consumes. Extracted so both the original
 * concept hook and the profiles hook can drive the same frame without one
 * knowing about the other. */
export interface ConceptFrameData {
  introDone: boolean;
  rowsComplete: boolean;
  appliedSoFar: number;
  totalRows: number;
  isMultipleActive: boolean;
  continueDelayMs: number;
  selectionCount: number;
  titleDuringText: string;
  titleCompleteText: string;
  introText: string;
  summaryText: string;
  counterText: (applied: number, total: number) => string;
}
```

Three changes, all mechanical and none behavioural:

1. Declare `ConceptFrameData` in [concepts/types.ts](../../../src/app/onboarding-v2/tuned-result/concepts/types.ts).
2. `export interface TuningConceptData extends ConceptFrameData` in `useTuningConceptData.ts`, removing the twelve now-inherited members. Every existing consumer keeps the same structural type.
3. Change `ConceptFrameProps.data` from `TuningConceptData` to `ConceptFrameData`.

`ProfilesConceptData extends ConceptFrameData` then satisfies the frame directly. The three existing concepts pass a `TuningConceptData`, which still satisfies the narrowed prop, so they need no edit and behave identically.

---

## 6. The three reassurances — shared checklist

All three are grounded in real usability feedback. Every concept spec has a section mapping each one to specific on-screen elements. A concept that only answers these in body copy has not answered them.

**R1 — "Why don't I have one profile that incorporates all of them?"**

Users expect combination. The truthful answer is that the combined setup already exists and is already running: the merged tuning applies the union of every selected intent's free settings, and profiles are optional shortcuts on top of it. Each concept must either name that combined baseline as a first-class object on screen, or let the user act on the instinct directly. Do not answer this by explaining that the question is misplaced.

**R2 — "What if I want to travel but I also want privacy?"**

This is a hierarchy misunderstanding: a list of profiles reads as mutually exclusive options because nothing says otherwise. The truth is that the tuned baseline protects every selected use case and profiles never remove protection. Concepts should make the exclusive reading structurally unavailable rather than rebutting it in a sentence. The strongest available levers are the "Everything above, plus…" `deltaSentence` pattern, a visually dominant always-on baseline element, and any interaction that visibly returns to the protected state.

**R3 — "Will these still be here later?"**

Users fear losing a setup they were just shown. Answered by `SidebarDockIllustration`, by naming the destination inside action labels ("Keep this in my sidebar" rather than "Save"), and by the handoff in [_sidebar-handoff.md](_sidebar-handoff.md) actually being true. Prefer showing the destination over describing it.

### Shared copy

New file `src/app/onboarding-v2/tuned-result/profiles/profilesCopy.ts` for strings more than one concept uses:

- `PLUS_AVAILABILITY_LABEL = "Available with VPN Plus"`
- `BASELINE_NAME = "Everyday protection"` — the name for the merged tuned baseline when a concept presents it as an object
- `baselineCoverage(intentNames: string[]): string` — "Covers streaming, gaming and travel", built from `JTBD_PROFILE_LABEL`, with correct comma and "and" joining for one through six items
- `PERSISTENCE_CAPTION = "These stay in your sidebar. Use one any time, or none at all."` — the R3 caption; the "or none at all" is deliberate, granting permission to ignore profiles, which is what a user afraid of choosing wrongly needs to hear
- `NOT_A_CHOICE_LINE = "You're protected either way. These are shortcuts, not choices."` — the R2 line, for concepts that use one

Per-concept structural labels go in the exported `TUNING_CONCEPTS_COPY` object in [conceptsCopy.ts](../../../src/app/onboarding-v2/tuned-result/conceptsCopy.ts), as five new keys alongside the existing `progressRing`, `checklist`, and `receipt` entries, matching that file's stated purpose. Each concept spec lists its own exact strings.

All of the above is tone-constant. Titles, subtitles, and summaries continue to come from `TUNING_COPY` and `copy.ts` via `useTuningConceptData`, unchanged, so switching tone still works on every concept.

---

## 7. Registration recipe

Identical for all five, so each concept spec references this section instead of restating it.

Per the one-axis decision, `TuningConcept` grows from four members to nine. In [OnboardingV2.tsx](../../../src/app/onboarding-v2/OnboardingV2.tsx):

```ts
export type TuningConcept =
  | "default" | "progress-ring" | "checklist" | "receipt"
  | "profiles-shelf" | "profiles-deck" | "profiles-draft"
  | "profiles-baseline" | "profiles-rehearsal";

export const TUNING_CONCEPTS: { value: TuningConcept; label: string }[] = [
  // ...the four existing entries, unchanged...
  { value: "profiles-baseline",  label: "Profiles — Baseline + shortcuts" },
  { value: "profiles-rehearsal", label: "Profiles — Rehearsal stage" },
  { value: "profiles-shelf",     label: "Profiles — Shelf gallery" },
  { value: "profiles-deck",      label: "Profiles — Focused deck" },
  { value: "profiles-draft",     label: "Profiles — Editable drafts" },
];
```

Then per concept:

1. Import the component at the top of `OnboardingV2.tsx` alongside the three existing concept imports.
2. Add a render block in the `phase === "tuned"` branch, keyed `key={tuningConcept}` so switching remounts, passing `jtbdKey={effectiveJtbdKey}`, `selectionMode`, `selectedJtbds`, `tone`, `userPlan={plan}`, `onBack={() => setPhase("jtbd")}`, and the plan-aware `onContinue` from §4.4.
3. Export a concept id constant from the concept file (e.g. `export const PROFILES_SHELF_CONCEPT = "profiles-shelf";`) and pass it to `ConceptFrame`'s `concept` prop, matching the existing `CHECKLIST_CONCEPT` pattern. This is the analytics id — `useTrackTuningView` and `trackTuningEvent` pick it up with no extra wiring.

**No `App.tsx` change is required.** The HUD "Concept:" dropdown maps over the exported `TUNING_CONCEPTS` array, so new entries appear automatically. This is also why the five new labels are prefixed "Profiles — ": nine options in one dropdown need the two explorations to be visually separable.

---

## 8. Build order and verification

Build order: this foundation, then [_sidebar-handoff.md](_sidebar-handoff.md), then concepts in the order `04-baseline`, `05-rehearsal`, `01-shelf`, `02-deck`, `03-draft`. Baseline first because it needs no product decision and is the smallest departure from what exists; Draft last because it is blocked on a free-profile quota decision.

Verification for this document's own work:

- `npx tsc --noEmit` clean, and `npm run build` succeeds.
- The three existing concepts (`progress-ring`, `checklist`, `receipt`) render identically before and after. `useTuningConceptData`'s behaviour is untouched (§4.3); the only shared edits they see are one added optional prop they never pass and the `ConceptFrameData` extraction (§5.4), which is structurally equivalent.
- `ConceptFrame` accepts both `TuningConceptData` and `ProfilesConceptData` without a cast or a union, and its rendered output for the three existing concepts is unchanged.
- `useProfilesConceptData` produces exactly one profile row in Single mode and one per intent in Multiple mode, and `totalRows` equals `settingRows.length + profileRows.length + plusFeatureRows.length` at every selection count from one to six.
- With six intents selected, the materialization completes without a visible stall — confirming the existing `pacingGuardRowThreshold` compression kicks in rather than needing new timing.
- `profileSettings(jtbd)` returns two entries for all six intents, with values matching `JTBD_TUNING_RESULT[jtbd].enabled` exactly.
- `effectiveProfileSettings` never returns a weaker value than the baseline it is given. Specifically: with Gaming and Privacy both selected, Gaming's profile shows Kill Switch `"Advanced"`, not `"Standard"`. Same check for Gaming plus Bypass on Protocol, where `"Stealth"` outranks `"WireGuard UDP"`.
- Every non-null `TunedProfile.country` resolves through `resolveVpnDestination` to a real marker — Netherlands, United States, and Switzerland are all present in `countryMarkers`.
- `JTBD_PROFILES` has exactly six entries, one per `JtbdId`, enforced by the `Record<JtbdId, TunedProfile>` type.
- No `effectSentence` or `deltaSentence` contains "protocol", "NAT", "IP", "port", or "encryption", and none names a third-party service.

## 9. Open items

- **Accent palette** (§2.4) — six categorical colours need design sign-off. Seeded at `#6d4aff`. Marked [UNVERIFIED].
- **Free country list** (§3.2) — `FREE_TIER_COUNTRIES` describes this prototype, not the product. Needs product confirmation. Marked [UNVERIFIED]. No concept may state a count of free countries.
- **Free entitlements** — the Deck and the Rehearsal propose free "try once" and free rehearsal, and the Draft proposes a one-profile free quota. All three are product decisions, flagged in their own specs. This foundation deliberately contains no entitlement logic, so those concepts can be built as prototype demonstrations without any of them being presented as settled product behaviour.
