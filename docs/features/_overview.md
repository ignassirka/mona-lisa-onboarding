# Feature Documentation

Living source of truth for the Mona Lisa VPN onboarding application.

## Feature Index

| Feature | Status | Doc |
|---------|--------|-----|
| Onboarding (v1) | In Progress | [onboarding.md](onboarding.md) |
| Onboarding v2 | In Progress | [onboarding-v2.md](onboarding-v2.md) |

## Shared Architecture

### Common Components

| Component | Path | Purpose |
|-----------|------|---------|
| `StatusGradient` | `src/imports/StatusGradient.tsx` | Top-of-viewport gradient that reflects VPN status color |
| `ConnectionDetails` | `src/imports/ConnectionDetails.tsx` | Bottom bar showing IP, country, provider, VPN status |
| `WorldMap` | `src/app/components/WorldMap.tsx` | Leaflet-based dark map with country markers and user pin |
| `windows-wallpaper.png` | `src/app/assets/windows-wallpaper.png` | The native Windows 11 default desktop wallpaper — used as the `background-image` on every "desktop" backdrop behind an app/onboarding window: `App.tsx`'s `.vpn-app-outer` (main app) and pre-start screen, and `OnboardingV2.tsx`'s outer wrapper. Shown identically regardless of the app's own light/dark theme (a real desktop wallpaper doesn't change with an app's theme) — replaces the previous flat dark/light theme colors on these specific backdrop elements only; the app window/onboarding window itself still themes normally. |
| `FlowOverview` | `src/app/components/FlowOverview.tsx` | Prototype-only, informational "Flow overview" screen — a diagram of the 4 onboarding stages, each with a real screenshot, a Goal, and a How sentence (see "Prototype: Flow overview" in `onboarding-v2.md`). Takes only `onBack`; doesn't read or duplicate any prototype variation state. Its 4 screenshots live in `src/app/assets/flow-overview/`. |
| `PrdOverview` | `src/app/components/PrdOverview.tsx` | Prototype-only, informational "PRD overview" screen — a stakeholder-glance diagram of the onboarding PRD's figures/principles/flow/risks (see "Prototype: PRD overview" in `onboarding-v2.md`). `FlowOverview`'s sibling: same nav/tokens/entrance. |
| `ProfilesSpotlight` | `src/app/components/ProfilesSpotlight.tsx` | One-shot coach mark shown right after onboarding hands off to the main app: dims the whole app window except a measured rect (the sidebar's Profiles list) and rings it in a glowing white border. Self-dismissing after 5s or on any click/keypress. Non-interactive (`pointer-events-none`); takes `rect` + `onDone` and exports `PROFILES_SPOTLIGHT_DURATION_MS`, so the caller owns measurement and mount/unmount (`App.tsx`, `AnimatePresence`). See "Profiles spotlight" in `onboarding-v2.md`. |

### Shared Data

| Export | Path | Purpose |
|--------|------|---------|
| `physicalCountryData` | `src/imports/ConnectionDetails.tsx` | IP, provider per physical country |
| `VpnStatus` type | `src/app/App.tsx` | `"unprotected" \| "connecting" \| "protected"` |
| `MapLayerOption` type | `src/imports/RightVpnFeatures.tsx` | Map layer filter options |
| `OnboardingExitOptions` | `src/app/lib/sessionPlan.ts` | The onboarding → main-app handoff contract: `vpnConnected`, `deferredDueToConnectionFailure`, `selectedCountry` (the Plus country pick, carried so generated sidebar profiles name the destination the tuning screen named), and `connectedProfileId` (renamed from `connectedProfileJtbd`/`JtbdId` — see `jtbdData.ts`'s `ProfileId` — set only by a per-card Connect on Profiles carousel v1/v2, or live by the main app's own sidebar Connect — drives the connection card's profile variant, see `onboarding-v2.md` → "Profile connection card"). All optional, so existing `onExit` call sites are unaffected. |
| `TunedProfile` / `JTBD_PROFILES` | `src/app/onboarding-v2/lib/jtbdProfiles.ts` | Single source of truth for what a profile IS — destination, derived settings, plain-language description. Now keyed by `ProfileId`, not `JtbdId` (7 entries: "Privacy and security" alone generates two, "Daily privacy"/"Advanced privacy" — see `onboarding-v2.md` → "Two profiles from one intent"); `TunedProfile` carries both `id: ProfileId` (this profile's own identity) and `jtbd: JtbdId` (the intent it came from). Read by the profiles-first tuning concepts, `CountryBrowser`'s generated sidebar rows, and (via `profilesForSelection`) the 4 combined profiles + features upsell layouts and the 3 features-led ones, which is what stops those screens disagreeing. Settings are always derived from `JTBD_TUNING_RESULT`, never authored. |
| `profileConfigRows` / `PROFILE_CONFIG_LABELS` / `PROFILE_PHOTO` | `src/app/onboarding-v2/lib/jtbdProfileConfig.ts` | The four-row per-profile configuration and card photography shared by Profile-first and Profiles carousel v1. One of two deliberate exceptions to "settings are always derived": three of the four values are authored, in a single table with a stated rationale, because the tuning data models them as unvalued features. Protocol is still derived. `PROFILE_CONFIG_LABELS` is also what v1's global-settings filter matches against, so a setting can never appear both on a card and as a global toggle. `[UNVERIFIED]` — pending product sign-off. |
| `PROFILE_MATRIX` / `profileMatrixRows` / `profileChips` / `PROFILE_CARD_PHOTO` | `src/app/onboarding-v2/lib/jtbdProfileMatrix.ts` | The other exception, and the table owned by the two Profiles-carousel-v2 concepts (the Plus-only original and its Free-only sibling) plus the 4 combined profiles + features upsell layouts and the 3 features-led ones (which read `PROFILE_CARD_PHOTO` and `profileChips` only), rather than by the whole screen: the nine-field product-supplied configuration matrix, plus its six-row builder, derived chips, per-profile country defaults, `resolveCountryChoice`, and the v2 portrait card artwork map (`profile-card-*.png`, 941×1672). Now keyed by `ProfileId` — 7 entries, since `privacy` alone backs two ("Daily privacy"/"Advanced privacy", see `onboarding-v2.md` → "Two profiles from one intent"). The Free concept reads the chips, artwork and nothing else — it renders no settings rows, so `profileMatrixRows` stays v2's alone. Deliberately a SECOND table rather than an edit to `jtbdProfileConfig.ts`, so v2 and v1 disagree on NetShield, port forwarding, NAT type, Protocol and three destinations — every divergence is enumerated in the file and in `onboarding-v2.md`. Chips are derived from the matrix, never authored, so a chip can't contradict the row list beneath it. `[UNVERIFIED]` — pending product sign-off. |

### State Conventions

- VPN state lives in `App.tsx` and flows down via props.
- Onboarding v1 state is local to `WorldMap` / `OnboardingOverlay`.
- Onboarding v2 is fully self-contained under `src/app/onboarding-v2/` with its own phase state machine; it reuses `StatusGradient`, the v1 pin SVG, and the scramble logic (copied into `lib/`), and uses Framer Motion (`motion/react`) for transitions. Figma-exported SVGs live in `src/app/onboarding-v2/assets/` and are imported as URLs (Vite `assetsInclude`). Tooltips use Radix `@radix-ui/react-tooltip`.
- Leaflet map instances are held in refs (`mapRef`).
- The start screen in `App.tsx` lets the user choose Onboarding v1 or v2.
- The start screen also has a secondary **"View flow overview"** button (`AppState = "overview"`) opening `FlowOverview` full-screen — a read-only diagram of the 4 onboarding stages (goal + approach per stage), with Back/Escape returning to "start". It's purely informational: no stage jumping, no variation-state chips, no state read/written — see "Prototype: Flow overview" in `onboarding-v2.md`.
- A **"View PRD details"** button (`AppState = "prd"`, same box style as "View flow overview") opens `PrdOverview` full-screen — a stakeholder-glance PRD diagram, `FlowOverview`'s sibling in nav/tokens/entrance — see "Prototype: PRD overview" in `onboarding-v2.md`.

### Template

New feature docs should follow the structure in `onboarding.md`.
