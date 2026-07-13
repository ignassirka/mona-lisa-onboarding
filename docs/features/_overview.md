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

### Shared Data

| Export | Path | Purpose |
|--------|------|---------|
| `physicalCountryData` | `src/imports/ConnectionDetails.tsx` | IP, provider per physical country |
| `VpnStatus` type | `src/app/App.tsx` | `"unprotected" \| "connecting" \| "protected"` |
| `MapLayerOption` type | `src/imports/RightVpnFeatures.tsx` | Map layer filter options |

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
