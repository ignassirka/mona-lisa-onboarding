import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useScramble } from "../lib/scramble";
import type { ConnectionPhase } from "../types";
import { HYBRID_TIMING, sec } from "./timing";

interface LocationChipProps {
  phase: ConnectionPhase;
  country: string;
  countryCode: string;
  ip: string;
  /** True once the (fallback) IP data has resolved — shows a skeleton until
   * then, mirroring the loading idiom `InfoCard`/`MaskedValue` already use
   * elsewhere for the same "never block the opening on the API" rule. */
  isLive: boolean;
  reduced: boolean;
  /** The resolved VPN destination shown in Act 3 (protected) — "Fastest
   * country"'s `VPN_SERVER` by default, or the Plus user's explicitly
   * selected country (`resolveVpnDestination`, `lib/server.ts`). Passed in
   * rather than imported directly so this component never has to know
   * whether a selection was made — it only ever renders the ALREADY-
   * resolved real destination, honest either way. */
  vpnCountry: string;
  vpnCountryCode: string;
  vpnIp: string;
}

/** The new location+IP pill: {flag} {country} · {IP}. A single persistent
 * container across all three acts — its real values scramble to asterisks in
 * Act 2 (via `useScramble`), then the container's inner content crossfades
 * to the resolved VPN identity in Act 3 (VPN IP in teal). The container
 * itself never unmounts; only its inner content swaps. */
export default function LocationChip({ phase, country, countryCode, ip, isLive, reduced, vpnCountry, vpnCountryCode, vpnIp }: LocationChipProps) {
  // Starts `chipScrambleDelay` after connecting begins, coordinated with the
  // map's flyTo so the location/IP "goes dark" as the VPN connects.
  const [scrambling, setScrambling] = useState(false);
  useEffect(() => {
    if (phase !== "connecting") {
      setScrambling(false);
      return;
    }
    const delay = reduced ? 0 : HYBRID_TIMING.chipScrambleDelay;
    const id = window.setTimeout(() => setScrambling(true), delay);
    return () => window.clearTimeout(id);
  }, [phase, reduced]);

  const scrambledCountry = useScramble(country, scrambling, { durationMs: HYBRID_TIMING.chipScrambleDuration, reduced });
  const scrambledIp = useScramble(ip, scrambling, { durationMs: HYBRID_TIMING.chipScrambleDuration, reduced });

  return (
    <motion.div
      className="flex items-center gap-[10px] rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.06)] px-[16px] py-[9px] backdrop-blur-[2px]"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: sec(HYBRID_TIMING.chipAppear), duration: 0.5, ease: "easeOut" }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {!isLive ? (
          <motion.div key="loading" className="flex items-center gap-[8px]" exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <span className="h-[14px] w-[20px] shrink-0 animate-pulse rounded-[3px] bg-[rgba(255,255,255,0.18)]" />
            <span className="h-[14px] w-[80px] animate-pulse rounded-[4px] bg-[rgba(255,255,255,0.18)]" />
            <span className="h-[14px] w-[70px] animate-pulse rounded-[4px] bg-[rgba(255,255,255,0.18)]" />
          </motion.div>
        ) : phase !== "protected" ? (
          <motion.div key="real" className="flex items-center gap-[8px]" exit={{ opacity: 0, transition: { duration: 0.2 } }}>
            <motion.img
              src={`https://flagcdn.com/${countryCode}.svg`}
              alt=""
              className="h-[14px] w-[20px] shrink-0 rounded-[3px] object-cover"
              animate={{ opacity: scrambling ? 0.35 : 1 }}
              transition={{ duration: sec(HYBRID_TIMING.chipScrambleDuration) }}
            />
            <span
              className={`whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[18px] text-white transition-colors duration-300 ${scrambling ? "text-[rgba(255,255,255,0.6)] tracking-[0.04em]" : ""}`}
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {scrambledCountry}
            </span>
            <span className="text-[rgba(255,255,255,0.3)]">·</span>
            <span
              className={`whitespace-nowrap font-mono text-[13px] leading-[18px] text-[rgba(255,255,255,0.85)] transition-colors duration-300 ${scrambling ? "text-[rgba(255,255,255,0.6)] tracking-[0.04em]" : ""}`}
            >
              {scrambledIp}
            </span>
          </motion.div>
        ) : (
          <motion.div
            key="vpn"
            className="flex items-center gap-[8px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <img
              src={`https://flagcdn.com/${vpnCountryCode}.svg`}
              alt=""
              className="h-[14px] w-[20px] shrink-0 rounded-[3px] object-cover"
            />
            <span
              className="whitespace-nowrap font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[18px] text-white"
              style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
            >
              {vpnCountry}
            </span>
            <span className="text-[rgba(255,255,255,0.3)]">·</span>
            <span className="whitespace-nowrap font-mono text-[13px] leading-[18px] text-[#2cffcc]">{vpnIp}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
