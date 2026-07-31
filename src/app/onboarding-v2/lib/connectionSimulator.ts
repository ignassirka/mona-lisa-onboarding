import type { FailureCause } from "./connectionFailureConfig";

export type { FailureCause };

/** Which attempt/slot within a failure sequence finally succeeds — chosen by
 * the prototype HUD (there is no real backend, so a cause can only be
 * demonstrated by deliberately simulating it; see checkpoint 0). `"never"`
 * means the initial pass exhausts every attempt (→ Tier 2), and a
 * subsequent Tier 2 retry ALSO exhausts (→ Tier 3). */
export type ResolvePoint = "immediate" | "remedy1" | "remedy2" | "tier2-retry" | "never";

export interface FailureSimConfig {
  /** `null` = no failure simulated at all — the untouched happy path. */
  cause: FailureCause | null;
  resolvesAt: ResolvePoint;
}

export const NO_FAILURE: FailureSimConfig = { cause: null, resolvesAt: "immediate" };

/** Causes that genuinely require the user (no internet, another VPN
 * running, an OS permission/driver problem) — none of Tier 1's own remedies
 * (retry on a different country; retry with a different connection method)
 * can plausibly fix any of these, so the sequence skips straight from the
 * single initial attempt to Tier 2 rather than burning through auto-remedies
 * that could never have worked. `"network-blocks-vpn"` and `"generic"` ARE
 * things a different server/connection method might route around, so those
 * two run the full 3-slot Tier 1 sequence. */
const USER_REQUIRED_CAUSES: readonly FailureCause[] = ["no-internet", "vpn-conflict", "permission"];

/** Number of attempt "slots" in one pass (initial attempt + auto-remedies)
 * for a given cause. 1 for user-required causes (no remedy applies), 3 for
 * causes Tier 1's remedies can plausibly resolve. */
export function sequenceLengthFor(cause: FailureCause): 1 | 3 {
  return USER_REQUIRED_CAUSES.includes(cause) ? 1 : 3;
}

/** Whether the attempt at `slotIndex` (0-based: 0 = initial/first Tier-2-retry
 * attempt, 1 = remedy 1 / different country, 2 = remedy 2 / Stealth +
 * Alternative Routing) succeeds, for the given pass. `pass` distinguishes
 * the INITIAL sequence (before any failure screen has been shown) from the
 * single Tier 2 "Try again" retry (which reruns the same sequence shape). */
export function willSucceedAtSlot(config: FailureSimConfig, pass: "initial" | "tier2-retry", slotIndex: number): boolean {
  if (!config.cause) return true; // no failure simulated — always succeeds

  if (pass === "initial") {
    switch (config.resolvesAt) {
      case "immediate":
        return slotIndex === 0;
      case "remedy1":
        return slotIndex === 1;
      case "remedy2":
        return slotIndex === 2;
      default:
        return false; // "tier2-retry" | "never" — the initial pass never succeeds
    }
  }

  // pass === "tier2-retry"
  return config.resolvesAt === "tier2-retry" && slotIndex === 0;
}

export interface FailureSimPreset {
  id: string;
  label: string;
  config: FailureSimConfig;
}

/** Prototype HUD presets — since nothing about a failure cause is actually
 * detectable (checkpoint 0: the connect simulation always succeeds and
 * exposes no error model), this is the only way to demo the failure path.
 * One preset per user-required cause (simplified — confirmed at checkpoint:
 * the 2 Tier-1-amenable causes' "auto-resolves" demo was dropped entirely,
 * leaving only the 3 causes that genuinely require the user and always run
 * the full three-tier journey via `resolvesAt: "never"` — Tier 1 → Tier 2 →
 * retry also fails → auto-exit to app, exercising the deferred-onboarding
 * path). `network-blocks-vpn`/`generic` causes and their Tier 1 auto-remedy
 * logic (`sequenceLengthFor`, `willSucceedAtSlot`'s `remedy1`/`remedy2`
 * branches) remain fully intact in the underlying model — simply
 * undemoable from this dropdown now, same as before this simplification for
 * any cause/resolution-point combination that wasn't given its own preset. */
export const FAILURE_SIM_PRESETS: FailureSimPreset[] = [
  { id: "none", label: "Successful connection", config: NO_FAILURE },
  { id: "no-internet", label: "No internet", config: { cause: "no-internet", resolvesAt: "never" } },
  { id: "vpn-conflict", label: "Another VPN running", config: { cause: "vpn-conflict", resolvesAt: "never" } },
  { id: "permission", label: "Permission problem", config: { cause: "permission", resolvesAt: "never" } },
];

export function resolveFailureSimPreset(id: string): FailureSimConfig {
  return FAILURE_SIM_PRESETS.find((p) => p.id === id)?.config ?? NO_FAILURE;
}
