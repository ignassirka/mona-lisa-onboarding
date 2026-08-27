import { Check, Play, ShieldCheck } from "lucide-react";
import { Flag } from "../../../../components/flagComponents";
import ComparisonStrip from "./ComparisonStrip";
import { BASELINE_NAME, PLUS_AVAILABILITY_LABEL } from "../../profiles/profilesCopy";
import { TUNING_CONCEPTS_COPY } from "../../conceptsCopy";
import vpnPlusBadgeUrl from "../../../assets/vpn-plus-badge.svg";
import type { TunedProfile } from "../../../lib/jtbdProfiles";
import type { ComparisonRow } from "./comparisonRows";

const C = TUNING_CONCEPTS_COPY.profilesDeck;

interface DeckCardProps {
  /** Null for the trailing "Everything at once" card. */
  profile: TunedProfile | null;
  rows: ComparisonRow[];
  unlocked: boolean;
  tried: boolean;
  kept: boolean;
  /** False while the applying sequence is still running — a user can't try a
   * profile while settings are mid-flight. */
  interactive: boolean;
  /** Rows past this count are still materializing. */
  visibleRowCount?: number;
  onTry: () => void;
  onKeep: () => void;
  reduced: boolean;
}

/** One focused card: a complete detail view, big enough to be understood
 * without the screen doing anything else. Upper half is the destination
 * visual, lower half is the before-and-after. */
export default function DeckCard({
  profile,
  rows,
  unlocked,
  tried,
  kept,
  interactive,
  visibleRowCount,
  onTry,
  onKeep,
  reduced,
}: DeckCardProps) {
  const isBaseline = profile === null;
  const flagCountry = profile?.country ?? null;

  return (
    <div className="flex w-full flex-col gap-[16px] rounded-[14px] border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.04)] p-[20px]">
      {/* Destination visual — a real flag where the profile targets a fixed
          country, the intent glyph where it targets a rule instead. */}
      <div className="flex items-center gap-[12px]">
        {isBaseline ? (
          <span className="flex size-[32px] shrink-0 items-center justify-center rounded-full bg-[rgba(44,255,204,0.15)]">
            <ShieldCheck size={19} strokeWidth={2} className="text-[rgba(44,255,204,0.9)]" />
          </span>
        ) : flagCountry ? (
          <Flag name={flagCountry} size="lg" />
        ) : (
          <img src={profile.icon} alt="" className="size-[32px] shrink-0 opacity-90" />
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <span
            className="truncate font-['Segoe_UI_Variable',sans-serif] text-[19px] font-semibold leading-[25px] text-white"
            style={{ fontFeatureSettings: '"fina" 1, "init" 1' }}
          >
            {isBaseline ? C.everythingCardName : profile.name}
          </span>
          <span className="truncate font-['Segoe_UI_Variable',sans-serif] text-[13px] leading-[18px] text-[rgba(255,255,255,0.55)]">
            {isBaseline ? BASELINE_NAME : profile.countryLabel}
          </span>
        </div>

        {!isBaseline && !unlocked && !profile.freeRunnable ? (
          <img src={vpnPlusBadgeUrl} alt={PLUS_AVAILABILITY_LABEL} className="h-[14px] w-[24px] shrink-0" />
        ) : null}
      </div>

      {isBaseline ? (
        <p className="font-['Segoe_UI_Variable',sans-serif] text-[14px] leading-[20px] text-[rgba(255,255,255,0.7)]">
          {C.everythingCardBody}
        </p>
      ) : null}

      <ComparisonStrip rows={rows} reduced={reduced} visibleCount={visibleRowCount} />

      {/* The baseline card has no actions — it's already running, so
          offering to "try" or "keep" it would be incoherent. */}
      {isBaseline ? (
        <span className="flex items-center gap-[6px] font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-[rgba(44,255,204,0.9)]">
          <Check size={13} strokeWidth={3} />
          On now
        </span>
      ) : (
        <div className="flex flex-col gap-[8px]">
          <div className="flex items-center gap-[8px]">
            {tried ? (
              <span className="flex items-center gap-[6px] rounded-[8px] bg-[rgba(44,255,204,0.12)] px-[12px] py-[7px] font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-[rgba(44,255,204,0.95)]">
                <Check size={13} strokeWidth={3} />
                {C.triedLabel}
              </span>
            ) : (
              <button
                type="button"
                disabled={!interactive}
                onClick={onTry}
                className="flex items-center gap-[6px] rounded-[8px] bg-[rgba(255,255,255,0.1)] px-[12px] py-[7px] font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] text-white outline-none transition-colors duration-150 hover:bg-[rgba(255,255,255,0.16)] focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-35"
              >
                <Play size={12} strokeWidth={2.5} />
                {C.tryLabel}
              </button>
            )}

            {/* Keeping is what Plus sells here — the one-time try is free,
                so the badge belongs on permanence, not on access. */}
            <button
              type="button"
              disabled={!interactive}
              onClick={onKeep}
              aria-pressed={kept}
              className={`flex min-w-0 items-center gap-[6px] rounded-[8px] px-[12px] py-[7px] font-['Segoe_UI_Variable',sans-serif] text-[13px] font-semibold leading-[18px] outline-none transition-colors duration-150 focus-visible:ring-1 focus-visible:ring-white/40 disabled:opacity-35 ${
                kept
                  ? "bg-[rgba(44,255,204,0.12)] text-[rgba(44,255,204,0.95)]"
                  : "text-[rgba(255,255,255,0.65)] hover:bg-[rgba(255,255,255,0.06)] hover:text-white"
              }`}
            >
              {kept ? <Check size={13} strokeWidth={3} /> : null}
              <span className="truncate">{kept ? "In your sidebar" : C.keepLabel}</span>
              {!unlocked && !kept ? <img src={vpnPlusBadgeUrl} alt="" className="h-[12px] w-[20px] shrink-0" /> : null}
            </button>
          </div>

          {/* A free run of a Plus destination substitutes a free location
              rather than being blocked — and says so, so nothing on screen
              can be mistaken for a connection it isn't. */}
          {!unlocked && !profile.freeRunnable ? (
            <span className="font-['Segoe_UI_Variable',sans-serif] text-[12px] leading-[16px] text-[rgba(255,255,255,0.45)]">
              {C.freeLocationSubstitution}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
