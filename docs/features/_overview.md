# Feature Documentation

Living source of truth for the Mona Lisa VPN onboarding application.

## Feature Index

| Feature | Status | Doc |
|---------|--------|-----|
| Onboarding | In Progress | [onboarding.md](onboarding.md) |

## Shared Architecture

### Common Components

| Component | Path | Purpose |
|-----------|------|---------|
| `StatusGradient` | `src/imports/StatusGradient.tsx` | Top-of-viewport gradient that reflects VPN status color |
| `ConnectionDetails` | `src/imports/ConnectionDetails.tsx` | Bottom bar showing IP, country, provider, VPN status |
| `WorldMap` | `src/app/components/WorldMap.tsx` | Leaflet-based dark map with country markers and user pin |

### Shared Data

| Export | Path | Purpose |
|--------|------|---------|
| `physicalCountryData` | `src/imports/ConnectionDetails.tsx` | IP, provider per physical country |
| `VpnStatus` type | `src/app/App.tsx` | `"unprotected" \| "connecting" \| "protected"` |
| `MapLayerOption` type | `src/imports/RightVpnFeatures.tsx` | Map layer filter options |

### State Conventions

- VPN state lives in `App.tsx` and flows down via props.
- Onboarding state is local to `WorldMap` / `OnboardingOverlay`.
- Leaflet map instance is held in a ref (`mapRef`) inside `WorldMap`.

### Template

New feature docs should follow the structure in `onboarding.md`.
