# Onboarding

## Purpose

Cinematic first-run experience that introduces the user to the app through progressive disclosure. Three-act narrative arc:
1. **Screen 1** — Establishes the threat ("They know who you are")
2. **Surveillance Simulation** — Live demonstration of tracking (rays + search bar)
3. **Screen 2** — Offers the resolution ("What if you could disappear?") and triggers VPN connect

## Status

In Progress — All three screens are implemented.

## Key User Flows

### Screen 1 — "They know who you are"

1. **App launch** — Black screen visible for ~600ms while map tiles load underneath.
2. **Map reveal** — Black overlay fades out over 1.2s, map becomes visible at world zoom.
3. **Zoom to location** — Map flies to Belarus at zoom 5 (~2s). Pin anchored to right side of viewport.
4. **Pin + gradient** — Red user-location pin fades in (0.6s), red status gradient fades in (0.8s).
5. **Text disclosure** — Left-side content with staggered fade+blur+slide (380ms stagger, 900ms each):
   - Heading, subtitle with ISP name, detail rows (IP, Country, Coordinates, Device), warning, Continue button
6. **Continue** — Transitions to surveillance simulation.

### Surveillance Simulation (Screen 1.5)

1. **Screen 1 exit** — Text fades out (800ms).
2. **Search bar** — Frosted glass URL bar slides in from top with broken lock icon.
3. **Typewriter** — Auto-types three URLs sequentially (40-70ms per char, randomized):
   - `what are the best flights to lisbon`
   - `booking.com/flights/lisbon`
   - `protonmail.com/inbox`
4. **Surveillance rays** — SVG lines animate from user pin to 9 global nodes in 3 waves:
   - Wave 0 (search): ISP Relay (Minsk), DNS Resolver (Frankfurt)
   - Wave 1 (browsing): Google Ads (Mountain View), Data Broker (Virginia), Meta (Dublin)
   - Wave 2 (email): Government SORM (Moscow, amber), Analytics (London), CDN (Singapore), Cookie Sync (Tokyo)
5. **Each ray** has: stroke-dasharray draw animation (600ms), glow duplicate, pulsing endpoint dot, label fade-in, data packet circles traveling along the path.
6. **Map zoom out** — After all rays drawn, map zooms out to zoom 3 to show the full web.
7. **Counter** — "3 searches. 9 connections. Your data is everywhere." fades in centered.
8. **"Protect yourself"** — Button fades in after 2s hold.
9. **Ray retraction** — On button click, all rays retract (800ms reverse animation), then transition to Screen 2.

### Screen 2 — "What if none of them knew who you are?"

1. **Beat pause** — 600ms silence after simulation exits.
2. **Question** — "What if none of them knew who you are?" fades in centered (900ms, blur+slide).
3. **Continue button** — Appears 1.5s after question.
4. **Continue** — User clicks Continue. Text fades out (800ms). Transitions to country picker.

### Screen 3 — Country Picker

1. **Panel slide-in** — Simplified frosted glass panel slides in from the left edge (700ms).
2. **Heading** — "Choose your shield" with subtitle, staggered fade+blur animation.
3. **Country list** — 8 curated privacy-focused countries with flags, staggered reveal (80ms apart):
   - Switzerland (tagged "Fastest"), Netherlands, Sweden, Iceland, Germany, Japan, United States, Singapore
4. **Selection** — User clicks a country. VPN connect fires immediately.
5. **Transition** — Red pin turns green, gradient red → green.
6. **Completion** — 1.5s after "protected" reached, onboarding set to "done". Post-connect behavior deferred for future steps.

## Data Model

Uses `physicalCountryData` from `ConnectionDetails.tsx`:

| Field | Type | Example |
|-------|------|---------|
| `ip` | `string` | `"158.6.140.191"` |
| `provider` | `string` | `"Белтелеком"` |
| `coordinates` | `string` | `"53.9°N, 27.6°E"` |

Device label derived from `navigator.userAgent` at runtime (OS only).

Surveillance nodes hardcoded for Belarus origin (`53.7°N, 27.9°E`).

## Components

| Component | Path | Purpose |
|-----------|------|---------|
| `OnboardingOverlay` | `src/app/components/OnboardingOverlay.tsx` | Screen state machine, black screen, text content, timing |
| `SurveillanceSimulation` | `src/app/components/SurveillanceSimulation.tsx` | Search bar, typewriter, SVG ray overlay, counter, retraction |
| `OnboardingCountryPicker` | `src/app/components/OnboardingCountryPicker.tsx` | Simplified left panel with curated country list, flags, slide-in animation |
| `FadeSlideItem` | (internal to OnboardingOverlay) | Reusable staggered animation wrapper |
| `DetailPill` | (internal to OnboardingOverlay) | Label + value horizontal row |

## Routes

N/A — Single-page app, onboarding is an overlay within `WorldMap`.

## Integration Points

| Host Component | What it does |
|----------------|-------------|
| `WorldMap.tsx` | Renders `OnboardingOverlay`, passes `mapRef`, `vpnStatus`, `onConnect`; reacts to phase callbacks |
| `App.tsx` | Left panel hidden, `panelWidth={0}`; "Start onboarding" splash gates mount |

## State Management

| State | Location | Purpose |
|-------|----------|---------|
| `onboardingPhase` | `WorldMap.tsx` | `black` → `fade-map` → `fly-to` → `show-pin` → `show-details` → `show-text` → `simulation` → `screen2` → `connecting` → `done` |
| `screen` | `OnboardingOverlay.tsx` | `1` → `s1-exit` → `sim` → `sim-exit` → `2` → `s2-exit` → `picker` → `connecting` → `complete` |
| `phase` | `SurveillanceSimulation.tsx` | `bar-in` → `typing` → `done` → `counter` → `retracting` |
| `activeRays` | `SurveillanceSimulation.tsx` | Array of currently visible rays with pixel coordinates |
| `onboardingStarted` | `App.tsx` | Gates start splash vs main experience |

## Animation Timing

### Screen 1 (from app mount)

| Time (ms) | Event |
|-----------|-------|
| 0 | Black screen |
| 600 | Black fades out (1200ms) |
| 1800 | flyTo begins |
| 3800 | Pin + gradient fade in |
| 5000 | Text stagger begins |

### Surveillance Simulation (from Continue click)

| Time (ms) | Event |
|-----------|-------|
| 0 | Screen 1 fades out (800ms) |
| 400 | Search bar slides in |
| 400 | Typing + Wave 0 rays |
| 2400 | URL switches to booking.com + Wave 1 |
| 4500 | URL switches to protonmail.com + Wave 2 |
| 6200 | Typing stops, search bar fades, map zooms out |
| 7400 | Counter fades in |
| 9400 | "Protect yourself" button fades in |

### Screen 2 (from Protect yourself click)

| Time (ms) | Event |
|-----------|-------|
| 0 | Rays retract (800ms) |
| 800 | Transition to Screen 2 |
| 1400 | "What if you could disappear?" fades in |
| 2900 | Connect button fades in |
| (click) | VPN connects, +3s → protected, +1.5s → done |

## Map Interaction

Map locked during entire onboarding. `SurveillanceSimulation` directly calls `map.flyTo()` for zoom-out via the threaded `mapRef`.

## Dependencies on Shared Code

- `physicalCountryData` from `ConnectionDetails.tsx`
- `StatusGradient` component
- `VpnStatus` type from `App.tsx`
- Leaflet `flyTo`, `latLngToContainerPoint` APIs
- `onConnect` callback from `App.tsx`
